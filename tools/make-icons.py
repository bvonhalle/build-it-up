#!/usr/bin/env python3
"""Regenerate src/icons/*.png from src/icon.svg.

Reads the sigil's <rect> geometry straight out of icon.svg so the SVG stays
the single source of truth, then rasterizes it at each Chrome extension icon
size with Pillow (no system SVG/cairo dependency required).

Usage: python3 tools/make-icons.py
"""
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SVG_PATH = ROOT / "src" / "icon.svg"
OUT_DIR = ROOT / "src" / "icons"
SIZES = (16, 32, 48, 128)

# Supersample so rounded-corner edges stay clean when downscaled.
SUPERSAMPLE = 8


def parse_viewbox(root):
    view_box = root.get("viewBox")
    if not view_box:
        raise ValueError("icon.svg is missing a viewBox")
    _, _, w, h = (float(v) for v in view_box.split())
    return w, h


def parse_rects(root):
    ns = {"svg": "http://www.w3.org/2000/svg"}
    rects = []
    for el in root.findall(".//svg:rect", ns) or root.findall(".//rect"):
        rects.append(
            {
                "x": float(el.get("x", 0)),
                "y": float(el.get("y", 0)),
                "width": float(el.get("width")),
                "height": float(el.get("height")),
                "rx": float(el.get("rx", 0)),
                "fill": el.get("fill", "#000000"),
            }
        )
    return rects


def render(rects, view_w, view_h, size):
    scale = (size * SUPERSAMPLE) / view_w
    canvas = Image.new("RGBA", (size * SUPERSAMPLE, int(view_h * scale)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    for r in rects:
        x0 = r["x"] * scale
        y0 = r["y"] * scale
        x1 = x0 + r["width"] * scale
        y1 = y0 + r["height"] * scale
        radius = r["rx"] * scale
        draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=r["fill"])
    # Center on a square canvas at the target size, then downsample.
    square = Image.new("RGBA", (size * SUPERSAMPLE, size * SUPERSAMPLE), (0, 0, 0, 0))
    y_offset = (square.height - canvas.height) // 2
    square.alpha_composite(canvas, (0, y_offset))
    return square.resize((size, size), Image.LANCZOS)


def main():
    tree = ET.parse(SVG_PATH)
    root = tree.getroot()
    view_w, view_h = parse_viewbox(root)
    rects = parse_rects(root)
    if not rects:
        raise ValueError("no <rect> elements found in icon.svg")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        image = render(rects, view_w, view_h, size)
        out_path = OUT_DIR / f"icon{size}.png"
        image.save(out_path)
        print(f"wrote {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
