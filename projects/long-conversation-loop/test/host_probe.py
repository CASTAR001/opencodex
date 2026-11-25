"""Exercise the Desktop-bundled OpenCode runner against a loopback model and a fresh profile."""
import argparse
import base64
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import secrets
import selectors
import subprocess
import tempfile
import threading
import time
from uuid import uuid4
from urllib.error import HTTPError
from urllib.request import Request, urlopen


PACKAGE = Path(__file__).resolve().parents[1]
LABEL = '【长对话续接 · 历史资料】'


class Model(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        messages = body['messages']
        compact = 'structured summary' in str(messages[-1]) or 'existing checkpoint' in str(messages[-1])
        self.server.requests.append((compact, messages))
        if compact and self.server.hold:
            self.server.started.set()
            assert self.server.release.wait(10), 'test did not release compaction'
        # Deliberately lose the objective and amendment in the summary.
        output = '## Objective\n- Fixture.\n## Work State\n### Completed\n- Checked.' if compact else 'Acknowledged.'
        tokens = 52000 if self.server.pressure and not compact else 150
        self.server.pressure = False
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.end_headers()
        def send(delta, reason=None, usage=None):
            chunk = {'id': 'fixture', 'object': 'chat.completion.chunk', 'created': 1, 'model': 'demo',
                     'choices': [{'index': 0, 'delta': delta, 'finish_reason': reason}]}
            if usage:
                chunk['usage'] = usage
            self.wfile.write(b'data: ' + json.dumps(chunk).encode() + b'\n\n')
        tool = None
        if not compact and messages[-1]['role'] == 'user':
            if messages[-1]['content'] == 'SAVE_PROGRESS':
                tool = ('loop_checkpoint', {'constraints': ['await approval'], 'done': ['SHELF_PROOF_52'], 'next': ['review'], 'superseded': ['publish immediately']})
            if messages[-1]['content'] == 'FETCH_EARLY':
                tool = ('loop_recall', {'endingAt': 2, 'query': 'CANCEL_PUSH_81'})
        if tool:
            assert tool[0] in [t['function']['name'] for t in body['tools']], 'missing fixture tool: ' + tool[0]
            send({'role': 'assistant', 'tool_calls': [{'index':0, 'id': 'call_'+uuid4().hex, 'type':'function',
                 'function': {'name':tool[0], 'arguments':json.dumps(tool[1])}}]})
        else:
            send({'role': 'assistant', 'content': output})
        send({}, 'tool_calls' if tool else 'stop', {'prompt_tokens': tokens, 'completion_tokens': 10, 'total_tokens': tokens + 10})
        self.wfile.write(b'data: [DONE]\n\n')


@contextmanager
def backend(binary, root, env):
    with (root/'server.log').open('ab') as log:
        proc = subprocess.Popen([binary, 'serve', '--stdio', '--hostname', '127.0.0.1', '--port', '0'],
                                env=env, cwd=root/'workspace', stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=log)
        try:
            with selectors.DefaultSelector() as selector:
                selector.register(proc.stdout, selectors.EVENT_READ)
                assert selector.select(30), 'Isolated OpenCode startup timed out'
            origin = json.loads(proc.stdout.readline())['url']
            assert origin.startswith('http://127.0.0.1:')
            auth = base64.b64encode(('opencode:' + env['OPENCODE_PASSWORD']).encode()).decode()
            def api(route, payload=None, method=None):
                data = None if payload is None else json.dumps(payload).encode()
                req = Request(origin + route, data, {'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth}, method=method)
                try:
                    with urlopen(req, timeout=12) as response:
                        raw = response.read()
                        if not raw: return None
                        body = json.loads(raw)
                        return body.get('data', body) if isinstance(body, dict) else body
                except HTTPError as exc:
                    raise AssertionError((route, exc.status, exc.read()[:700])) from exc
            yield api
        finally:
            proc.stdin.close()
            try:
                proc.wait(timeout=6)
            except subprocess.TimeoutExpired:
                proc.terminate()
                proc.wait(timeout=5)
            proc.stdout.close()


def eventually(read, condition):
    deadline = time.monotonic() + 18
    while time.monotonic() < deadline:
        value = read()
        if condition(value):
            return value
        time.sleep(0.08)
    raise AssertionError('Timed out: ' + str(value)[-850:])


def run(binary, model, root, enabled, background=False, package=PACKAGE):
    for name in ('workspace', 'home', 'tmp', 'config/opencode', 'cache', 'runtime'):
        (root/name).mkdir(parents=True, exist_ok=True)
    env = {'PATH': os.defpath, 'HOME': str(root/'home'), 'TMPDIR': str(root/'tmp'),
           'OPENCODE_TEST_HOME': str(root/'home'), 'OPENCODE_CONFIG_DIR': str(root/'config/opencode'),
           'OPENCODE_DISABLE_PROJECT_CONFIG': '1', 'OPENCODE_DISABLE_MODELS_FETCH': '1',
           'OPENCODE_DISABLE_AUTOUPDATE': '1', 'OPENCODE_PASSWORD': secrets.token_urlsafe(20),
           'OPENCODE_CLIENT': 'desktop', 'NO_PROXY': '127.0.0.1,localhost'}
    for name in ('config', 'cache', 'state', 'data'):
        env['XDG_' + name.upper() + '_HOME'] = str(root/name)
    env['XDG_RUNTIME_DIR'] = str(root/'runtime')
    (root/'catalog.json').write_text('{}')
    env['OPENCODE_MODELS_PATH'] = str(root/'catalog.json')
    fixture = {'name': 'Local demo', 'limit': {'context': 64000, 'output': 4000},
               'capabilities': {'tools': True, 'input': ['text'], 'output': ['text']}}
    config = {'update': 'disable', 'model': 'trial/demo', 'compaction': {'background': background, 'keep': {'tokens': 0}},
              'plugins': [package.as_uri()] if enabled else [],
              'providers': {'trial': {'name': 'Trial', 'package': 'aisdk:@ai-sdk/openai-compatible',
                           'settings': {'apiKey': 'fixture', 'baseURL': 'http://127.0.0.1:%s/v1' % model.server_port},
                           'models': {'demo': fixture}}}}
    if background:
        del config['compaction']['keep']  # exercise the runner's default retention window, too
    (root/'config/opencode/opencode.json').write_text(json.dumps(config))
    sid = 'ses_loop_probe'
    route = '/api/session/' + sid
    def context():
        return api(route + '/context')
    def turn(text):
        before = len(model.requests)
        api(route + '/prompt', {'text': text})
        eventually(lambda: api('/api/experimental/session/' + sid + '/export')['messages'], lambda rows: any(row['type'] == 'assistant' and row.get('finish') == 'stop' and row.get('time', {}).get('completed')
                                             for row in rows[next((i for i,r in enumerate(rows) if r.get('text') == text),len(rows))+1:]))
        return [messages for compact, messages in model.requests[before:] if not compact][-1]
    def manual(number):
        model.hold = number == 1
        model.started.clear()
        model.release.clear()
        api(route + '/compact', {'id': 'msg_compact_' + str(number)})
        if model.hold:
            try:
                assert model.started.wait(6)
                api(route + '/prompt', {'id':'msg_cancelled', 'text':'NEVER_DELIVERED', 'delivery':'queue','resume':False})
                api(route + '/inbox/msg_cancelled', method='DELETE')
                api(route + '/prompt', {'id':'msg_late', 'text':'QUEUED_DURING_COMPACT', 'delivery':'queue','resume':False})
            finally:
                model.hold = False
                model.release.set()
        return eventually(context, lambda rows: any(r['type'] == 'compaction' and r.get('status') == 'completed'
                                                    and r['id'] == 'msg_compact_' + str(number) for r in rows))
    def check(messages, newest):
        notes = [i for i,m in enumerate(messages) if LABEL in str(m)]
        if enabled:
            assert len(notes) == 1, (newest, [str(m)[:120] for m in messages])
            note = str(messages[notes[0]])
            assert 'OBJECTIVE_73' in note and 'CANCEL_PUSH_81' in note, note
            assert 'NEVER_DELIVERED' not in str(messages)
            assert 'SHELF_PROOF_52' in note, note
            later = [i for i,m in enumerate(messages) if i != notes[0] and newest in str(m)]
            if newest == 'AUTO_BOUNDARY':
                assert newest in note or any(i > notes[0] for i in later)
            else:
                assert any(i > notes[0] for i in later)
        else:
            assert not notes
    with backend(binary, root, env) as api:
        if enabled:
            rows = eventually(lambda: api('/api/plugin'), lambda rows: any(r['id'] == 'long-conversation-loop' for r in rows))
            assert next(r for r in rows if r['id'] == 'long-conversation-loop')['state']['status'] == 'active'
        at = int(time.time()*1000)
        api('/api/experimental/session/import', {'info': {'id': sid,'projectID': 'global','title': 'Loop fixture',
            'location': {'directory': str(root/'workspace')},'time': {'created': at, 'updated': at},
            'tokens': {'input': 0,'output': 0,'reasoning': 0,'cache': {'read': 0,'write': 0}},'cost': 0},'messages': []})
        assert LABEL not in str(turn('OBJECTIVE_73: build a shelf; publish after assembly.'))
        turn('CANCEL_PUSH_81: finish locally; publishing now requires a fresh approval.')
        if enabled: turn('SAVE_PROGRESS')
        manual(1)
        for i in range(3):
            text = 'FOLLOWUP_' + str(i)
            check(turn(text), text)
        if enabled:
            fetched = turn('FETCH_EARLY')
            assert any(m['role'] == 'tool' and 'CANCEL_PUSH_81' in str(m) for m in fetched)
        manual(2)
    with backend(binary, root, env) as api:
        restarted = turn('AFTER_RESTART')
        check(restarted, 'AFTER_RESTART')
        if enabled: assert 'QUEUED_DURING_COMPACT' in str(restarted)
        model.pressure = True
        before = len(model.requests)
        turn('METERED_STEP')
        if background:
            eventually(lambda: model.requests[before:], lambda requests: any(c for c,_ in requests))
            computed = sum(c for c,_ in model.requests)
        check(turn('AUTO_BOUNDARY'), 'AUTO_BOUNDARY')
        rows = context()
        assert any(r['type'] == 'compaction' and r.get('status') == 'completed' and r['reason'] == 'auto' for r in rows), str(rows)[:200]
        if background:
            assert sum(c for c,_ in model.requests) == computed, 'expected adoption of the prepared summary'
            check(turn('AFTER_BACKGROUND'), 'AFTER_BACKGROUND')
            manual(3)
            restored = turn('AFTER_ANOTHER_COMPACT')
            note = next(m for m in restored if LABEL in str(m))
            assert 'AUTO_BOUNDARY' in str(note), 'a prompt retained only in the background tail was lost'
            assert '共 12 条' in str(note), 'delivery count differs from the twelve observed inputs: ' + str(note)
    print(('enabled' if enabled else 'baseline') + ' (background=' + str(background) + '): checked runner requests, repeated compaction and restart', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary', type=Path)
    parser.add_argument('--package', type=Path, default=PACKAGE, help='an extracted plugin package to exercise')
    args = parser.parse_args()
    with ThreadingHTTPServer(('127.0.0.1', 0), Model) as model:
        model.requests = []
        model.pressure = False
        model.hold = False
        model.started = threading.Event()
        model.release = threading.Event()
        threading.Thread(target=model.serve_forever, daemon=True).start()
        try:
            for enabled, background in ((False,False), (True,False), (True,True)):
                with tempfile.TemporaryDirectory(prefix='opencode-loop-fixture-') as temp:
                    run(args.binary.resolve(), model, Path(temp).resolve(), enabled, background, args.package.resolve())
        finally:
            model.shutdown()
