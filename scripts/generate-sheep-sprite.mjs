#!/usr/bin/env node
/**
 * 生成 oneko 格式的小绵羊像素精灵图 (256×128, 8列×4行, 每帧32×32)
 *
 * 精灵图布局 (col, row) — 与 BlogPet.astro spriteSets 对应:
 * Row 0: (0,0)scratchWallN-1 (1,0)NW-1   (2,0)sleeping-1 (3,0)E-1        (4,0)scratchWallW-1 (5,0)scratchSelf-1 (6,0)scratchSelf-2 (7,0)scratchSelf-3
 * Row 1: (0,1)scratchWallN-2 (1,1)NW-2   (2,1)sleeping-2 (3,1)E-2        (4,1)scratchWallW-2 (5,1)SE-1         (6,1)SW-2          (7,1)scratchWallS-1
 * Row 2: (0,2)NE-1           (1,2)N-1    (2,2)scratchWallE-1 (3,2)tired  (4,2)W-1            (5,2)SE-2         (6,2)scratchWallS-2 (7,2)S-2
 * Row 3: (0,3)NE-2           (1,3)N-2    (2,3)scratchWallE-2 (3,3)idle   (4,3)W-2            (5,3)SW-1         (6,3)S-1           (7,3)alert
 */

import sharp from 'sharp';

const COLS = 8;
const ROWS = 4;
const F = 32;
const WIDTH = COLS * F;
const HEIGHT = ROWS * F;

const buf = Buffer.alloc(WIDTH * HEIGHT * 4, 0);

// --- 颜色 ---
const W  = [255, 255, 255, 255];   // 羊毛白
const WS = [215, 218, 228, 255];   // 羊毛阴影
const WD = [195, 198, 210, 255];   // 羊毛深阴影
const FK = [255, 225, 205, 255];   // 脸肤色
const EY = [35, 35, 45, 255];      // 眼
const HL = [255, 255, 255, 255];   // 眼高光
const NS = [240, 140, 140, 255];   // 鼻子粉
const ER = [255, 195, 185, 255];   // 耳朵
const LG = [170, 160, 150, 255];   // 腿
const BL = [255, 175, 175, 100];   // 腮红
const ZZ = [140, 170, 255, 200];   // 睡眠Z
const AL = [255, 80, 80, 255];     // 警觉!
const TR = null;                    // 透明(skip)

function px(x, y, c) {
  if (!c || x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 4;
  if (c[3] < 255 && c[3] > 0) {
    // alpha blend
    const a = c[3] / 255;
    buf[i]     = Math.round(buf[i] * (1 - a) + c[0] * a);
    buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + c[1] * a);
    buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + c[2] * a);
    buf[i + 3] = Math.min(255, buf[i + 3] + c[3]);
  } else {
    buf[i] = c[0]; buf[i+1] = c[1]; buf[i+2] = c[2]; buf[i+3] = c[3];
  }
}

// 帧内像素
function fp(col, row, x, y, c) { px(col * F + x, row * F + y, c); }

// 画一行像素 (数组中 null=跳过)
function row(col, r, y, x0, colors) {
  for (let i = 0; i < colors.length; i++) {
    if (colors[i]) fp(col, r, x0 + i, y, colors[i]);
  }
}

// 填充矩形
function rect(col, r, x, y, w, h, c) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      fp(col, r, x + dx, y + dy, c);
}

// 画圆（填充）
function circle(col, r, cx, cy, radius, c) {
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++)
      if (dx * dx + dy * dy <= radius * radius)
        fp(col, r, cx + dx, cy + dy, c);
}

// 画椭圆（填充）
function ellipse(col, r, cx, cy, rx, ry, c) {
  for (let dy = -ry; dy <= ry; dy++)
    for (let dx = -rx; dx <= rx; dx++)
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1)
        fp(col, r, cx + dx, cy + dy, c);
}

// ============================================================
// 绘制函数
// ============================================================

/**
 * 正面朝下的绵羊（idle/S方向基础）
 */
