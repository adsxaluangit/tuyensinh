#!/bin/sh
set -e

# ============================================
# Backup PostgreSQL + Uploads - Hệ thống tuyển sinh
# ============================================

DATE=$(date +%Y%m%d_%H%M%S)
DAY=$(date +%u)          # 1=Thứ 2 ... 7=Chủ nhật
MONTH_DAY=$(date +%d)    # Ngày trong tháng (01-31)

BACKUP_DIR="/backups"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"
HOST_DIR="$BACKUP_DIR/host"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR" "$HOST_DIR"

DB_FILENAME="tuyensinh_db_${DATE}.sql.gz"
UPLOADS_FILENAME="tuyensinh_uploads_${DATE}.tar.gz"

echo "=============================================="
echo "[$(date)] 🚀 Bắt đầu backup hệ thống tuyển sinh..."
echo "=============================================="

# --- Kiểm tra kết nối DB trước khi backup ---
echo "[$(date)] 🔍 Kiểm tra kết nối database..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_isready \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -q

if [ $? -ne 0 ]; then
  echo "[$(date)] ❌ LỖI: Không thể kết nối database! Hủy backup."
  exit 1
fi
echo "[$(date)] ✅ Kết nối database OK."

# --- Backup Database ---
echo "[$(date)] 💾 Đang backup database..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  | gzip > "$DAILY_DIR/$DB_FILENAME"

DB_SIZE=$(du -sh "$DAILY_DIR/$DB_FILENAME" | cut -f1)
echo "[$(date)] ✅ Backup DB thành công: $DB_FILENAME ($DB_SIZE)"

# --- Backup Uploads (ảnh/file đính kèm Strapi) ---
UPLOADS_DIR="/uploads"
if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A $UPLOADS_DIR 2>/dev/null)" ]; then
  echo "[$(date)] 🖼️  Đang backup uploads..."
  tar -czf "$DAILY_DIR/$UPLOADS_FILENAME" -C "$UPLOADS_DIR" .
  UPLOADS_SIZE=$(du -sh "$DAILY_DIR/$UPLOADS_FILENAME" | cut -f1)
  echo "[$(date)] ✅ Backup uploads thành công: $UPLOADS_FILENAME ($UPLOADS_SIZE)"
else
  echo "[$(date)] ℹ️  Thư mục uploads trống hoặc không tồn tại, bỏ qua."
fi

# --- Copy ra thư mục host (để mount ra máy chủ) ---
cp "$DAILY_DIR/$DB_FILENAME" "$HOST_DIR/$DB_FILENAME"
echo "[$(date)] 📂 Đã copy backup ra thư mục host."

# --- Backup tuần (Chủ nhật = ngày 7) ---
if [ "$DAY" = "7" ]; then
  cp "$DAILY_DIR/$DB_FILENAME" "$WEEKLY_DIR/$DB_FILENAME"
  [ -f "$DAILY_DIR/$UPLOADS_FILENAME" ] && cp "$DAILY_DIR/$UPLOADS_FILENAME" "$WEEKLY_DIR/$UPLOADS_FILENAME"
  echo "[$(date)] 📅 Đã lưu backup tuần: $DB_FILENAME"
fi

# --- Backup tháng (ngày 1 hàng tháng) ---
if [ "$MONTH_DAY" = "01" ]; then
  cp "$DAILY_DIR/$DB_FILENAME" "$MONTHLY_DIR/$DB_FILENAME"
  [ -f "$DAILY_DIR/$UPLOADS_FILENAME" ] && cp "$DAILY_DIR/$UPLOADS_FILENAME" "$MONTHLY_DIR/$UPLOADS_FILENAME"
  echo "[$(date)] 📆 Đã lưu backup tháng: $DB_FILENAME"
fi

# --- Xoá bản cũ (giữ lại N bản gần nhất) ---
# Daily: giữ 7 bản (1 tuần)
find "$DAILY_DIR" -name "tuyensinh_db_*.sql.gz" -type f | sort | head -n -7 | xargs -r rm -f
find "$DAILY_DIR" -name "tuyensinh_uploads_*.tar.gz" -type f | sort | head -n -7 | xargs -r rm -f
# Weekly: giữ 4 bản (~1 tháng)
find "$WEEKLY_DIR" -name "*.sql.gz" -type f | sort | head -n -4 | xargs -r rm -f
find "$WEEKLY_DIR" -name "*.tar.gz" -type f | sort | head -n -4 | xargs -r rm -f
# Monthly: giữ 3 bản (~3 tháng)
find "$MONTHLY_DIR" -name "*.sql.gz" -type f | sort | head -n -3 | xargs -r rm -f
find "$MONTHLY_DIR" -name "*.tar.gz" -type f | sort | head -n -3 | xargs -r rm -f
# Host: giữ 7 bản
find "$HOST_DIR" -name "*.sql.gz" -type f | sort | head -n -7 | xargs -r rm -f

# --- Tổng kết ---
echo ""
echo "--- 📋 Danh sách backup hiện tại ---"
echo "[Daily - $(ls $DAILY_DIR | wc -l) files]:"
ls -lh "$DAILY_DIR" 2>/dev/null || echo "  (trống)"
echo "[Weekly - $(ls $WEEKLY_DIR | wc -l) files]:"
ls -lh "$WEEKLY_DIR" 2>/dev/null || echo "  (trống)"
echo "[Monthly - $(ls $MONTHLY_DIR | wc -l) files]:"
ls -lh "$MONTHLY_DIR" 2>/dev/null || echo "  (trống)"
echo "=============================================="
echo "[$(date)] 🎉 Hoàn tất backup!"
echo "=============================================="
