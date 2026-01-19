#!/bin/bash

# Dừng ngay nếu có lỗi
set -e

# Tham số nhận từ Jenkins
IMAGE_NAME=$1    # meeting-management-frontend
TAG=$2           # v1.0.0
NAMESPACE=$3     # prod
YAML_DIR=$4      # manifest

# Username Docker Hub
DOCKER_USER="gk123a"

echo "-------------------------------------------------"
echo "UPDATING FRONTEND MANIFESTS"
echo "Target Dir: $YAML_DIR"
echo "New Image:  $DOCKER_USER/$IMAGE_NAME:$TAG-$NAMESPACE"
echo "-------------------------------------------------"

if [ ! -d "$YAML_DIR" ]; then
  echo "Error: Directory '$YAML_DIR' not found!"
  exit 1
fi

NEW_FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}:${TAG}-${NAMESPACE}"

update_yaml() {
    local file=$1
    echo "Processing file: $file"
    
    # [FIX] Đổi delimiter từ | sang # để tránh lỗi với regex (fe|name)
    sed -i -E "s#image: .*/(fe|${IMAGE_NAME}):.*#image: ${NEW_FULL_IMAGE}#g" "$file"
}

FILES=$(find "$YAML_DIR" -type f \( -name "*.yaml" -o -name "*.yml" \))

for FILE in $FILES; do
    update_yaml "$FILE"
done

echo "SUCCESS: Updated manifests to use image: $NEW_FULL_IMAGE"