function sheepFront(c, r, opts = {}) {
  const { eyesClosed = false, legOff = 0, oy = 0 } = opts;

  // 身体羊毛（大圆）
  ellipse(c, r, 16, 16 + oy, 9, 7, W);
  // 阴影底部
  ellipse(c, r, 16, 20 + oy, 8, 3, WS);

  // 头顶蓬松毛卷
  row(c, r, 8 + oy, 12, [TR, W, TR, W, TR, W, TR, W]);
  row(c, r, 9 + oy, 11, [W, W, W, W, W, W, W, W, W, W]);

  // 脸
  rect(c, r, 12, 13 + oy, 8, 7, FK);
  // 圆角
  fp(c, r, 12, 13 + oy, TR); fp(c, r, 19, 13 + oy, TR);
  fp(c, r, 12, 19 + oy, TR); fp(c, r, 19, 19 + oy, TR);

  // 耳朵
  rect(c, r, 10, 13 + oy, 2, 3, ER);
  rect(c, r, 20, 13 + oy, 2, 3, ER);

  // 眼睛
  if (eyesClosed) {
    row(c, r, 15 + oy, 13, [TR, EY, EY, TR, TR, EY, EY]);
  } else {
    fp(c, r, 14, 15 + oy, EY); fp(c, r, 14, 16 + oy, EY);
    fp(c, r, 18, 15 + oy, EY); fp(c, r, 18, 16 + oy, EY);
    // 高光
    fp(c, r, 14, 15 + oy, HL);
    fp(c, r, 18, 15 + oy, HL);
    // 实际眼睛（2x2 带高光）
    fp(c, r, 13, 15 + oy, EY); fp(c, r, 14, 15 + oy, EY);
    fp(c, r, 13, 16 + oy, EY); fp(c, r, 14, 16 + oy, EY);
    fp(c, r, 17, 15 + oy, EY); fp(c, r, 18, 15 + oy, EY);
    fp(c, r, 17, 16 + oy, EY); fp(c, r, 18, 16 + oy, EY);
    fp(c, r, 13, 15 + oy, HL); fp(c, r, 17, 15 + oy, HL);
  }

  // 腮红
  fp(c, r, 12, 17 + oy, BL); fp(c, r, 11, 17 + oy, BL);
  fp(c, r, 20, 17 + oy, BL); fp(c, r, 19, 17 + oy, BL);

  // 鼻/嘴
  fp(c, r, 15, 18 + oy, NS); fp(c, r, 16, 18 + oy, NS);

  // 腿（4条）
  const ly = 22 + oy;
  // 左前
  fp(c, r, 11, ly + legOff, LG); fp(c, r, 11, ly + 1 + legOff, LG);
  fp(c, r, 12, ly + legOff, LG); fp(c, r, 12, ly + 1 + legOff, LG);
  // 左后
  fp(c, r, 14, ly - legOff, LG); fp(c, r, 14, ly + 1 - legOff, LG);
  fp(c, r, 15, ly - legOff, LG); fp(c, r, 15, ly + 1 - legOff, LG);
  // 右后
  fp(c, r, 17, ly + legOff, LG); fp(c, r, 17, ly + 1 + legOff, LG);
  fp(c, r, 18, ly + legOff, LG); fp(c, r, 18, ly + 1 + legOff, LG);
  // 右前
  fp(c, r, 20, ly - legOff, LG); fp(c, r, 20, ly + 1 - legOff, LG);
  fp(c, r, 21, ly - legOff, LG); fp(c, r, 21, ly + 1 - legOff, LG);
}

/**
 * 背面朝上的绵羊（N方向）
 */
function sheepBack(c, r, opts = {}) {
  const { legOff = 0, oy = 0 } = opts;

  // 身体羊毛
  ellipse(c, r, 16, 16 + oy, 9, 7, W);
  ellipse(c, r, 16, 20 + oy, 8, 3, WS);

  // 头顶毛卷
  row(c, r, 8 + oy, 12, [TR, W, TR, W, TR, W, TR, W]);
  row(c, r, 9 + oy, 11, [W, W, W, W, W, W, W, W, W, W]);

  // 耳朵（从后面看）
  rect(c, r, 10, 12 + oy, 2, 2, ER);
  rect(c, r, 20, 12 + oy, 2, 2, ER);

  // 小尾巴
  fp(c, r, 15, 22 + oy, W); fp(c, r, 16, 22 + oy, W);
  fp(c, r, 15, 23 + oy, WS); fp(c, r, 16, 23 + oy, WS);

  // 腿
  const ly = 22 + oy;
  fp(c, r, 11, ly + legOff, LG); fp(c, r, 11, ly + 1 + legOff, LG);
  fp(c, r, 12, ly + legOff, LG); fp(c, r, 12, ly + 1 + legOff, LG);
  fp(c, r, 20, ly - legOff, LG); fp(c, r, 20, ly + 1 - legOff, LG);
  fp(c, r, 21, ly - legOff, LG); fp(c, r, 21, ly + 1 - legOff, LG);
}

/**
 * 侧面绵羊（E/W方向）
 */
