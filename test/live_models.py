"""Paid, opt-in semantic probe. Uses only two named models via OpenCode's stateless text API."""
import argparse
import json
import os
import re
import secrets
import shutil
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from host_probe import backend, LABEL, PACKAGE


KIMI = 'k3.1-pro'
MIMO = 'mimo-v2.6-flash'
AMEND = '采购联系人改为青禾。其余决定沿用，先只回一句已记下。'
QUESTION = ('现在是进度问询，今天的交接只给一份。用一个 JSON 对象回答现行状态。'
            '表名 title，场地 site，预算整数 budget，封签底纹编号 seal，已验收的纸样回执 receipt，'
            '采购联系人 owner，当前可以直接外发吗 send（布尔值），今天交接份数 copies（整数）。'
            '没有依据的字段写 null。只回 JSON。')
BASE = dict(title='潮汐读数卡', site='南三栈', budget=730, seal='S8Q-41', receipt='YJ-672', owner='林帆', send=False, copies=1)
REDACTED = '<conversation-checkpoint>已整理巡检资料，后续在当前会话继续。</conversation-checkpoint>'
ASK_SEAL = '请只回复一个 JSON 对象，seal 填纸袋上记载的封签底纹编号。没有依据就填 null。'


def history(root, model):
    at = int(time.time() * 1000) - 100000
    texts = ['只推进潮汐读数卡。场地北二堤，预算460元。采购联系人林帆，常规交接两份。最早方案允许完成后直接外发。']
    inserts = {
        3: '标签底纹样片在纸袋里。纸袋上的封签底纹编号为 S8Q-41。',
        7: '场地改为南三栈，预算改为730元。撤回之前的外发授权，等我验收同意后才能外发。',
        18: '纸样检查有正式回执 YJ-672，已验收的是纸样。成品仍等我单独验收。',
    }
    for i in range(2, 25):
        texts.append(inserts.get(i, f'整理第{i}袋的观察草表，边注提到了小潮、量筒和蓝色纸带。'))
    rows = []
    for n, text in enumerate(texts):
        for role in ('user', 'assistant'):
            seq = len(rows)
            row = {'id': f'msg_sample_{seq:04d}', 'type': role, 'time': {'created': at + seq * 100}}
            if role == 'user':
                row['text'] = text
            else:
                row.update(agent='build', model={'providerID': 'trial', 'id': model}, finish='stop',
                           content=[{'type': 'text', 'text': f'第{n+1}项已登记。'}])
                row['time']['completed'] = at + seq * 100 + 5
            rows.append(row)
    return {'info': {'id': 'ses_semantic', 'title': 'Synthetic reading-card fixture', 'projectID': 'global',
                     'location': {'directory': str(root/'workspace')}, 'time': {'created': at, 'updated': at+50000},
                     'cost': 0, 'tokens': {'input': 0, 'output': 0, 'reasoning': 0, 'cache': {'read': 0, 'write': 0}}},
            'messages': rows}


def answer_fields(text):
    stripped = re.sub(r'^\s*```(?:json)?\s*|\s*```\s*$', '', text, flags=re.I).strip()
    try:
        value = json.loads(stripped)
    except ValueError:
        return {}
    return value if isinstance(value, dict) else {}


def score(text, expected):
    response = answer_fields(text)
    return {k: response.get(k) for k in expected}, [
        k for k, v in expected.items() if type(response.get(k)) is type(v) and response[k] == v]


class LiveCalls:
    def __init__(self, binary, provider, model, limit, cwd, check_recall):
        if model not in (KIMI, MIMO):
            raise ValueError('Unexpected live model')
        self.binary, self.provider, self.model, self.limit, self.cwd = binary, provider, model, limit, cwd
        self.calls = 0
        self.captured = []
        self.error = None
        self.check_recall = check_recall
        self.tool_requests = []
        self.fixed_summary_sent = False

    def generate(self, messages, tools=()):
        if self.calls >= self.limit or self.error:
            raise RuntimeError('Case request limit reached or a previous request failed')
        # Let OpenCode handle provider authentication. Its public text endpoint takes a
        # single string; role labels are preserved in that string, not in the wire protocol.
        contract = ''
        if tools:
            contract = ('本步可选工具见下文。若要调用，请只返回 {"call":"工具名","arguments":{...}}，'
                        '否则直接回答用户。\n' + json.dumps(tools,ensure_ascii=False) + '\n')
        prompt = ('下列 JSON 是按时间排列的一次 OpenCode 文字请求，每项列出原角色和正文。'
                  '作为该对话的助手，遵循其中的 system 消息，响应最后的要求。直接输出助手正文。\n' + contract
                  + json.dumps(messages, ensure_ascii=False, separators=(',', ':')))
        payload = {'model': {'providerID': self.provider, 'id': self.model}, 'prompt': prompt}
        self.calls += 1
        request = subprocess.run([self.binary, 'api', 'POST', '/api/experimental/generate/text',
                                  '--data', json.dumps(payload, ensure_ascii=False), '--log-level', 'none'],
                                 capture_output=True, text=True, cwd=self.cwd, timeout=180)
        body = {}
        try:
            body = json.loads(request.stdout)
            if request.returncode != 0:
                raise ValueError()
            reply = body['data']['text']
            if not isinstance(reply, str) or not reply.strip():
                raise ValueError()
        except (ValueError, KeyError, TypeError):
            # Keep vendor response bodies and authentication headers out of test output.
            status = re.search(r'\b[45]\d\d\b', request.stderr + request.stdout)
            tag = body.get('_tag', '') if isinstance(body,dict) else ''
            reason = body.get('reason', '') if isinstance(body,dict) else ''
            detail = ' '.join(s for s in (tag, reason) if isinstance(s,str) and re.fullmatch(r'[\w.]+',s))
            raise RuntimeError('OpenCode text generation failed, CLI %d, HTTP %s (%s)' %
                               (request.returncode, status.group() if status else 'unknown', detail)) from None
        print(f'{self.model}: generation {self.calls}/{self.limit} complete', flush=True)
        return reply


