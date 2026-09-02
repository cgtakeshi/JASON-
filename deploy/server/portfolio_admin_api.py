#!/usr/bin/env python3
"""Small same-origin CMS API for the JASON portfolio ECS deployment."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import shutil
import threading
import time
from collections import defaultdict, deque
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


HOST = os.environ.get("PORTFOLIO_ADMIN_HOST", "127.0.0.1")
PORT = int(os.environ.get("PORTFOLIO_ADMIN_PORT", "8787"))
DATA_FILE = Path(os.environ.get("PORTFOLIO_DATA_FILE", "/var/lib/jason-portfolio/portfolio-manifest.json"))
BACKUP_DIR = Path(os.environ.get("PORTFOLIO_BACKUP_DIR", "/var/lib/jason-portfolio/backups"))
TRASH_DIR = Path(os.environ.get("PORTFOLIO_TRASH_DIR", "/var/lib/jason-portfolio/deleted-assets"))
ASSET_ROOT = Path(os.environ.get("PORTFOLIO_ASSET_ROOT", "/var/www/jason-portfolio/oss"))
PASSWORD_HASH = os.environ["PORTFOLIO_ADMIN_PASSWORD_HASH"]
SESSION_SECRET = bytes.fromhex(os.environ["PORTFOLIO_ADMIN_SESSION_SECRET"])
SESSION_SECONDS = 12 * 60 * 60
MAX_ASSET_BYTES = 20 * 1024 * 1024
MAX_REQUEST_BYTES = 29 * 1024 * 1024
MAX_WORKS = 2000
ALLOWED_ORIGINS = {"https://jasongame.com", "https://www.jasongame.com"}
ASSET_RE = re.compile(r"^/portfolio/work-([a-f0-9]{12})\.(webp|png|jpg|jpeg|gif|mp4|webm)$")
ID_RE = re.compile(r"^[a-f0-9]{12}$")
LOCK = threading.RLock()
LOGIN_ATTEMPTS: dict[str, deque[float]] = defaultdict(deque)


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def version_of(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()[:20]


def read_data() -> tuple[bytes, list[dict[str, Any]]]:
    raw = DATA_FILE.read_bytes()
    value = json.loads(raw)
    if not isinstance(value, list):
        raise ValueError("作品数据格式错误")
    return raw, value


def validate_works(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list) or len(value) > MAX_WORKS:
        raise ValueError("作品数据数量异常")
    clean: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, dict):
            raise ValueError("作品条目格式错误")
        work_id = item.get("id")
        if not isinstance(work_id, str) or not ID_RE.fullmatch(work_id) or work_id in seen:
            raise ValueError("作品 ID 无效或重复")
        seen.add(work_id)
        title = item.get("title")
        title_en = item.get("titleEn")
        project = item.get("project")
        tag = item.get("tag")
        image = item.get("image")
        media = item.get("media")
        width = item.get("width")
        height = item.get("height")
        if not isinstance(title, str) or not title.strip() or len(title) > 240:
            raise ValueError("作品名称无效")
        if title_en is not None and (not isinstance(title_en, str) or len(title_en) > 240):
            raise ValueError("英文名称无效")
        if not isinstance(project, str) or not project.strip() or len(project) > 160:
            raise ValueError("所属项目无效")
        if not isinstance(tag, str) or not tag.strip() or len(tag) > 80:
            raise ValueError("作品分类无效")
        if not isinstance(image, str) or not image.startswith("/") or len(image) > 500:
            raise ValueError("素材地址无效")
        if media not in {"image", "video"}:
            raise ValueError("素材类型无效")
        if not isinstance(width, int) or not isinstance(height, int) or not (0 < width <= 50000 and 0 < height <= 50000):
            raise ValueError("素材尺寸无效")
        clean_item: dict[str, Any] = {
            "id": work_id,
            "title": title.strip(),
            "tag": tag.strip(),
            "project": project.strip(),
            "image": image,
            "media": media,
            "cover": bool(item.get("cover", False)),
            "width": width,
            "height": height,
        }
        if title_en and title_en.strip():
            clean_item["titleEn"] = title_en.strip()
        if bool(item.get("hidden", False)):
            clean_item["hidden"] = True
        clean.append(clean_item)
    return clean


def verify_password(password: str) -> bool:
    try:
        salt_hex, expected_hex = PASSWORD_HASH.split("$", 1)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), 310000)
        return hmac.compare_digest(actual.hex(), expected_hex)
    except (ValueError, TypeError):
        return False


def make_session() -> str:
    payload = f"{int(time.time()) + SESSION_SECONDS}.{secrets.token_urlsafe(18)}"
    signature = hmac.new(SESSION_SECRET, payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def valid_session(value: str | None) -> bool:
    if not value:
        return False
    try:
        expiry, nonce, signature = value.split(".", 2)
        payload = f"{expiry}.{nonce}"
        expected = hmac.new(SESSION_SECRET, payload.encode(), hashlib.sha256).hexdigest()
        return int(expiry) >= int(time.time()) and hmac.compare_digest(signature, expected)
    except (ValueError, TypeError):
        return False


def safe_asset(path: str) -> Path:
    if not ASSET_RE.fullmatch(path):
        raise ValueError("素材路径不在允许范围内")
    resolved = (ASSET_ROOT / path.lstrip("/")).resolve()
    if ASSET_ROOT.resolve() not in resolved.parents:
        raise ValueError("素材路径无效")
    return resolved


def prune(directory: Path, limit: int) -> None:
    files = sorted((p for p in directory.iterdir() if p.is_file()), key=lambda p: p.stat().st_mtime, reverse=True)
    for path in files[limit:]:
        path.unlink(missing_ok=True)


class Handler(BaseHTTPRequestHandler):
    server_version = "JasonPortfolioAdmin/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"{self.client_address[0]} - {fmt % args}", flush=True)

    def send_json(self, status: int, value: Any, *, cookie: str | None = None) -> None:
        body = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> Any:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as exc:
            raise ValueError("请求长度无效") from exc
        if length <= 0 or length > MAX_REQUEST_BYTES:
            raise ValueError("请求内容为空或超过限制")
        return json.loads(self.rfile.read(length))

    def session(self) -> bool:
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        morsel = cookie.get("jason_admin")
        return valid_session(morsel.value if morsel else None)

    def same_origin(self) -> bool:
        return self.headers.get("Origin") in ALLOWED_ORIGINS

    def works_response(self) -> dict[str, Any]:
        raw, works = read_data()
        return {"version": version_of(raw), "works": works}

    def do_GET(self) -> None:
        try:
            if self.path.split("?", 1)[0] == "/api/portfolio":
                with LOCK:
                    raw, works = read_data()
                self.send_json(HTTPStatus.OK, {"version": version_of(raw), "works": works})
                return
            if self.path.split("?", 1)[0] == "/api/admin/works":
                if not self.session():
                    self.send_json(HTTPStatus.UNAUTHORIZED, {"message": "请先登录后台"})
                    return
                with LOCK:
                    response = self.works_response()
                self.send_json(HTTPStatus.OK, response)
                return
            self.send_json(HTTPStatus.NOT_FOUND, {"message": "接口不存在"})
        except Exception as exc:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"message": "服务器读取失败"})
            self.log_error("GET failed: %r", exc)

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        try:
            if not self.same_origin():
                self.send_json(HTTPStatus.FORBIDDEN, {"message": "请求来源无效"})
                return
            if path == "/api/admin/login":
                ip = self.headers.get("X-Real-IP") or self.client_address[0]
                now = time.time()
                attempts = LOGIN_ATTEMPTS[ip]
                while attempts and attempts[0] < now - 900:
                    attempts.popleft()
                if len(attempts) >= 8:
                    self.send_json(HTTPStatus.TOO_MANY_REQUESTS, {"message": "登录尝试过多，请稍后再试"})
                    return
                body = self.read_json()
                password = body.get("password") if isinstance(body, dict) else None
                if not isinstance(password, str) or not verify_password(password):
                    attempts.append(now)
                    time.sleep(0.35)
                    self.send_json(HTTPStatus.UNAUTHORIZED, {"message": "后台密码不正确"})
                    return
                attempts.clear()
                with LOCK:
                    response = self.works_response()
                cookie = f"jason_admin={make_session()}; Path=/api/admin; Max-Age={SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict"
                self.send_json(HTTPStatus.OK, response, cookie=cookie)
                return
            if path == "/api/admin/logout":
                self.send_json(HTTPStatus.OK, {"ok": True}, cookie="jason_admin=; Path=/api/admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict")
                return
            self.send_json(HTTPStatus.NOT_FOUND, {"message": "接口不存在"})
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json(HTTPStatus.BAD_REQUEST, {"message": str(exc)})
        except Exception as exc:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"message": "服务器处理失败"})
            self.log_error("POST failed: %r", exc)

    def do_PUT(self) -> None:
        try:
            if self.path.split("?", 1)[0] != "/api/admin/works":
                self.send_json(HTTPStatus.NOT_FOUND, {"message": "接口不存在"})
                return
            if not self.same_origin() or not self.session():
                self.send_json(HTTPStatus.UNAUTHORIZED, {"message": "登录会话已失效，请重新登录"})
                return
            body = self.read_json()
            if not isinstance(body, dict):
                raise ValueError("请求格式错误")
            works = validate_works(body.get("works"))
            expected_version = body.get("version")
            asset = body.get("asset")
            delete_path = body.get("deletePath")

            with LOCK:
                current_raw, _ = read_data()
                if expected_version != version_of(current_raw):
                    self.send_json(HTTPStatus.CONFLICT, {"message": "内容已被更新，请刷新后再保存"})
                    return
                timestamp = time.strftime("%Y%m%d-%H%M%S") + f"-{time.time_ns() % 1000000:06d}"
                BACKUP_DIR.mkdir(parents=True, exist_ok=True)
                (BACKUP_DIR / f"portfolio-manifest-{timestamp}.json").write_bytes(current_raw)

                new_asset_path: str | None = None
                if asset is not None:
                    if not isinstance(asset, dict) or not isinstance(asset.get("path"), str) or not isinstance(asset.get("data"), str):
                        raise ValueError("上传素材格式错误")
                    new_asset_path = asset["path"]
                    destination = safe_asset(new_asset_path)
                    try:
                        payload = base64.b64decode(asset["data"], validate=True)
                    except ValueError as exc:
                        raise ValueError("素材编码无效") from exc
                    if not payload or len(payload) > MAX_ASSET_BYTES:
                        raise ValueError("素材为空或超过 20MB")
                    if new_asset_path not in {work["image"] for work in works}:
                        raise ValueError("上传素材未被作品数据引用")
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    temporary = destination.with_name(f".{destination.name}.upload-{secrets.token_hex(6)}")
                    temporary.write_bytes(payload)
                    os.chmod(temporary, 0o644)
                    os.replace(temporary, destination)

                next_raw = json_bytes(works)
                DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
                temporary_data = DATA_FILE.with_name(f".{DATA_FILE.name}.update-{secrets.token_hex(6)}")
                temporary_data.write_bytes(next_raw)
                os.chmod(temporary_data, 0o640)
                os.replace(temporary_data, DATA_FILE)

                if isinstance(delete_path, str) and delete_path != new_asset_path:
                    old_asset = safe_asset(delete_path)
                    if old_asset.exists():
                        TRASH_DIR.mkdir(parents=True, exist_ok=True)
                        shutil.move(str(old_asset), str(TRASH_DIR / f"{timestamp}-{old_asset.name}"))
                prune(BACKUP_DIR, 100)
                if TRASH_DIR.exists():
                    prune(TRASH_DIR, 100)
                self.send_json(HTTPStatus.OK, {"version": version_of(next_raw), "works": works})
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json(HTTPStatus.BAD_REQUEST, {"message": str(exc)})
        except Exception as exc:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"message": "保存失败，服务器未完成更新"})
            self.log_error("PUT failed: %r", exc)


if __name__ == "__main__":
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    TRASH_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Portfolio admin API listening on {HOST}:{PORT}", flush=True)
    server.serve_forever()
