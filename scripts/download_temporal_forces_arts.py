#!/usr/bin/env python3
"""Download Portuguese Temporal Forces card images from MYP Cards."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "MobileApp" / "www" / "cartas" / "forcas-temporais"
BASE_URL = "https://img.mypcards.com/cdn-cgi/image/f=auto,q=85/img/2/2098/pokemon_tef_{number}_162/pokemon_tef_{number}_162_pt.jpg"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def fetch_image(url: str, timeout: int = 30) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        return response.read()


def download(output_dir: Path, delay: float, force: bool) -> list[dict[str, str]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, str]] = []

    for index in range(1, 163):
        number = f"{index:03d}"
        url = BASE_URL.format(number=number)
        destination = output_dir / f"{number}.jpg"

        try:
            if destination.exists() and not force:
                status = "exists"
            else:
                destination.write_bytes(fetch_image(url))
                status = "downloaded"

            results.append({
                "number": number,
                "source": url,
                "file": str(destination.relative_to(ROOT)),
                "status": status,
            })
            print(f"[{index:03d}/162] {number} -> {status}")
        except (HTTPError, URLError, TimeoutError) as error:
            results.append({
                "number": number,
                "source": url,
                "status": "failed",
                "error": str(error),
            })
            print(f"[{index:03d}/162] {number} -> failed: {error}", file=sys.stderr)

        if delay > 0:
            time.sleep(delay)

    manifest = output_dir / "manifest.json"
    manifest.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Baixa artes PT-BR de Forcas Temporais (TEF).")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Pasta de destino.")
    parser.add_argument("--delay", type=float, default=0.08, help="Pausa entre downloads.")
    parser.add_argument("--force", action="store_true", help="Baixar novamente arquivos existentes.")
    args = parser.parse_args()

    results = download(args.output, args.delay, args.force)
    downloaded = sum(1 for item in results if item["status"] == "downloaded")
    existing = sum(1 for item in results if item["status"] == "exists")
    failed = sum(1 for item in results if item["status"] == "failed")
    print(f"\nConcluido: {downloaded} baixadas, {existing} ja existiam, {failed} falharam.")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
