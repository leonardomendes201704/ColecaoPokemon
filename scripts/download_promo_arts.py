#!/usr/bin/env python3
"""Download MEP promo card images for the mobile app.

The official Pokemon site blocks direct automated requests in many networks, so
this script uses Bulbapedia pages and downloads the original card image exposed
in the page metadata.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "MobileApp" / "www" / "cartas" / "promos-megaevolucao"
BULBAPEDIA_SET_URL = "https://bulbapedia.bulbagarden.net/wiki/MEP_Black_Star_Promos_(TCG)"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def fetch_text(url: str, timeout: int = 30) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
      return response.read().decode("utf-8", "ignore")


def fetch_bytes(url: str, timeout: int = 30) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
      content_type = response.headers.get("content-type", "")
      return response.read(), content_type


def extension_for(url: str, content_type: str) -> str:
    lowered_type = content_type.lower()
    if "png" in lowered_type:
        return ".png"
    if "webp" in lowered_type:
        return ".webp"
    if "jpeg" in lowered_type or "jpg" in lowered_type:
        return ".jpg"

    lowered_url = url.lower().split("?", 1)[0]
    for extension in (".png", ".webp", ".jpg", ".jpeg"):
        if lowered_url.endswith(extension):
            return ".jpg" if extension == ".jpeg" else extension
    return ".jpg"


def promo_links() -> list[dict[str, str]]:
    page = fetch_text(BULBAPEDIA_SET_URL)
    pattern = re.compile(r'href="(/wiki/[^"]+_\(MEP_Promo_(\d+)\))"[^>]*>([^<]+)</a>')
    cards: list[dict[str, str]] = []
    seen: set[str] = set()

    for match in pattern.finditer(page):
        number = match.group(2).zfill(3)
        if number in seen:
            continue
        seen.add(number)
        cards.append({
            "number": number,
            "name": html.unescape(match.group(3)),
            "page": urljoin(BULBAPEDIA_SET_URL, match.group(1)),
        })

    cards.sort(key=lambda card: int(card["number"]))
    return cards


def card_image_url(page_url: str) -> str | None:
    page = fetch_text(page_url)
    og_match = re.search(r'<meta property="og:image" content="([^"]+)"', page)
    if og_match and "archives.bulbagarden.net/media/upload" in og_match.group(1):
        return html.unescape(og_match.group(1))

    image_match = re.search(
        r'<a href="/wiki/File:[^"]+">\s*<img src="([^"]+)"',
        page,
        flags=re.IGNORECASE,
    )
    if image_match:
        return html.unescape(image_match.group(1)).replace("/thumb/", "/").rsplit("/", 1)[0]
    return None


def download_cards(output_dir: Path, delay: float, force: bool) -> list[dict[str, str]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    cards = promo_links()
    results: list[dict[str, str]] = []

    for index, card in enumerate(cards, start=1):
        number = card["number"]
        try:
            image_url = card_image_url(card["page"])
            if not image_url:
                raise RuntimeError("imagem nao encontrada na pagina")

            image_bytes, content_type = fetch_bytes(image_url)
            extension = extension_for(image_url, content_type)
            destination = output_dir / f"{number}{extension}"
            if destination.exists() and not force:
                status = "exists"
            else:
                destination.write_bytes(image_bytes)
                status = "downloaded"

            results.append({
                **card,
                "image": image_url,
                "file": str(destination.relative_to(ROOT)),
                "status": status,
            })
            print(f"[{index:02d}/{len(cards):02d}] {number} {card['name']} -> {status}")
        except (HTTPError, URLError, TimeoutError, RuntimeError) as error:
            results.append({**card, "status": "failed", "error": str(error)})
            print(f"[{index:02d}/{len(cards):02d}] {number} {card['name']} -> failed: {error}", file=sys.stderr)

        if delay > 0:
            time.sleep(delay)

    manifest = output_dir / "manifest.json"
    manifest.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Baixa artes das promos MEP para o app.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Pasta de destino das imagens.")
    parser.add_argument("--delay", type=float, default=0.25, help="Pausa entre downloads.")
    parser.add_argument("--force", action="store_true", help="Baixar novamente imagens existentes.")
    args = parser.parse_args()

    results = download_cards(args.output, args.delay, args.force)
    downloaded = sum(1 for item in results if item["status"] == "downloaded")
    existing = sum(1 for item in results if item["status"] == "exists")
    failed = sum(1 for item in results if item["status"] == "failed")

    print(f"\nConcluido: {downloaded} baixadas, {existing} ja existiam, {failed} falharam.")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
