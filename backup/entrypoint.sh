#!/bin/sh
# Entrypoint: cài crond rồi chạy backup ngay lần đầu, sau đó theo lịch
echo "🚀 Khởi động backup service..."
echo "⏰ Lịch backup: 2:00 sáng mỗi ngày"

# Chạy backup ngay lần đầu khi khởi động
echo "▶️  Đang chạy backup lần đầu..."
/backup.sh

# Cài cron schedule: 2:00 AM mỗi ngày
echo "0 2 * * * /backup.sh >> /var/log/backup.log 2>&1" | crontab -

echo "✅ Cron đã được cài đặt. Backup sẽ chạy lúc 2:00 AM hàng ngày."
crond -f -l 8
