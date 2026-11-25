"""Opt-in Desktop cache probe. Only the official CLI handles the configured connections."""
import argparse
import json
import subprocess
import tempfile
import time
import uuid
from contextlib import contextmanager
from pathlib import Path

from live_models import KIMI, MIMO, history, run_case


PACKAGE = Path(__file__).resolve().parents[1]
DENY_TOOLS = [{'action': '*', 'resource': '*', 'effect': 'deny'}]
SUMMARY = '已整理巡检资料。继续核对潮汐读数卡，成品仍待验收。'


def counts(tokens):
    values = [tokens['input'], tokens['cache']['read'], tokens['cache']['write']]
    if any(type(n) is not int or n < 0 for n in values) or not sum(values):
        raise RuntimeError('Incomplete input accounting')
    return dict(zip(('uncached', 'read', 'write'), values))


def materialize_note(rows):
    # Run the release hooks in memory, without installing them in the user's host.
    script = """
        import {capture, attach} from './src/window.js'
        import {readFileSync} from 'node:fs'
        const rows = JSON.parse(readFileSync(0, 'utf8'))
        const marker = {type:'compaction', id:'marker', status:'running'}
        const ctx = {storage:new Map(), session:{context:async () => [...rows, marker]}}
        await capture(ctx, 'synthetic')
        marker.status = 'completed'
        const messages = [{role:'user', id:marker.id, content:[{type:'text', text:'<conversation-checkpoint>'}]}]
        await attach(ctx, {sessionID:'synthetic', messages}, new Map())
        if (messages.length !== 2) throw Error('Missing release reminder')
        process.stdout.write(messages[1].content[0].text)
    """
    return subprocess.run(['node', '--input-type=module', '-e', script], cwd=PACKAGE,
                          input=json.dumps(rows), text=True, capture_output=True, check=True).stdout


