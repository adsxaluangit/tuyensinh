#!/bin/sh
set -e

# ============================================
# Backup PostgreSQL - Hệ thống tuyển sinh
# ============================================

DATE=$(date +%Y%m%d_%H%M%S)
DAY=$(date +%u)          # 1=Thứ 2 ... 7=Chủ nhật
MONTH_DAY=$(date +%d)    # Ngày trong tháng (01-31)

BACKUP_DIR="/backups"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

FILENAME="tuyensinh_${DATE}.sql.gz"

echo "=============================="
echo "[$(date)] Bắt đầu backup..."
echo "=============================="

# Thực hiện backup
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  | gzip > "$DAILY_DIR/$FILENAME"

SIZE=$(du -sh "$DAILY_DIR/$FILENAME" | cut -f1)
echo "[$(date)] ✅ Backup thành công: $FILENAME ($SIZE)"

# --- Backup tuần (Chủ nhật = ngày 7) ---
if [ "$DAY" = "7" ]; then
  cp "$DAILY_DIR/$FILENAME" "$WEEKLY_DIR/$FILENAME"
  echo "[$(date)] 📅 Đã lưu backup tuần: $FILENAME"
fi

# --- Backup tháng (ngày 1 hàng tháng) ---
if [ "$MONTH_DAY" = "01" ]; then
  cp "$DAILY_DIR/$FILENAME" "$MONTHLY_DIR/$FILENAME"
  echo "[$(date)] 📆 Đã lưu backup tháng: $FILENAME"
fi

# --- Xoá bản cũ ---
# Giữ 7 bản daily
find "$DAILY_DIR" -name "*.sql.gz" -type f | sort | head -n -7 | xargs -r rm -f
# Giữ 4 bản weekly
find "$WEEKLY_DIR" -name "*.sql.gz" -type f | sort | head -n -4 | xargs -r rm -f
# Giữ 3 bản monthly
find "$MONTHLY_DIR" -name "*.sql.gz" -type f | sort | head -n -3 | xargs -r rm -f

echo "--- Danh sách backup hiện tại ---"
echo "[Daily]:"
ls -lh "$DAILY_DIR"
echo "[Weekly]:"
ls -lh "$WEEKLY_DIR"
echo "[Monthly]:"
ls -lh "$MONTHLY_DIR"
echo "=============================="
echo "[$(date)] Hoàn tất backup!"
echo "=============================="
