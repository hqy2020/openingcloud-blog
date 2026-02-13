#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="${1:-references/github}"
mkdir -p "$BASE_DIR"
cd "$BASE_DIR"

# All reference repos grouped by system
repos=(
  # 🐑 宠物系统
  "https://github.com/adryd325/oneko.js.git"
  "https://github.com/kyrie25/spicetify-oneko.git"

  # 🌐 Three.js 动态系统
  "https://github.com/pmndrs/react-three-fiber.git"
  "https://github.com/pmndrs/drei.git"

  # 🎞️ 动画系统
  "https://github.com/motiondivision/motion.git"

  # 🛤️ 时间线组件
  "https://github.com/prabhuignoto/react-chrono.git"
  "https://github.com/stephane-monnot/react-vertical-timeline.git"

  # 🗺️ 地图系统
  "https://github.com/apache/echarts.git"
  "https://github.com/longwosion/geojson-map-china.git"

  # 👥 社交图谱系统
  "https://github.com/vasturiano/react-force-graph.git"
  "https://github.com/vasturiano/r3f-forcegraph.git"

  # 🎨 图标系统
  "https://github.com/lucide-icons/lucide.git"

  # 🔧 后管系统
  "https://github.com/clauderic/dnd-kit.git"
  "https://github.com/uiwjs/react-md-editor.git"

  # 📦 个人仓库
  "https://github.com/hqy2020/openingcloud-blog.git"
  "https://github.com/hqy2020/GardenOfOpeningClouds.git"
  "https://github.com/hqy2020/hqy2020.git"
)

for repo in "${repos[@]}"; do
  name="$(basename "$repo" .git)"
  if [ -d "$name/.git" ]; then
    echo "[skip] $name already exists"
    continue
  fi
  echo "[clone] $repo"
  git clone --depth 1 "$repo" "$name"
done

echo "Done. Cloned repos under: $(pwd)"
