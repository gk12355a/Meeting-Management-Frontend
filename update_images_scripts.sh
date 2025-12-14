#!/bin/bash

# Dừng ngay nếu có lỗi
set -e

# Tham số nhận từ Jenkins
IMAGE_NAME=$1    # Tên image (meeting-management-frontend)
TAG=$2           # Tag phiên bản (v1.0.0)
NAMESPACE=$3     # Môi trường (dev/prod)
YAML_DIR=$4      # Thư mục chứa file YAML (manifest)

# [CẬP NHẬT] Username Docker Hub của bạn
DOCKER_USER="gk123a"

echo "-------------------------------------------------"
echo "UPDATING FRONTEND MANIFESTS"
echo "Target Dir: $YAML_DIR"
echo "New Image:  $DOCKER_USER/$IMAGE_NAME:$TAG-$NAMESPACE"
echo "-------------------------------------------------"

# Kiểm tra thư mục manifest có tồn tại không
if [ ! -d "$YAML_DIR" ]; then
  echo "Error: Directory '$YAML_DIR' not found!"
  exit 1
fi

# Tạo chuỗi image đầy đủ
# VD: gk123a/meeting-management-frontend:v1.0.0-dev
NEW_FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}:${TAG}-${NAMESPACE}"

# Hàm tìm và thay thế nội dung file
update_yaml() {
    local file=$1
    echo "Processing file: $file"
    
    # Logic thay thế thông minh:
    # Tìm dòng chứa "image: .../fe:..." (tên cũ ngắn gọn bạn đang dùng) 
    # HOẶC dòng chứa tên đầy đủ "meeting-management-frontend" (cho các lần deploy sau)
    # Thay bằng chuỗi image mới.
    
    sed -i -E "s|image: .*/(fe|${IMAGE_NAME}):.*|image: ${NEW_FULL_IMAGE}|g" "$file"
}

# Tìm tất cả file .yaml trong thư mục manifest để xử lý
FILES=$(find "$YAML_DIR" -type f \( -name "*.yaml" -o -name "*.yml" \))

for FILE in $FILES; do
    update_yaml "$FILE"
done

echo "SUCCESS: Updated manifests to use image: $NEW_FULL_IMAGE"