class Native:
    def __init__(self, binary, workspace, model):
        self.binary, self.workspace, self.model = binary, workspace, model
        self.suffix = uuid.uuid4().hex
        self.sid = 'ses_cache_' + self.suffix
        self.route = '/api/session/' + self.sid

    def selected(self, ref):
        return isinstance(ref, dict) and all(ref.get(key) == value for key, value in self.model.items())

    def api(self, method, path, payload=None):
        args = [self.binary, 'api', method, path, '--log-level', 'none']
        if payload is not None:
            args += ['--data', json.dumps(payload, ensure_ascii=False)]
        proc = subprocess.run(args, cwd=self.workspace, capture_output=True, text=True, timeout=150)
        raw = proc.stdout.strip()
        try:
            result = json.loads(raw) if raw else {}
        except ValueError:
            result = {}
        if proc.returncode or not isinstance(result, dict) or result.get('_tag') or (raw and 'data' not in result):
            # Never reproduce server error bodies or CLI diagnostics.
            tag = result.get('_tag') if isinstance(result, dict) else None
            raise RuntimeError(f'{method} {path.rsplit("/",1)[-1]} failed (CLI {proc.returncode}, '
                               f'{tag if isinstance(tag,str) and tag.isidentifier() else "unclassified"})')
        return result.get('data')

    def fixture(self, note_enabled):
        data = history(self.workspace, self.model['id'])
        rows, info = data['messages'], data['info']
        for i, row in enumerate(rows):
            row['id'] = f'msg_{self.suffix}_{i:03d}'
            if row['type'] == 'assistant':
                row['model'] = self.model
        note = materialize_note(rows) if note_enabled else None
        location = {'directory': str(self.workspace)}
        info.update(id=self.sid, title='Cache probe ' + self.model['id'] + (' + reminder' if note else ' baseline'),
                    model=self.model, permissions=DENY_TOOLS, location=location)
        data['location'] = location
        at = rows[-1]['time']['completed'] + 10
        rows.append({'type':'compaction', 'status':'completed', 'id':'msg_cut_' + self.suffix,
                     'time':{'created':at}, 'reason':'manual', 'summary':SUMMARY, 'model':self.model})
        if note:
            rows.append({'id':'msg_note_' + self.suffix, 'type':'user', 'text':note, 'time':{'created':at+1}})
        return data

    def measure(self, index):
        mid = f'msg_probe_{self.suffix}_{index}'
        prompt = '本轮仅测缓存，无需任何工具或文件。只回复两个字：' + ('甲项','乙项','丙项')[index]
        self.api('POST', self.route + '/prompt', {'id':mid, 'text':prompt})
        deadline = time.monotonic() + 125
        while time.monotonic() < deadline:
            rows = self.api('GET', self.route + '/context')
            offset = next((i for i, row in enumerate(rows) if row['id'] == mid), len(rows))
            for row in rows[offset+1:]:
                if row['type'] != 'assistant':
                    continue
                if row.get('error'):
                    raise RuntimeError('Native generation returned a model error')
                if not self.selected(row.get('model')) or any(p['type'] == 'tool' for p in row['content']):
                    raise RuntimeError('Unexpected model or tool call')
                if row.get('time', {}).get('completed') and row.get('finish') == 'stop':
                    return counts(row['tokens'])
            time.sleep(0.8)
        raise TimeoutError('No completed metered assistant response to the new prompt')

    @contextmanager
    def session(self, fixture):
        self.api('POST', '/api/experimental/session/import', fixture)
        print('created', self.sid, flush=True)
        try:
            info = self.api('GET', self.route)
            if info['id'] == self.sid and not self.selected(info.get('model')):
                self.api('POST', self.route + '/model', {'model':self.model})
                info = self.api('GET', self.route)
            if info['id'] != self.sid or not self.selected(info.get('model')):
                raise RuntimeError('Test model not selected; stopped before generation')
            self.api('PATCH', self.route, {'permissions': DENY_TOOLS})
            if self.api('GET', self.route).get('permissions') != DENY_TOOLS:
                raise RuntimeError('Tool restrictions not confirmed')
            yield
        finally:
            self.api('PATCH', self.route, {'archived':True})
            if not self.api('GET', self.route)['time'].get('archived'):
                raise RuntimeError('Archive not verified: ' + self.sid)
            print('archived', self.sid, flush=True)

    def run(self, enabled):
        with self.session(self.fixture(enabled)):
            rows = self.api('GET', self.route + '/context')
            if not any(r['id'] == 'msg_cut_' + self.suffix for r in rows) or any(
                    r['id'] == 'msg_note_' + self.suffix for r in rows) != enabled:
                raise RuntimeError('Incorrect fixture projection')
            for i in range(3):
                print(json.dumps({'model':self.model['id'], 'reminder':enabled, 'turn':i+1,
                                  **self.measure(i)}), flush=True)

    def recall(self):
        fixture = self.fixture(False)
        fixture['messages'] = []
        fixture['info']['title'] = 'Cache probe: isolated seal lookup ' + self.model['id']
        with self.session(fixture):
            def generate(prompt):
                result = self.api('POST', self.route + '/generate', {'prompt':prompt})
                print(json.dumps({'model':self.model['id'], 'phase':'seal-lookup',
                                  **counts(result['tokens'])}), flush=True)
                return result['text']
            run_case(self.binary, self.model['providerID'], self.model['id'], enabled=True,
                     check_recall=True, metered_generate=generate)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', choices=[KIMI, MIMO], required=True)
    parser.add_argument('--provider', required=True)
    parser.add_argument('--live', action='store_true', required=True)
    parser.add_argument('--recall', action='store_true', help='repeat the isolated original seal lookup instead')
    parser.add_argument('--binary', type=Path, default=Path('/Applications/OpenCode.app/Contents/Resources/opencode-cli'))
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='ocx-native-cache-') as directory:
        def native():
            return Native(args.binary.resolve(), Path(directory).resolve(), {'providerID':args.provider, 'id':args.model})
        if args.recall:
            native().recall()
        else:
            for enabled in ([False, True] if args.model == KIMI else [True, False]):
                native().run(enabled)
