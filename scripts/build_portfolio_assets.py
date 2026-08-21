from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


SOURCE = Path(r"E:\Jason\作品集")
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "portfolio"
MANIFEST = Path(__file__).resolve().parents[1] / "app" / "portfolio-manifest.json"
VALID_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO_EXTENSIONS = {".mp4"}
UP_POOL_VIDEO_SIZE = (480, 758)
MAX_OUTPUT_BYTES = 20 * 1024 * 1024
PROJECT_ORDER = {
    "Zodiac Heroes": 0,
    "悠星大陆": 1,
    "决战平安京": 2,
    "大话西游手游": 3,
    "大话西游端游": 4,
    "幻书启示录": 5,
    "轩辕剑·龙舞云山": 6,
    "桃花源记 & 少年仙侠传": 7,
}
SQUARE_COVER_SIZE = 1200


def source_digest(source: Path, relative: Path) -> str:
    digest = hashlib.sha1(str(relative).encode("utf-8"))
    with source.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()[:12]


def save_square_cover(source: Path, destination: Path) -> tuple[int, int]:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        if image.width == image.height:
            square = image.resize((SQUARE_COVER_SIZE, SQUARE_COVER_SIZE), Image.Resampling.LANCZOS)
        else:
            background = ImageOps.fit(
                image,
                (SQUARE_COVER_SIZE, SQUARE_COVER_SIZE),
                method=Image.Resampling.LANCZOS,
            ).filter(ImageFilter.GaussianBlur(34))
            background = ImageEnhance.Brightness(background).enhance(0.34)
            foreground = image.copy()
            foreground.thumbnail((SQUARE_COVER_SIZE, SQUARE_COVER_SIZE), Image.Resampling.LANCZOS)
            x = (SQUARE_COVER_SIZE - foreground.width) // 2
            y = (SQUARE_COVER_SIZE - foreground.height) // 2
            background.paste(foreground, (x, y))
            square = background
        square.save(destination, "WEBP", quality=90, method=6)
    return SQUARE_COVER_SIZE, SQUARE_COVER_SIZE


def classify(relative: str) -> str:
    lower = relative.lower()
    if "up池动画" in lower:
        return "视频动画"
    if any(word in relative for word in ("管线", "落地品质", "规范", "流程", "经验与贡献", "品质把控")):
        return "制作管理"
    if any(word in relative for word in ("场景", "棋盘", "大世界")):
        return "场景设计"
    if "ui" in lower:
        return "UI视觉"
    if any(word in relative for word in ("角色", "怪物", "NPC", "立绘", "三视图", "体型")):
        return "角色设计"
    if any(word in relative for word in ("banner", "封面", "插图", "图标", "拍脸图")):
        return "宣传视觉"
    return "概念设计"


def project_name(parts: tuple[str, ...]) -> str:
    path = "/".join(parts)
    projects = (
        ("zodiac heroes", "Zodiac Heroes"),
        ("悠星大陆", "悠星大陆"),
        ("决战平安京", "决战平安京"),
        ("大话西游手游", "大话西游手游"),
        ("大话西游端游", "大话西游端游"),
        ("幻书启示录", "幻书启示录"),
        ("轩辕剑龙舞云山", "轩辕剑·龙舞云山"),
        ("桃花源记&少年仙侠传", "桃花源记 & 少年仙侠传"),
    )
    for needle, label in projects:
        if needle.lower() in path.lower():
            return label
    return parts[0] if parts else "其他作品"


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    entries: list[dict[str, object]] = []
    files = sorted(
        (
            path
            for path in SOURCE.rglob("*")
            if path.is_file()
            and (
                path.suffix.lower() in VALID_EXTENSIONS
                or (path.suffix.lower() in VIDEO_EXTENSIONS and "UP池动画" in path.parts)
            )
            and "logo" not in path.name.lower()
        ),
        key=lambda path: str(path).lower(),
    )

    for source in files:
        relative = source.relative_to(SOURCE)
        digest = source_digest(source, relative)
        if source.suffix.lower() in VIDEO_EXTENSIONS:
            if source.stat().st_size > MAX_OUTPUT_BYTES:
                print(f"skip oversized video: {relative}")
                continue
            destination = OUTPUT / f"work-{digest}.mp4"
            if not destination.exists() or destination.stat().st_size != source.stat().st_size:
                shutil.copy2(source, destination)
            entries.append(
                {
                    "id": digest,
                    "title": source.stem,
                    "tag": classify(str(relative)),
                    "project": project_name(relative.parts),
                    "image": f"/portfolio/{destination.name}",
                    "media": "video",
                    "cover": False,
                    "width": UP_POOL_VIDEO_SIZE[0],
                    "height": UP_POOL_VIDEO_SIZE[1],
                }
            )
            continue

        project = project_name(relative.parts)
        is_cover = "封面图" in relative.parts
        if is_cover and project not in PROJECT_ORDER:
            continue
        destination = OUTPUT / f"{'cover' if is_cover else 'work'}-{digest}.webp"
        if is_cover:
            width, height = save_square_cover(source, destination)
        elif destination.exists():
            with Image.open(destination) as image:
                width, height = image.size
        else:
            with Image.open(source) as image:
                image = ImageOps.exif_transpose(image)
                image.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
                if image.mode not in ("RGB", "RGBA"):
                    image = image.convert("RGBA" if "transparency" in image.info else "RGB")
                image.save(destination, "WEBP", quality=88, method=6)
                width, height = image.size

            if destination.stat().st_size > MAX_OUTPUT_BYTES:
                with Image.open(destination) as image:
                    image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
                    image.convert("RGB").save(destination, "WEBP", quality=78, method=6)
                    width, height = image.size

        entries.append(
            {
                "id": digest,
                "title": source.stem,
                "tag": classify(str(relative)),
                "project": project,
                "image": f"/portfolio/{destination.name}",
                "media": "image",
                "cover": is_cover,
                "width": width,
                "height": height,
            }
        )

    entries.sort(key=lambda item: PROJECT_ORDER.get(str(item["project"]), 99))
    retained = {Path(str(item["image"])).name for item in entries}
    for generated in (*OUTPUT.glob("work-*"), *OUTPUT.glob("cover-*")):
        if generated.name not in retained:
            generated.unlink()
    oversized = [path for path in OUTPUT.iterdir() if path.is_file() and path.stat().st_size > MAX_OUTPUT_BYTES]
    if oversized:
        raise RuntimeError("generated files exceed 20 MB: " + ", ".join(path.name for path in oversized))
    MANIFEST.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"count": len(entries), "output": str(OUTPUT)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
