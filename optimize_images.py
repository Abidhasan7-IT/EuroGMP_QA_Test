#!/usr/bin/env python3
"""
optimize_images.py — Fix for BUG-003 (Euro GMP QA Report)

Batch-converts photographic images in an /images directory from
uncompressed PNG (or any format) to WebP, which shrinks file size
dramatically with no visible quality loss for photo content.

On the 6 sampled files in the QA report this took 3.77 MB -> 183 KB
(a 95% reduction) at quality=80.

Usage:
    pip install pillow --break-system-packages   # if not already installed
    python3 optimize_images.py /path/to/images [--quality 80] [--output-dir /path/to/out]

By default, output files are written alongside the originals with a
.webp extension (originals are left untouched). Use --in-place if you
want to replace originals with same-name .webp files instead (keeps a
.bak of the original PNG/JPEG just in case).
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit(
        "Pillow is required. Install it with:\n"
        "  pip install pillow --break-system-packages"
    )

PHOTO_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff"}


def human(n_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n_bytes < 1024:
            return f"{n_bytes:.0f}{unit}"
        n_bytes /= 1024
    return f"{n_bytes:.1f}TB"


def convert_one(src: Path, dest: Path, quality: int) -> tuple[int, int]:
    with Image.open(src) as im:
        # Flatten transparency onto white for JPEG-like photo content;
        # WebP supports alpha too, so keep RGBA if the source has real
        # transparency (icons/logos) rather than forcing everything to RGB.
        if im.mode in ("RGBA", "LA") and _has_real_alpha(im):
            im.save(dest, "WEBP", quality=quality, method=6)
        else:
            im = im.convert("RGB")
            im.save(dest, "WEBP", quality=quality, method=6)
    return src.stat().st_size, dest.stat().st_size


def _has_real_alpha(im: Image.Image) -> bool:
    """Return True only if the image actually uses transparency,
    so flat photo PNGs (alpha channel = all 255) still get flattened
    to RGB, which compresses better."""
    if "A" not in im.getbands():
        return False
    alpha = im.getchannel("A")
    return alpha.getextrema()[0] < 255


def main():
    parser = argparse.ArgumentParser(description="Convert images to WebP to reduce page weight.")
    parser.add_argument("directory", help="Path to the /images folder to process")
    parser.add_argument("--quality", type=int, default=80, help="WebP quality, 1-100 (default: 80)")
    parser.add_argument("--output-dir", default=None, help="Write .webp files here instead of alongside originals")
    parser.add_argument("--in-place", action="store_true",
                         help="Replace originals: keeps original as name.ext.bak, writes name.webp")
    args = parser.parse_args()

    src_dir = Path(args.directory)
    if not src_dir.is_dir():
        sys.exit(f"Not a directory: {src_dir}")

    out_dir = Path(args.output_dir) if args.output_dir else src_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    total_before = 0
    total_after = 0
    converted = 0

    for src in sorted(src_dir.iterdir()):
        if src.suffix.lower() not in PHOTO_EXTENSIONS:
            continue

        dest = out_dir / (src.stem + ".webp")
        if dest.resolve() == src.resolve():
            continue  # already webp with same name, skip

        before, after = convert_one(src, dest, args.quality)
        total_before += before
        total_after += after
        converted += 1

        pct = 100 * (1 - after / before) if before else 0
        print(f"{src.name:30s} {human(before):>8s} -> {dest.name:30s} {human(after):>8s}  ({pct:.0f}% smaller)")

        if args.in_place:
            backup = src.with_suffix(src.suffix + ".bak")
            src.rename(backup)

    if converted == 0:
        print("No matching image files found.")
        return

    saved_pct = 100 * (1 - total_after / total_before) if total_before else 0
    print()
    print(f"Converted {converted} file(s).")
    print(f"Total: {human(total_before)} -> {human(total_after)}  ({saved_pct:.0f}% smaller)")
    print()
    print("Next step: update <img src=\"...png\"> references to the new .webp")
    print("filenames (or use a <picture> element with a JPEG/PNG fallback for")
    print("older browsers), then re-run the QA link/image audit to confirm")
    print("nothing broke.")


if __name__ == "__main__":
    main()