function sheepSide(c, r, right = true, opts = {}) {
  const { legOff = 0, oy = 0 } = opts;
  // 身体
  ellipse(c, r, 16, 16 + oy, 10, 6, W);
  ellipse(c, r, 16, 20 + oy, 9, 3, WS);

  if (right) {
    // 朝右：头在右侧
    // 头
    rect(c, r, 21, 12 + oy, 6, 7, FK);
    fp(c, r, 21, 12 + oy, TR); fp(c, r, 26, 12 + oy, TR);
    fp(c, r, 21, 18 + oy, TR); fp(c, r, 26, 18 + oy, TR);
    // 耳
    fp(c, r, 25, 10 + oy, ER); fp(c, r, 26, 10 + oy, ER);
    fp(c, r, 25, 11 + oy, ER); fp(c, r, 26, 11 + oy, ER);
    // 眼
    fp(c, r, 24, 14 + oy, EY); fp(c, r, 24, 15 + oy, EY);
    fp(c, r, 24, 14 + oy, HL);
    // 鼻
    fp(c, r, 25, 17 + oy, NS);
    // 腮红
    fp(c, r, 22, 16 + oy, BL);
    // 头顶毛
    fp(c, r, 22, 11 + oy, W); fp(c, r, 23, 10 + oy, W); fp(c, r, 24, 11 + oy, W);
  } else {
    // 朝左：头在左侧
    rect(c, r, 5, 12 + oy, 6, 7, FK);
    fp(c, r, 5, 12 + oy, TR); fp(c, r, 10, 12 + oy, TR);
    fp(c, r, 5, 18 + oy, TR); fp(c, r, 10, 18 + oy, TR);
    // 耳
    fp(c, r, 5, 10 + oy, ER); fp(c, r, 6, 10 + oy, ER);
    fp(c, r, 5, 11 + oy, ER); fp(c, r, 6, 11 + oy, ER);
    // 眼
    fp(c, r, 7, 14 + oy, EY); fp(c, r, 7, 15 + oy, EY);
    fp(c, r, 7, 14 + oy, HL);
    // 鼻
    fp(c, r, 6, 17 + oy, NS);
    // 腮红
    fp(c, r, 9, 16 + oy, BL);
    // 头顶毛
    fp(c, r, 7, 11 + oy, W); fp(c, r, 8, 10 + oy, W); fp(c, r, 9, 11 + oy, W);
  }

  // 腿（侧面显示前后两条）
  const ly = 22 + oy;
  if (right) {
    fp(c, r, 19, ly + legOff, LG); fp(c, r, 19, ly + 1 + legOff, LG);
    fp(c, r, 20, ly + legOff, LG); fp(c, r, 20, ly + 1 + legOff, LG);
    fp(c, r, 12, ly - legOff, LG); fp(c, r, 12, ly + 1 - legOff, LG);
    fp(c, r, 13, ly - legOff, LG); fp(c, r, 13, ly + 1 - legOff, LG);
  } else {
    fp(c, r, 11, ly + legOff, LG); fp(c, r, 11, ly + 1 + legOff, LG);
    fp(c, r, 12, ly + legOff, LG); fp(c, r, 12, ly + 1 + legOff, LG);
    fp(c, r, 19, ly - legOff, LG); fp(c, r, 19, ly + 1 - legOff, LG);
    fp(c, r, 20, ly - legOff, LG); fp(c, r, 20, ly + 1 - legOff, LG);
  }
}

/**
 * 对角线方向（混合正/侧面）
 */
function sheepDiag(c, r, dirX, dirY, opts = {}) {
  const { legOff = 0 } = opts;
  // dirX: 1=right, -1=left; dirY: -1=up, 1=down
  if (dirY < 0) {
    // 向上 — 偏背面
    sheepBack(c, r, { legOff, oy: -1 });
    // 添加一侧的耳朵突出表示方向
    if (dirX > 0) {
      fp(c, r, 22, 13, ER); fp(c, r, 23, 13, ER);
    } else {
      fp(c, r, 8, 13, ER); fp(c, r, 9, 13, ER);
    }
  } else {
    // 向下 — 偏正面
    sheepFront(c, r, { legOff, oy: -1 });
    // 身体略偏移表示方向
  }
}

// ============================================================
// 填入每个帧
// ============================================================

// idle (3,3)
sheepFront(3, 3, { oy: -2 });

// alert (7,3) — 正面 + 感叹号
sheepFront(7, 3, { oy: -2 });
fp(7, 3, 25, 6, AL); fp(7, 3, 25, 7, AL); fp(7, 3, 25, 8, AL);
fp(7, 3, 25, 10, AL);

