#!/bin/bash
# 自动迁移 aileen_machina/backend 相关核心文件到新仓库 US-STOCKS-DEEP-ANALYSIS
# 用法：bash migrate_backend_to_usstocks.sh ~/US-STOCKS-DEEP-ANALYSIS

set -e

SRC_DIR="$(cd "$(dirname "$0")" && pwd)/backend"
DEST_DIR="$1"

if [ -z "$DEST_DIR" ]; then
  echo "请传入目标新仓库路径，如：bash migrate_backend_to_usstocks.sh ~/US-STOCKS-DEEP-ANALYSIS"
  exit 1
fi

# 创建目标目录结构
mkdir -p "$DEST_DIR/src/config"
mkdir -p "$DEST_DIR/src/services"
mkdir -p "$DEST_DIR/src/db"

# 复制核心代码和配置
cp "$SRC_DIR/.env" "$DEST_DIR/.env"
cp "$SRC_DIR/vercel.json" "$DEST_DIR/vercel.json"
cp "$SRC_DIR/drizzle.config.ts" "$DEST_DIR/drizzle.config.ts"
cp "$SRC_DIR/src/config/env.ts" "$DEST_DIR/src/config/env.ts"
cp "$SRC_DIR/src/services/stock.service.ts" "$DEST_DIR/src/services/stock.service.ts"
cp "$SRC_DIR/src/services/cache.service.ts" "$DEST_DIR/src/services/cache.service.ts"
cp "$SRC_DIR/src/db/index.ts" "$DEST_DIR/src/db/index.ts"

if [ -f "$SRC_DIR/src/db/schema.ts" ]; then
  cp "$SRC_DIR/src/db/schema.ts" "$DEST_DIR/src/db/schema.ts"
fi

# 复制 package.json 依赖提示
cp "$SRC_DIR/package.json" "$DEST_DIR/package.json"

# 复制 fetcher 工具（如有）
if [ -f "$SRC_DIR/src/utils/fetcher.ts" ]; then
  mkdir -p "$DEST_DIR/src/utils"
  cp "$SRC_DIR/src/utils/fetcher.ts" "$DEST_DIR/src/utils/fetcher.ts"
fi

echo "✅ 迁移完成！请到 $DEST_DIR 检查并根据实际情况调整 import 路径和依赖。"
