#!/opt/homebrew/bin/python3.13
"""Spracherkennung für die Auto-App auf dem Mac (Whisper, whisper.cpp).

Holt fertige Aufnahmen vom Relay (rohes PCM, 16 kHz, 16 Bit, mono), erkennt sie mit
whisper-cli und liefert den Text zurück. Läuft dauerhaft als LaunchAgent
(de.duve.claude-auto-stt). Zugang aus ~/.claude/auto-relay.env.
"""
import json
import os
import subprocess
import tempfile
import time
import urllib.request
import wave

HOME = os.path.expanduser("~")
MODEL = os.path.join(HOME, ".claude/whisper/ggml-large-v3-turbo.bin")
VAD = os.path.join(HOME, ".claude/whisper/ggml-silero-v5.1.2.bin")
WHISPER = "/opt/homebrew/bin/whisper-cli"


def env() -> dict:
    out = {}
    with open(os.path.join(HOME, ".claude/auto-relay.env")) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                out[k.removeprefix("export ").strip()] = v.strip().strip('"').strip("'")
    return out


E = env()
URL = E["AUTO_RELAY_URL"].rstrip("/")
AUTH = {"Authorization": f"Bearer {E['AUTO_MAC_TOKEN']}"}


def log(msg: str) -> None:
    print(time.strftime("%H:%M:%S"), msg, flush=True)


def fetch():
    req = urllib.request.Request(f"{URL}/api/mac/stt?wait=25", headers=AUTH)
    with urllib.request.urlopen(req, timeout=40) as r:
        if r.status == 204:
            return None
        return int(r.headers["X-Job"]), r.read()


def deliver(job: int, text: str | None = None, error: str | None = None) -> None:
    body = json.dumps({"text": text, "error": error}).encode()
    req = urllib.request.Request(f"{URL}/api/mac/stt/{job}", data=body, method="POST",
                                 headers={**AUTH, "Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=20).read()


def transcribe(pcm: bytes) -> str:
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, "a.wav")
        with wave.open(wav, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
            w.writeframes(pcm)
        r = subprocess.run(
            # VAD überspringt Pausen; ohne sie erfindet Whisper in Stille gern Sätze („Untertitel im Auftrag …“)
            [WHISPER, "-m", MODEL, "-l", "de", "-nt", "-np", "-sns", "--vad", "-vm", VAD, "-f", wav, "-otxt", "-of", os.path.join(d, "out")],
            capture_output=True, text=True, timeout=600,
        )
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip()[-300:] or f"whisper-cli Code {r.returncode}")
        with open(os.path.join(d, "out.txt")) as f:
            return " ".join(line.strip() for line in f if line.strip())


def main() -> None:
    log("bereit")
    while True:
        try:
            got = fetch()
        except Exception as e:  # Relay kurz weg, Netz weg, Mac aufgewacht
            log(f"Abholen fehlgeschlagen: {e}")
            time.sleep(5)
            continue
        if not got:
            continue
        job, pcm = got
        t = time.time()
        try:
            text = transcribe(pcm)
            deliver(job, text=text)
            log(f"Auftrag {job}: {len(pcm) / 32000:.0f} s Audio in {time.time() - t:.1f} s, {len(text)} Zeichen")
        except Exception as e:
            log(f"Auftrag {job} fehlgeschlagen: {e}")
            try:
                deliver(job, error=str(e)[:900])
            except Exception:
                pass


if __name__ == "__main__":
    main()
