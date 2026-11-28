"""Native OpenCode tool dispatch across process restarts, using loopback model fixtures."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
from http.server import ThreadingHTTPServer
from host_probe import Model, backend, eventually, fixture_environment


def run(binary, root, model, codex_script=None):
    env = fixture_environment(model, root, True)
    workspace = root / "workspace"
    ids = {name: "ses_exchange_" + name for name in ("main", "review", "build")}

    def create(api, who):
        now = int(time.time() * 1000)
        api(
            "/api/experimental/session/import",
            {
                "info": {
                    "id": ids[who],
                    "projectID": "global",
                    "title": who,
                    "location": {"directory": str(workspace)},
                    "time": {"created": now, "updated": now},
                    "cost": 0,
                    "tokens": {"input": 0, "output": 0, "reasoning": 0, "cache": {"read": 0, "write": 0}},
                },
                "messages": [],
            },
        )

    def op(api, who, req, failure=False):
        route = "/api/session/" + ids[who]
        before = len(model.requests)
        text = "MAILBOX " + json.dumps(req)
        api(route + "/prompt", {"text": text})

        def result():
            for _, messages in model.requests[before:]:
                if messages[-1]["role"] == "tool":
                    return messages[-1]["content"]

        raw = eventually(result, bool)
        result = json.loads(raw)
        assert result["ok"] != failure, result
        # The model's second, final reply must finish before another turn is queued.
        eventually(
            lambda: api(route + "/context"),
            lambda rows: rows[-1].get("type") == "idle" and rows[-1].get("outcome") == "succeeded",
        )
        return result.get("data", result)

    def codex(req):
        child = subprocess.run(
            [sys.executable, "-IB", str(codex_script), "--root", str(workspace)],
            input=json.dumps({"protocol": 1, **req}).encode(),
            capture_output=True,
            env={**env, "CODEX_THREAD_ID": "isolated-codex-review"},
            timeout=10,
        )
        result = json.loads(child.stdout)
        assert result["ok"], result
        return result["data"]

    with backend(binary, root, env) as api:
        for who in ids:
            create(api, who)
            op(api, who, {"op": "join", "alias": who})
        for who in ("review", "build"):
            op(api, "main", {"op": "link", "peer": who})
            op(api, who, {"op": "link", "peer": "main"})
        if codex_script:
            codex({"op": "join", "alias": "codex"})
            codex({"op": "link", "peer": "main"})
            op(api, "main", {"op": "link", "peer": "codex"})
        old = op(api, "main", {"op": "sync", "peer": "build"})["basis"]
        basis = op(api, "build", {"op": "sync", "peer": "main"})["basis"]
        op(
            api,
            "build",
            {
                "op": "publish",
                "peer": "main",
                "basis": {"main": basis},
                "kind": "constraint",
                "body": "local acceptance only",
                "key": "local",
            },
        )
    with backend(binary, root, env) as api:
        stale = op(
            api,
            "main",
            {
                "op": "publish",
                "peer": "build",
                "basis": {"build": old},
                "kind": "status",
                "body": "ready",
                "key": "ready",
            },
            True,
        )
        assert "stale" in stale["error"]
        page = op(api, "main", {"op": "sync", "peer": "build"})
        assert page["entries"][0]["body"] == "local acceptance only"
        op(
            api,
            "main",
            {"op": "ack", "peer": "build", "seqs": [page["entries"][0]["seq"]], "receipt": page["receipt"]},
        )
        assert not op(api, "main", {"op": "sync", "peer": "build"})["entries"]
        if codex_script:
            basis = op(api, "main", {"op": "sync", "peer": "codex"})["basis"]
            question = op(
                api,
                "main",
                {
                    "op": "publish",
                    "peer": "codex",
                    "basis": {"codex": basis},
                    "kind": "question",
                    "body": "Can we sign off?",
                    "key": "sign",
                },
            )
            page = codex({"op": "sync", "peer": "main"})
            codex({"op": "ack", "peer": "main", "seqs": [question["seq"]], "receipt": page["receipt"]})
            codex(
                {
                    "op": "publish",
                    "peer": "main",
                    "basis": {"main": page["basis"]},
                    "kind": "reply",
                    "ref": question["seq"],
                    "body": "Review required.",
                    "key": "answer",
                }
            )
            assert (
                op(api, "main", {"op": "sync", "peer": "codex"})["entries"][0]["body"] == "Review required."
            )
    print(
        "Real OpenCode tools, three native sessions, backend restart, stale write rejection and independent receipts passed."
    )
    if codex_script:
        print("Round trip with the separately packaged Codex CLI also passed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("binary", type=Path)
    parser.add_argument("--codex-script", type=Path)
    args = parser.parse_args()
    with (
        tempfile.TemporaryDirectory(prefix="exchange-host-") as tmp,
        ThreadingHTTPServer(("127.0.0.1", 0), Model) as model,
    ):
        model.requests = []
        model.hold = model.pressure = False
        threading.Thread(target=model.serve_forever, daemon=True).start()
        try:
            run(
                args.binary.resolve(),
                Path(tmp).resolve(),
                model,
                args.codex_script.resolve() if args.codex_script else None,
            )
        finally:
            model.shutdown()