// tired (3,2) — 闭眼
sheepFront(3, 2, { oy: -2, eyesClosed: true });

// sleeping (2,0) (2,1) — 闭眼 + zzz
sheepFront(2, 0, { oy: -1, eyesClosed: true });
fp(2, 0, 24, 6, ZZ); fp(2, 0, 25, 5, ZZ);
fp(2, 0, 26, 6, ZZ);

sheepFront(2, 1, { oy: -1, eyesClosed: true });
fp(2, 1, 23, 7, ZZ); fp(2, 1, 24, 6, ZZ); fp(2, 1, 25, 7, ZZ);
fp(2, 1, 25, 4, ZZ); fp(2, 1, 26, 3, ZZ); fp(2, 1, 27, 4, ZZ);

// E (3,0) (3,1) — 向右走
sheepSide(3, 0, true, { legOff: 0, oy: -1 });
sheepSide(3, 1, true, { legOff: -1, oy: -1 });

// W (4,2) (4,3) — 向左走
sheepSide(4, 2, false, { legOff: 0, oy: -1 });
sheepSide(4, 3, false, { legOff: -1, oy: -1 });

// N (1,2) (1,3) — 向上走
sheepBack(1, 2, { legOff: 0, oy: -2 });
sheepBack(1, 3, { legOff: -1, oy: -2 });

// S (6,3) (7,2) — 向下走
sheepFront(6, 3, { legOff: 0, oy: -2 });
sheepFront(7, 2, { legOff: -1, oy: -2 });

// NE (0,2) (0,3)
sheepDiag(0, 2, 1, -1, { legOff: 0 });
sheepDiag(0, 3, 1, -1, { legOff: -1 });

// NW (1,0) (1,1)
sheepDiag(1, 0, -1, -1, { legOff: 0 });
sheepDiag(1, 1, -1, -1, { legOff: -1 });

// SE (5,1) (5,2)
sheepDiag(5, 1, 1, 1, { legOff: 0 });
sheepDiag(5, 2, 1, 1, { legOff: -1 });

// SW (5,3) (6,1)
sheepDiag(5, 3, -1, 1, { legOff: 0 });
sheepDiag(6, 1, -1, 1, { legOff: -1 });

// scratchWallN (0,0) (0,1) — 背面+抬蹄
sheepBack(0, 0, { oy: -2 });
fp(0, 0, 14, 8, LG); fp(0, 0, 15, 7, LG);
sheepBack(0, 1, { oy: -2 });
fp(0, 1, 17, 8, LG); fp(0, 1, 18, 7, LG);

// scratchWallS (7,1) (6,2) — 正面+抬蹄
sheepFront(7, 1, { oy: -2 });
fp(7, 1, 11, 24, LG); fp(7, 1, 12, 25, LG);
sheepFront(6, 2, { oy: -2 });
fp(6, 2, 20, 24, LG); fp(6, 2, 21, 25, LG);

// scratchWallE (2,2) (2,3) — 侧面朝右+前蹄抬起
sheepSide(2, 2, true, { oy: -1 });
fp(2, 2, 26, 12, LG); fp(2, 2, 27, 11, LG);
sheepSide(2, 3, true, { oy: -1 });
fp(2, 3, 26, 11, LG); fp(2, 3, 27, 12, LG);

// scratchWallW (4,0) (4,1) — 侧面朝左+前蹄抬起
sheepSide(4, 0, false, { oy: -1 });
fp(4, 0, 5, 12, LG); fp(4, 0, 4, 11, LG);
sheepSide(4, 1, false, { oy: -1 });
fp(4, 1, 5, 11, LG); fp(4, 1, 4, 12, LG);

// scratchSelf (5,0) (6,0) (7,0) — 正面+后脚挠身体
sheepFront(5, 0, { oy: -2 });
fp(5, 0, 22, 16, LG); fp(5, 0, 23, 15, LG); fp(5, 0, 23, 16, LG);
sheepFront(6, 0, { oy: -2 });
fp(6, 0, 22, 15, LG); fp(6, 0, 23, 14, LG); fp(6, 0, 23, 15, LG);
sheepFront(7, 0, { oy: -2 });
fp(7, 0, 22, 14, LG); fp(7, 0, 23, 13, LG); fp(7, 0, 23, 14, LG);

// ============================================================
// 输出
// ============================================================
const output = 'public/pets/oneko-sheep.png';

await sharp(buf, {
  raw: { width: WIDTH, height: HEIGHT, channels: 4 },
}).png().toFile(output);

console.log(`✅ 小绵羊精灵图已生成: ${output} (${WIDTH}×${HEIGHT})`);
