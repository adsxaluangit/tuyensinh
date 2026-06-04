#!/bin/sh
# ============================================
# HTTP trigger server cho manual backup
# Lắng nghe POST /backup trên port 8080
# ============================================

PIPE=/tmp/backup_pipe
mkfifo $PIPE 2>/dev/null || true

echo "🌐 HTTP trigger server đang chạy trên port 8080..."

while true; do
  # Đọc HTTP request
  REQUEST=$(nc -l -p 8080 < $PIPE | head -1)
  
  (
    METHOD=$(echo "$REQUEST" | cut -d' ' -f1)
    PATH_REQ=$(echo "$REQUEST" | cut -d' ' -f2)

    if [ "$METHOD" = "POST" ] && [ "$PATH_REQ" = "/backup" ]; then
      echo "🔔 Nhận lệnh backup thủ công..."
      OUTPUT=$(/backup.sh 2>&1)
      EXIT_CODE=$?
      
      if [ $EXIT_CODE -eq 0 ]; then
        STATUS="success"
        MESSAGE="Backup thủ công hoàn tất thành công!"
        # Lấy tên file backup mới nhất
        LATEST=$(ls -t /backups/daily/*.sql.gz 2>/dev/null | head -1 | xargs -I{} basename {})
        SIZE=$(ls -lh /backups/daily/*.sql.gz 2>/dev/null | tail -1 | awk '{print $5}')
      else
        STATUS="error"
        MESSAGE="Backup thất bại! Xem log để biết chi tiết."
        LATEST=""
        SIZE=""
      fi
      
      JSON="{\"status\":\"$STATUS\",\"message\":\"$MESSAGE\",\"file\":\"$LATEST\",\"size\":\"$SIZE\"}"
      BODY_LEN=$(echo -n "$JSON" | wc -c)
      
      printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: $BODY_LEN\r\nConnection: close\r\n\r\n$JSON"
      
    elif [ "$METHOD" = "OPTIONS" ]; then
      printf "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: POST, GET, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"

    elif [ "$METHOD" = "GET" ] && [ "$PATH_REQ" = "/status" ]; then
      # Lấy danh sách backup
      DAILY_COUNT=$(ls /backups/daily/*.sql.gz 2>/dev/null | wc -l)
      LATEST=$(ls -t /backups/daily/*.sql.gz 2>/dev/null | head -1 | xargs -I{} basename {})
      JSON="{\"status\":\"ok\",\"daily_count\":$DAILY_COUNT,\"latest\":\"$LATEST\"}"
      BODY_LEN=$(echo -n "$JSON" | wc -c)
      printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: $BODY_LEN\r\nConnection: close\r\n\r\n$JSON"
      
    else
      printf "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
    fi
  ) > $PIPE
  
done
