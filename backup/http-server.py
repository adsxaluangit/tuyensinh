#!/usr/bin/env python3
"""
HTTP Trigger Server cho Backup thủ công
Lắng nghe trên port 8080
POST /backup  -> Chạy backup.sh
GET  /status  -> Trả về danh sách backup
OPTIONS *     -> CORS preflight
"""
import http.server
import subprocess
import json
import os
import glob

BACKUP_DIR = "/backups/daily"
PORT = 8080

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

class BackupHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"[HTTP] {self.address_string()} - {format % args}", flush=True)

    def send_json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.path == "/status":
            try:
                files = sorted(glob.glob(f"{BACKUP_DIR}/*.sql.gz"), reverse=True)
                latest = os.path.basename(files[0]) if files else ""
                self.send_json(200, {
                    "status": "ok",
                    "daily_count": len(files),
                    "latest": latest,
                })
            except Exception as e:
                self.send_json(500, {"status": "error", "message": str(e)})
        else:
            self.send_json(404, {"status": "not_found"})

    def do_POST(self):
        if self.path == "/backup":
            print("[HTTP] Nhận lệnh backup thủ công...", flush=True)
            try:
                result = subprocess.run(
                    ["/backup.sh"],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                if result.returncode == 0:
                    # Lấy file mới nhất
                    files = sorted(glob.glob(f"{BACKUP_DIR}/*.sql.gz"), reverse=True)
                    latest = os.path.basename(files[0]) if files else ""
                    size = ""
                    if files:
                        sz = os.path.getsize(files[0])
                        size = f"{sz / 1024:.1f} KB" if sz < 1048576 else f"{sz / 1048576:.1f} MB"

                    self.send_json(200, {
                        "status": "success",
                        "message": "Backup thủ công hoàn tất thành công!",
                        "file": latest,
                        "size": size,
                    })
                else:
                    self.send_json(200, {
                        "status": "error",
                        "message": f"Backup thất bại: {result.stderr[:200]}",
                    })
            except subprocess.TimeoutExpired:
                self.send_json(200, {"status": "error", "message": "Backup timeout (>5 phút)!"})
            except Exception as e:
                self.send_json(500, {"status": "error", "message": str(e)})
        else:
            self.send_json(404, {"status": "not_found"})


if __name__ == "__main__":
    print(f"🌐 Backup HTTP server khởi động trên port {PORT}...", flush=True)
    server = http.server.HTTPServer(("0.0.0.0", PORT), BackupHandler)
    print(f"✅ Đang lắng nghe tại 0.0.0.0:{PORT}", flush=True)
    server.serve_forever()
