"""Check an extracted GUI-only release against the Desktop-bundled backend, then uninstall it."""
import argparse
import base64
from contextlib import contextmanager
from hashlib import sha256
import http.client
import json
import os
from pathlib import Path
import secrets
import selectors
import subprocess
import tempfile
import time
from urllib.parse import urlencode, urlsplit


@contextmanager
def server(binary, root, env):
    """The stdio server shuts down when its own stdin closes."""
    with (root / "server.log").open("ab") as log:
        proc = subprocess.Popen([binary, "serve", "--stdio", "--hostname", "127.0.0.1", "--port", "0"],
                                cwd=root, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=log)
        try:
            with selectors.DefaultSelector() as selector:
                selector.register(proc.stdout, selectors.EVENT_READ)
                if not selector.select(30):
                    raise TimeoutError("Server did not report readiness")
            line = proc.stdout.readline()
            if not line:
                raise RuntimeError(f"Server exited before readiness. See {log.name}")
            url = urlsplit(json.loads(line)["url"])
            if url.scheme != "http" or url.hostname != "127.0.0.1" or not url.port:
                raise ValueError("Expected an isolated loopback server")
            yield url.port
        finally:
            proc.stdin.close()
            try:
                proc.wait(10)
            except subprocess.TimeoutExpired:
                proc.terminate()
                try:
                    proc.wait(5)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait()
            proc.stdout.close()


def get(port, path, password):
    auth = base64.b64encode(("opencode:" + password).encode()).decode()
    client = http.client.HTTPConnection("127.0.0.1", port, timeout=30)
    try:
        client.request("GET", path, headers={"Authorization": "Basic " + auth})
        response = client.getresponse()
        if response.status != 200:
            raise RuntimeError(f"{path} returned {response.status}")
        return json.load(response)["data"]
    finally:
        client.close()


def installed(port, password, plugin_id, present):
    # The first inventory can precede async plugin activation at a new location.
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        rows = get(port, "/api/plugin", password)
        matches = [row for row in rows if row.get("id") == plugin_id]
        ready = any(row["source"]["type"] == "builtin" for row in rows)
        if ready and bool(matches) == present:
            return matches
        time.sleep(0.15)
    raise RuntimeError(f"Inventory did not settle as expected ({len(rows)} entries, {len(matches)} matches)")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package", type=Path, help="extracted npm pack package directory")
    parser.add_argument("--cli", type=Path, default=Path("/Applications/OpenCode.app/Contents/Resources/opencode-cli"))
    parser.add_argument("--scratch", type=Path, help="parent for a fresh, preserved test directory")
    args = parser.parse_args()
    package = args.package.resolve(strict=True)
    manifest = json.loads((package / "package.json").read_text())
    id_ = manifest["name"]
    bundle = (package / manifest["exports"]["./gui-experimental"]).read_text()
    root = Path(tempfile.mkdtemp(prefix="opencode-gui-install-", dir=args.scratch))
    print("Isolated evidence directory", root, flush=True)
    config_dir = root / "config" / "opencode"
    config_dir.mkdir(parents=True)
    for name in ("home", "tmp"):
        (root / name).mkdir()
    env = {
        "PATH": os.defpath, "HOME": str(root / "home"), "TMPDIR": str(root / "tmp"),
        "OPENCODE_TEST_HOME": str(root / "home"), "OPENCODE_CONFIG_DIR": str(config_dir),
        "OPENCODE_DISABLE_MODELS_FETCH": "1", "OPENCODE_DISABLE_PROJECT_CONFIG": "1",
        "OPENCODE_PASSWORD": secrets.token_urlsafe(24),
    }
    for kind in ("config", "state", "cache", "data"):
        env["XDG_" + kind.upper() + "_HOME"] = str(root / kind)
    config = config_dir / "opencode.json"
    config.write_text(json.dumps({"plugins": [package.as_uri()]}))
    with server(args.cli.resolve(strict=True), root, env) as port:
        row, = installed(port, env["OPENCODE_PASSWORD"], id_, True)
        assert row["state"]["status"] == "active", row["state"]["status"]
        assert row["features"] == {"gui": True}, row["features"]
        assert Path(row["source"]["path"]).resolve() == package
        reply = get(port, "/api/plugin/gui?" + urlencode({"id": id_}), env["OPENCODE_PASSWORD"])
        assert reply["code"] == bundle and reply["revision"]
        print("Active GUI-only package", id_, manifest["version"], "bundle SHA-256", sha256(bundle.encode()).hexdigest())
    config.write_text(json.dumps({"plugins": []}))
    with server(args.cli.resolve(strict=True), root, env) as port:
        installed(port, env["OPENCODE_PASSWORD"], id_, False)
        print("Uninstall confirmed after isolated restart")


if __name__ == "__main__":
    main()
