#!/usr/bin/env python3
"""Generate a minimal Open Graph banner PNG (1200x630) for social cards.

Pure-stdlib implementation (zlib + struct) — no Pillow / cairosvg needed.
Output: docs/assets/img/og.png (overwrites if present).

Design: dark cyberpunk gradient (navy → purple) with a glowing radial
highlight, evoking the FreeNode brand palette.
"""
from __future__ import annotations

import math
import struct
import sys
import zlib
from pathlib import Path

WIDTH = 1200
HEIGHT = 630

# Brand palette (matches site CSS variables)
COL_BG_TOP = (8, 9, 13)        # #08090d
COL_BG_BOT = (28, 14, 46)      # deep purple
COL_CYAN = (0, 217, 255)       # #00d9ff
COL_PURPLE = (180, 130, 255)   # accent
COL_WHITE = (245, 246, 250)


def _chunk(tag: bytes, data: bytes) -> bytes:
    """Build a PNG chunk: length + tag + data + CRC32."""
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _lerp_color(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        int(_lerp(c1[0], c2[0], t)),
        int(_lerp(c1[1], c2[1], t)),
        int(_lerp(c1[2], c2[2], t)),
    )


def _build_pixels() -> bytearray:
    """Compute the raw RGB pixel buffer (HEIGHT rows × WIDTH px × 3 bytes)."""
    cx, cy = WIDTH * 0.78, HEIGHT * 0.30  # glow center (upper-right)
    max_r = math.hypot(WIDTH, HEIGHT)
    buf = bytearray()
    for y in range(HEIGHT):
        buf.append(0)  # PNG row filter type 0 (None)
        for x in range(WIDTH):
            # Vertical gradient (navy top → purple bottom)
            t = y / HEIGHT
            base = _lerp_color(COL_BG_TOP, COL_BG_BOT, t)
            # Radial cyan glow in upper-right
            d = math.hypot(x - cx, y - cy) / max_r
            glow = max(0.0, 1.0 - d * 2.2)
            r = min(255, int(base[0] + COL_CYAN[0] * glow * 0.35))
            g = min(255, int(base[1] + COL_CYAN[1] * glow * 0.35))
            b = min(255, int(base[2] + COL_CYAN[2] * glow * 0.35))
            # Diagonal subtle scanline every 4px (cyberpunk flavor)
            if (x + y) % 4 == 0:
                r = max(0, r - 6)
                g = max(0, g - 6)
                b = max(0, b - 6)
            buf.extend((r, g, b))
    return buf


def _draw_text_block(buf: bytearray, lines: list[tuple[str, int, int, int]]) -> None:
    """Stamp pre-rendered bitmaps of text (simple 5x7 block font) onto buf.

    Each line: (text, x0, y0, color). Renders in uppercase using a built-in
    5x7 bitmap alphabet. Skips characters not in the alphabet.
    """
    # 5x7 uppercase font — each letter is 5 wide, 7 tall, 1px gap
    FONT: dict[str, list[int]] = {
        "A": [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
        "B": [0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
        "C": [0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
        "D": [0b11110,0b10001,0b10001,0b10001,0b10001,0b10001,0b11110],
        "E": [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
        "F": [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
        "G": [0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01111],
        "H": [0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
        "I": [0b01110,0b00100,0b00100,0b00100,0b00100,0b00100,0b01110],
        "J": [0b00111,0b00010,0b00010,0b00010,0b10010,0b10010,0b01100],
        "K": [0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
        "L": [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
        "M": [0b10001,0b11011,0b10101,0b10101,0b10001,0b10001,0b10001],
        "N": [0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
        "O": [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
        "P": [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
        "Q": [0b01110,0b10001,0b10001,0b10001,0b10101,0b10010,0b01101],
        "R": [0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
        "S": [0b01111,0b10000,0b10000,0b01110,0b00001,0b00001,0b11110],
        "T": [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
        "U": [0b10001,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
        "V": [0b10001,0b10001,0b10001,0b10001,0b10001,0b01010,0b00100],
        "W": [0b10001,0b10001,0b10001,0b10101,0b10101,0b11011,0b10001],
        "X": [0b10001,0b10001,0b01010,0b00100,0b01010,0b10001,0b10001],
        "Y": [0b10001,0b10001,0b01010,0b00100,0b00100,0b00100,0b00100],
        "Z": [0b11111,0b00001,0b00010,0b00100,0b01000,0b10000,0b11111],
        " ": [0,0,0,0,0,0,0],
        "/": [0b00001,0b00010,0b00100,0b01000,0b00100,0b00010,0b00001],
        "·": [0,0,0,0b00100,0,0,0],
        "-": [0,0,0,0b11111,0,0,0],
        "0": [0b01110,0b10011,0b10101,0b10101,0b10101,0b11001,0b01110],
        "1": [0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
        "2": [0b01110,0b10001,0b00001,0b00110,0b01000,0b10000,0b11111],
        "3": [0b11110,0b00001,0b00001,0b01110,0b00001,0b00001,0b11110],
        "4": [0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
        "5": [0b11111,0b10000,0b10000,0b11110,0b00001,0b00001,0b11110],
        "6": [0b00110,0b01000,0b10000,0b11110,0b10001,0b10001,0b01110],
        "7": [0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
        "8": [0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
        "9": [0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
    }
    scale = 6  # each font pixel = scale×scale real pixels
    for text, x0, y0, color in lines:
        text = text.upper()
        cx = x0
        for ch in text:
            glyph = FONT.get(ch)
            if glyph is None:
                cx += 6 * scale
                continue
            for row in range(7):
                bits = glyph[row]
                for col in range(5):
                    if bits & (1 << (4 - col)):
                        for dy in range(scale):
                            for dx in range(scale):
                                px = cx + col * scale + dx
                                py = y0 + row * scale + dy
                                if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                                    i = py * (WIDTH * 3 + 1) + 1 + px * 3
                                    buf[i] = color[0]
                                    buf[i + 1] = color[1]
                                    buf[i + 2] = color[2]
            cx += 6 * scale


def build_png() -> bytes:
    """Return the full PNG file bytes."""
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)  # 8-bit RGB
    raw = _build_pixels()
    _draw_text_block(
        raw,
        [
            ("FREENODE", 80, 180, COL_WHITE),
            ("FREE PROXY / NODE AGGREGATOR", 80, 280, COL_CYAN),
            ("- 80+ SOURCES  -  6 PROTOCOLS  -  GITHUB PAGES", 80, 380, COL_PURPLE),
            ("CLASH  -  V2RAY  -  PROXY LIST", 80, 470, COL_CYAN),
        ],
    )
    idat = zlib.compress(bytes(raw), 9)
    return sig + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b"")


def main() -> int:
    out = Path(__file__).resolve().parent.parent / "docs" / "assets" / "img" / "og.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(build_png())
    print(f"[gen_og_image] wrote {out} ({out.stat().st_size} bytes, {WIDTH}x{HEIGHT})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
