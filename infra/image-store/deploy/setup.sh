#!/bin/bash
set -euo pipefail

# ── Oracle Cloud Always Free VM 一键部署脚本 ──
# 在 VM 上运行: curl -sL <url> | bash
# 或者 scp 上去后运行: bash setup.sh

echo "=== 图片存储服务部署 ==="

# 1. 安装 Docker
if ! command -v docker &>/dev/null; then
  echo "→ 安装 Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "→ Docker 安装完成"
else
  echo "→ Docker 已安装"
fi

# 2. 创建项目目录
APP_DIR="$HOME/image-store"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "→ 项目目录: $APP_DIR"

# 3. 生成安全密码（如果 .env 不存在）
if [ ! -f .env ]; then
  PG_PASS=$(openssl rand -base64 24 | tr -d '/+=')
  API_KEY=$(openssl rand -base64 32 | tr -d '/+=')

  cat > .env <<EOF
POSTGRES_USER=imgstore
POSTGRES_PASSWORD=$PG_PASS
POSTGRES_DB=imgstore
REDIS_MAXMEMORY=512mb
API_KEYS=$API_KEY
PUBLIC_BASE_URL=http://localhost:8080
STORAGE_DIR=/var/lib/imgstore
PORT=8080
EOF

  echo "→ .env 已生成"
  echo "================================================="
  echo "  API_KEY: $API_KEY"
  echo "  请保存此 Key，用于 wrangler secret put"
  echo "================================================="
else
  echo "→ .env 已存在，跳过"
  API_KEY=$(grep API_KEYS .env | cut -d= -f2)
fi

# 4. 检查必要文件是否存在
for f in docker-compose.yml Dockerfile package.json src/server.mjs migrations/001_init.sql; do
  if [ ! -f "$f" ]; then
    echo "❌ 缺少文件: $f"
    echo "请先将 infra/image-store/ 目录内容复制到 $APP_DIR/"
    exit 1
  fi
done

# 5. 启动服务
echo "→ 启动 Docker 服务..."
sudo docker compose up -d --build

# 6. 等待健康检查
echo "→ 等待服务启动..."
for i in $(seq 1 30); do
  if curl -sf localhost:8080/healthz >/dev/null 2>&1; then
    echo "→ 健康检查通过!"
    break
  fi
  sleep 2
done

# 7. 验证
echo ""
echo "=== 部署完成 ==="
curl -s localhost:8080/healthz
echo ""
echo ""
echo "下一步:"
echo "  1. 配置防火墙: sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT"
echo "  2. 或使用 Cloudflare Tunnel（推荐，更安全）:"
echo "     cloudflared tunnel create img-store"
echo "     cloudflared tunnel route dns img-store img.你的域名.com"
echo "  3. 在 Cloudflare Worker 设置:"
echo "     wrangler secret put IMAGE_STORE_API_KEY  (输入: $API_KEY)"
echo "  4. 更新 wrangler.jsonc 中的 IMAGE_STORE_URL 和 IMAGE_STORE_PUBLIC_URL"
