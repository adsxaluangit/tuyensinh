#!/bin/sh
# Entrypoint: cài crond, chạy backup ngay lần đầu, sau đó theo lịch + khởi động HTTP server
echo "🚀 Khởi động backup service..."
echo "⏰ Lịch backup: 2:00 sáng mỗi ngày"

# Chạy backup ngay lần đầu khi khởi động
echo "▶️  Đang chạy backup lần đầu..."
/backup.sh

# Cài cron schedule: 2:00 AM mỗi ngày
echo "0 2 * * * /backup.sh >> /var/log/backup.log 2>&1" | crontab -
echo "✅ Cron đã được cài đặt. Backup sẽ chạy lúc 2:00 AM hàng ngày."

# Khởi động Python HTTP server (chạy nền)
echo "🌐 Khởi động HTTP server trên port 8080..."
python3 /http-server.py &

# Khởi động crond (foreground để giữ container sống)
crond -f -l 8