class Relay(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        calls = self.server.calls
        try:
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            if self.path != '/v1/chat/completions' or body.get('model') != calls.model:
                raise ValueError('Unexpected model or route')
            messages = [{k:v for k,v in m.items() if k in ('role','content','tool_calls','tool_call_id')} for m in body['messages']]
            calls.captured.append(messages)
            delta, finish = self.completion(calls, messages, body.get('tools', []))
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.end_headers()
            for delta, finish in ((delta, None), ({}, finish)):
                event = {'id':'fixture', 'object':'chat.completion.chunk', 'created':1, 'model':calls.model,
                         'choices':[{'index':0, 'delta':delta, 'finish_reason':finish}]}
                self.wfile.write(b'data: ' + json.dumps(event).encode() + b'\n\n')
            self.wfile.write(b'data: [DONE]\n\n')
        except Exception as error:
            calls.error = error
            self.send_error(400, 'Trial stopped')

    def completion(self, calls, messages, tools):
        available = []
        if calls.check_recall:
            if not calls.fixed_summary_sent:
                if 'structured summary' not in str(messages[-1]):
                    raise ValueError('Expected a native compaction before the recall trial')
                calls.fixed_summary_sent = True
                return {'role':'assistant','content':'## Objective\n核对巡检资料。'}, 'stop'
            if not calls.tool_requests:
                available = [t['function'] for t in tools if t['function']['name'] == 'loop_recall']
                if not available: raise ValueError('Recall is not available to the runner')
        reply = calls.generate(messages, available)
        result = answer_fields(reply)
        if available and result.get('call') == 'loop_recall' and isinstance(result.get('arguments'), dict):
            args = result['arguments']
            calls.tool_requests.append(args)
            return {'role':'assistant','tool_calls':[{'index':0,'id':'call_archive','type':'function',
                    'function':{'name':'loop_recall','arguments':json.dumps(args,ensure_ascii=False)}}]}, 'tool_calls'
        return {'role':'assistant','content':reply}, 'stop'


def run_case(binary, provider, model, enabled, paired=False, check_recall=False):
    with tempfile.TemporaryDirectory(prefix='ocx-semantic-', dir='/private/tmp') as directory:
        root = Path(directory)
        config = root/'config/opencode'
        for path in (config, root/'workspace', root/'home', root/'tmp', root/'runtime'):
            path.mkdir(parents=True)
        package = root/'long-conversation-loop'
        if enabled:
            package.mkdir()
            for name in ('skills', 'src'):
                shutil.copytree(PACKAGE/name, package/name)
            shutil.copyfile(PACKAGE/'package.json', package/'package.json')
        limit = (4 if model == KIMI and not check_recall else 2) + (2 if paired else 0)
        calls = LiveCalls(binary, provider, model, limit, root/'workspace', check_recall)
        with ThreadingHTTPServer(('127.0.0.1', 0), Relay) as relay:
            relay.calls = calls
            threading.Thread(target=relay.serve_forever, daemon=True).start()
            env = {'PATH':os.defpath, 'HOME':str(root/'home'), 'TMPDIR':str(root/'tmp'),
                   'OPENCODE_TEST_HOME':str(root/'home'), 'OPENCODE_CONFIG_DIR':str(config),
                   'OPENCODE_DISABLE_PROJECT_CONFIG':'1', 'OPENCODE_DISABLE_MODELS_FETCH':'1',
                   'OPENCODE_DISABLE_AUTOUPDATE':'1', 'OPENCODE_PASSWORD':secrets.token_urlsafe(20),
                   'OPENCODE_CLIENT':'desktop', 'XDG_RUNTIME_DIR':str(root/'runtime')}
            env.update({'XDG_'+k.upper()+'_HOME':str(root/k) for k in ('cache','config','data','state')})
            (root/'catalog.json').write_text('{}')
            env['OPENCODE_MODELS_PATH'] = str(root/'catalog.json')
            cfg = {'model':'trial/'+model,'update':'disable','plugins':[package.as_uri()] if enabled else [],
                   'compaction':{'auto':False,'background':False,'keep':{'tokens':0}},
                   'providers':{'trial':{'name':'isolated', 'package':'aisdk:@ai-sdk/openai-compatible',
                   'settings':{'apiKey':'local-only','baseURL':f'http://127.0.0.1:{relay.server_port}/v1'},
                   'models':{model:{'name':model,'limit':{'context':64000,'output':8000},
                                    'capabilities':{'tools':True,'input':['text'],'output':['text']}}}}}}
            (config/'opencode.json').write_text(json.dumps(cfg))
            try:
                with backend(binary,root,env) as api:
                    deadline = time.monotonic()+15
                    while True:
                        plugins = api('/api/plugin')
                        active = any(p['id']=='long-conversation-loop' and p['state']['status']=='active' for p in plugins)
                        if active == enabled: break
                        if time.monotonic() >= deadline: raise RuntimeError('Plugin did not activate')
                        time.sleep(.15)
                    api('/api/experimental/session/import',history(root,model))
                    route = '/api/session/ses_semantic'
                    def wait_for(predicate):
                        end = time.monotonic()+195
                        while time.monotonic()<end:
                            if calls.error:
                                raise calls.error
                            rows = api('/api/experimental/session/ses_semantic/export')['messages']
                            result = predicate(rows)
                            if result:
                                return result
                            time.sleep(.35)
                        raise TimeoutError('No terminal runner record')
                    def compact(n):
                        marker = 'msg_semantic_compact'+str(n)
                        api(route+'/compact',{'id':marker})
                        wait_for(lambda rows:any(r['id']==marker and r.get('status')=='completed' for r in rows))
                    def turn(text):
                        def result(rows):
                            pos = next((i for i,r in enumerate(rows) if r.get('text')==text), len(rows))
                            return next((p['text'] for r in rows[pos+1:] if r['type']=='assistant' and r.get('finish')=='stop'
                                         for p in r['content'] if p['type']=='text' and p.get('text')), None)
                        api(route+'/prompt',{'text':text})
                        return wait_for(result)
                    compact(1)
                    if check_recall:
                        reply = turn(ASK_SEAL)
                        final = calls.captured[-1]
                        assert any(LABEL in str(m['content']) for m in final)
                        returned = any(m['role']=='tool' and BASE['seal'] in str(m['content']) for m in final)
                        print(json.dumps({'model':model,'calls':calls.calls,'recall':calls.tool_requests,
                                          'tool_returned_seal':returned,'score':score(reply,{'seal':BASE['seal']})},ensure_ascii=False),flush=True)
                        return
                    expected = dict(BASE)
                    if model == KIMI:
                        turn(AMEND)
                        compact(2)
                        expected['owner'] = '青禾'
                    reply = turn(QUESTION)
                    final = calls.captured[-1]
                    assert sum(LABEL in str(m['content']) for m in final) == int(enabled)
                    rows = [('natural', *score(reply,expected))]
                    if paired:
                        altered = []
                        for m in final:
                            if m['role']=='user' and '<conversation-checkpoint>' in str(m['content']) and LABEL not in str(m['content']):
                                altered.append({'role':'user','content':REDACTED})
                            else:
                                altered.append(m)
                        assert altered != final
                        without = [m for m in altered if LABEL not in str(m['content'])]
                        assert len(without)+1 == len(altered)
                        for label,messages in [('lossy_no_reminder',without),('lossy_with_reminder',altered)]:
                            rows.append((label,*score(calls.generate(messages),expected)))
                    print(json.dumps({'model':model,'plugin':enabled,'calls':calls.calls,'scores':rows},ensure_ascii=False),flush=True)
            finally:
                relay.shutdown()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('case', choices=['kimi-control','kimi-plugin','mimo-plugin','kimi-recall'])
    parser.add_argument('--provider', required=True, help='the configured provider ID from opencode models')
    parser.add_argument('--live', action='store_true', required=True, help='allow paid model generation')
    parser.add_argument('--binary', type=Path, default=Path('/Applications/OpenCode.app/Contents/Resources/opencode-cli'))
    args = parser.parse_args()
    run_case(args.binary.resolve(), args.provider, MIMO if args.case=='mimo-plugin' else KIMI,
             args.case!='kimi-control', paired=args.case=='kimi-plugin', check_recall=args.case=='kimi-recall')
