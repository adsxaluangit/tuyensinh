#!/bin/sh
# ============================================
# Restore PostgreSQL - Hệ thống tuyển sinh
# ============================================
# Sử dụng:
#   docker exec -it tuyensinh-backup /restore.sh /backups/daily/tuyensinh_db_20260604_020000.sql.gz
# ============================================

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "=============================================="
  echo "❌ LỖI: Vui lòng chỉ định file backup!"
  echo ""
  echo "Cách sử dụng:"
  echo "  docker exec -it tuyensinh-backup /restore.sh <đường_dẫn_file>"
  echo ""
  echo "Ví dụ:"
  echo "  docker exec -it tuyensinh-backup /restore.sh /backups/daily/tuyensinh_db_20260604_020000.sql.gz"
  echo ""
  echo "Danh sách backup hiện có:"
  echo "--- Daily ---"
  ls -lh /backups/daily/*.sql.gz 2>/dev/null || echo "  (không có)"
  echo "--- Weekly ---"
  ls -lh /backups/weekly/*.sql.gz 2>/dev/null || echo "  (không có)"
  echo "--- Monthly ---"
  ls -lh /backups/monthly/*.sql.gz 2>/dev/null || echo "  (không có)"
  echo "=============================================="
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ LỖI: Không tìm thấy file: $BACKUP_FILE"
  exit 1
fi

echo "=============================================="
echo "[$(date)] ⚠️  CẢNH BÁO: Thao tác này sẽ XÓA toàn bộ dữ liệu hiện tại!"
echo "  Database : $POSTGRES_DB"
echo "  Host     : $POSTGRES_HOST"
echo "  File     : $BACKUP_FILE"
echo "=============================================="
echo ""
printf "Bạn có chắc muốn tiếp tục? (gõ 'yes' để xác nhận): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Đã hủy restore."
  exit 0
fi

echo ""
echo "[$(date)] 🔍 Kiểm tra kết nối database..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_isready \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -q

if [ $? -ne 0 ]; then
  echo "[$(date)] ❌ Không thể kết nối database!"
  exit 1
fi
echo "[$(date)] ✅ Kết nối OK."

echo "[$(date)] 🗑️  Đang xóa dữ liệu hiện tại..."
PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" 2>/dev/null

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d postgres \
  -c "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;"

echo "[$(date)] 📥 Đang khôi phục dữ liệu từ: $(basename $BACKUP_FILE)"
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  -q

if [ $? -eq 0 ]; then
  echo "=============================================="
  echo "[$(date)] ✅ Restore thành công!"
  echo "  Dữ liệu đã được khôi phục từ: $(basename $BACKUP_FILE)"
  echo "=============================================="
else
  echo "=============================================="
  echo "[$(date)] ❌ Restore thất bại! Vui lòng kiểm tra lại."
  echo "=============================================="
  exit 1
fi
