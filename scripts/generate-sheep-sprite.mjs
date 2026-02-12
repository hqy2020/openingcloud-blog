#!/usr/bin/env node
/**
 * 生成 oneko 格式的小绵羊像素精灵图 (256×128, 8列×4行, 每帧32×32)
 * 基于 Codex 设计方案：黑脸绵羊，大圆润白色蓬松身体，粉色耳朵
 *
 * 精灵图布局与 BlogPet.astro spriteSets 完全对应
 */

import sharp from 'sharp';

const COLS = 8, ROWS = 4, F = 32;
const W = COLS * F, H = ROWS * F;
const buf = Buffer.alloc(W * H * 4, 0);

// ─── 调色板 ───
const C = {
  wool_hi:    [0xFF, 0xFF, 0xFF, 0xFF],
  wool_mid:   [0xF4, 0xF6, 0xF8, 0xFF],
  wool_shade: [0xDD, 0xE3, 0xE8, 0xFF],
  wool_out:   [0xCC, 0xD5, 0xDD, 0xFF],
  face_dark:  [0x1F, 0x21, 0x26, 0xFF],
  face_deep:  [0x11, 0x13, 0x18, 0xFF],
  ear_pink:   [0xF6, 0xA8, 0xB7, 0xFF],
  ear_out:    [0xE0, 0x90, 0xA0, 0xFF],
  nose_gray:  [0x3A, 0x3D, 0x45, 0xFF],
  eye_white:  [0xFF, 0xFF, 0xFF, 0xFF],
  shadow:     [0xC9, 0xD1, 0xD9, 0x60],
  sleep_z:    [0xB9, 0xC8, 0xFF, 0xFF],
  tail:       [0xF0, 0xF3, 0xF6, 0xFF],
};

// ─── 基础绘图 ───
function px(x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = c[0]; buf[i+1] = c[1]; buf[i+2] = c[2]; buf[i+3] = c[3];
}

function rect(x, y, w, h, c) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      px(x + dx, y + dy, c);
}

function ellipse(cx, cy, rx, ry, c) {
  for (let dy = -ry; dy <= ry; dy++)
    for (let dx = -rx; dx <= rx; dx++)
      if ((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1)
        px(cx + dx, cy + dy, c);
}

function circle(cx, cy, r, c) { ellipse(cx, cy, r, r, c); }

// Outline only (for fluffy edge)
function ellipseOutline(cx, cy, rx, ry, c) {
  for (let dy = -ry; dy <= ry; dy++)
    for (let dx = -rx; dx <= rx; dx++) {
      const d = (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry);
      if (d <= 1 && d > 0.7) px(cx + dx, cy + dy, c);
    }
}

// ─── 绵羊部件绘图 ───

// 蓬松身体（带云朵状凸起）
function woolBody(ox, oy, cx, cy, rx, ry) {
  const ax = ox + cx, ay = oy + cy;

  // Ground shadow
  ellipse(ax, ay + ry + 1, rx - 2, 1, C.shadow);

  // Main body
  ellipse(ax, ay, rx, ry, C.wool_mid);

  // Fluffy bumps around the outline
  const bumpAngles = [0, 0.4, 0.8, 1.2, 1.8, 2.4, 2.8, 3.4, 3.8, 4.4, 5.0, 5.5];
  for (const a of bumpAngles) {
    const bx = Math.round(ax + Math.cos(a) * (rx + 0.5));
    const by = Math.round(ay + Math.sin(a) * (ry + 0.5));
    circle(bx, by, 2, C.wool_mid);
  }

  // Shade on bottom-right quadrant
  for (let dy = 1; dy <= ry; dy++)
    for (let dx = 1; dx <= rx; dx++) {
      const d = (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry);
      if (d <= 1 && d > 0.55) px(ax + dx, ay + dy, C.wool_shade);
    }

  // Outline for definition
  ellipseOutline(ax, ay, rx + 1, ry + 1, C.wool_out);

  // Highlight on top-left
  circle(ax - Math.round(rx * 0.3), ay - Math.round(ry * 0.4), 2, C.wool_hi);
  px(ax - Math.round(rx * 0.1), ay - Math.round(ry * 0.5), C.wool_hi);
}

// 黑脸 (direction: 'front', 'left', 'right', 'back', 'hidden')
function face(ox, oy, fx, fy, dir, eyeState) {
  const ax = ox + fx, ay = oy + fy;
  if (dir === 'back') {
    // Just show ears poking up, no face
    return;
  }

  // Face shape
  const fw = dir === 'front' ? 9 : 7;
  const fh = dir === 'front' ? 8 : 7;
  ellipse(ax, ay, Math.round(fw/2), Math.round(fh/2), C.face_dark);

  if (dir === 'front' || dir === 'left' || dir === 'right') {
    // Eyes
    if (eyeState === 'open') {
      if (dir === 'front') {
        px(ax - 2, ay - 1, C.eye_white);
        px(ax + 2, ay - 1, C.eye_white);
      } else if (dir === 'left') {
        px(ax - 1, ay - 1, C.eye_white);
      } else {
        px(ax + 1, ay - 1, C.eye_white);
      }
    } else if (eyeState === 'half') {
      // Half-closed: just a line
      if (dir === 'front') {
        px(ax - 2, ay - 1, C.nose_gray);
        px(ax + 2, ay - 1, C.nose_gray);
      }
    }
    // Nose
    px(ax, ay + 1, C.nose_gray);
  }
}

// 粉色耳朵
function ears(ox, oy, ex, ey, dir) {
  const ax = ox + ex, ay = oy + ey;
  if (dir === 'front') {
    // Two ears spread
    rect(ax - 5, ay, 2, 2, C.ear_out);
    px(ax - 4, ay + 1, C.ear_pink);
    rect(ax + 4, ay, 2, 2, C.ear_out);
    px(ax + 4, ay + 1, C.ear_pink);
  } else if (dir === 'left') {
    rect(ax - 2, ay - 1, 2, 2, C.ear_out);
    px(ax - 1, ay, C.ear_pink);
  } else if (dir === 'right') {
    rect(ax + 1, ay - 1, 2, 2, C.ear_out);
    px(ax + 1, ay, C.ear_pink);
  } else if (dir === 'back') {
    rect(ax - 4, ay, 2, 3, C.ear_out);
    px(ax - 3, ay + 1, C.ear_pink);
    rect(ax + 3, ay, 2, 3, C.ear_out);
    px(ax + 3, ay + 1, C.ear_pink);
  } else if (dir === 'alert') {
    // Tall upright ears
    rect(ax - 5, ay - 2, 2, 4, C.ear_out);
    px(ax - 4, ay - 1, C.ear_pink);
    px(ax - 4, ay, C.ear_pink);
    rect(ax + 4, ay - 2, 2, 4, C.ear_out);
    px(ax + 4, ay - 1, C.ear_pink);
    px(ax + 4, ay, C.ear_pink);
  }
}

// 腿 (4条短黑腿桩)
// legPhase: 0=standing, 1=walk1(front-left+back-right forward), 2=walk2(front-right+back-left forward)
function legs(ox, oy, lx, ly, dir, phase) {
  const ax = ox + lx, ay = oy + ly;
  const legW = 2, legH = 3;

  if (dir === 'front') {
    const spread = 4;
    const lift1 = phase === 1 ? -1 : 0;
    const lift2 = phase === 2 ? -1 : 0;
    rect(ax - spread - 1, ay + lift1, legW, legH - lift1, C.face_dark);
    rect(ax - 1, ay + lift2, legW, legH - lift2, C.face_dark);
    rect(ax + 1, ay + lift1, legW, legH - lift1, C.face_dark);
    rect(ax + spread, ay + lift2, legW, legH - lift2, C.face_dark);
  } else if (dir === 'side-left' || dir === 'side-right') {
    // Side view: 2 visible legs
    const shift = phase === 1 ? -2 : phase === 2 ? 2 : 0;
    const shift2 = phase === 1 ? 2 : phase === 2 ? -2 : 0;
    rect(ax - 2 + shift, ay, legW, legH, C.face_dark);
    rect(ax + 2 + shift2, ay, legW, legH, C.face_dark);
  } else if (dir === 'back') {
    const spread = 3;
    const lift1 = phase === 1 ? -1 : 0;
    const lift2 = phase === 2 ? -1 : 0;
    rect(ax - spread, ay + lift1, legW, legH - lift1, C.face_dark);
    rect(ax + spread - 1, ay + lift2, legW, legH - lift2, C.face_dark);
  } else if (dir === 'diag') {
    // Diagonal: 3 visible legs, one partially hidden
    const lift1 = phase === 1 ? -1 : 0;
    const lift2 = phase === 2 ? -1 : 0;
    rect(ax - 3, ay + lift1, legW, legH - lift1, C.face_dark);
    rect(ax, ay + lift2, legW, legH - lift2, C.face_dark);
    rect(ax + 3, ay + lift1, legW, legH - lift1, C.face_dark);
  }
}

// 小尾巴
function tail(ox, oy, tx, ty) {
  circle(ox + tx, oy + ty, 2, C.tail);
  px(ox + tx, oy + ty, C.wool_hi);
}

// 睡觉 zzZ
function sleepZ(ox, oy, x, y, size) {
  const ax = ox + x, ay = oy + y;
  if (size >= 1) {
    px(ax, ay, C.sleep_z);
    px(ax+1, ay-1, C.sleep_z);
    px(ax, ay-1, C.sleep_z);
  }
  if (size >= 2) {
    px(ax+3, ay-3, C.sleep_z);
    px(ax+4, ay-4, C.sleep_z);
    px(ax+5, ay-4, C.sleep_z);
    px(ax+3, ay-4, C.sleep_z);
  }
}

// ─── 完整绵羊组合函数 ───

function sheepSide(col, row, faceDir, phase) {
  const ox = col * F, oy = row * F;
  const isLeft = faceDir === 'left';

  woolBody(ox, oy, 16, 16, 11, 9);

  const fx = isLeft ? 8 : 23;
  face(ox, oy, fx, 14, isLeft ? 'left' : 'right', 'open');
  ears(ox, oy, fx, 9, isLeft ? 'left' : 'right');

  legs(ox, oy, 16, 24, 'side-' + (isLeft ? 'left' : 'right'), phase);

  if (isLeft) tail(ox, oy, 27, 16);
  else tail(ox, oy, 5, 16);
}

function sheepFront(col, row, phase) {
  const ox = col * F, oy = row * F;

  woolBody(ox, oy, 16, 15, 11, 9);
  face(ox, oy, 16, 17, 'front', 'open');
  ears(ox, oy, 16, 9, 'front');
  legs(ox, oy, 16, 23, 'front', phase);
}

function sheepBack(col, row, phase) {
  const ox = col * F, oy = row * F;

  woolBody(ox, oy, 16, 15, 11, 9);
  face(ox, oy, 16, 12, 'back', 'open');
  ears(ox, oy, 16, 8, 'back');
  legs(ox, oy, 16, 23, 'back', phase);
  tail(ox, oy, 16, 24);
}

function sheepDiag(col, row, dx, dy, phase) {
  const ox = col * F, oy = row * F;

  // Body shifts slightly in movement direction
  const bodyCx = 16 + dx * 1;
  const bodyCy = 15 + dy * 1;
  woolBody(ox, oy, bodyCx, bodyCy, 11, 9);

  // Face position based on direction
  const fx = 16 + dx * 6;
  const fy = 14 + dy * 3;
  const fDir = dx < 0 ? 'left' : dx > 0 ? 'right' : 'front';
  face(ox, oy, fx, fy, fDir, 'open');
  ears(ox, oy, fx, fy - 5, fDir);

  legs(ox, oy, bodyCx, 23, 'diag', phase);

  // Tail on opposite side of face
  if (dx !== 0) tail(ox, oy, 16 - dx * 10, bodyCy + 1);
}

function sheepIdle(col, row) {
  const ox = col * F, oy = row * F;

  woolBody(ox, oy, 16, 15, 12, 9);
  face(ox, oy, 16, 17, 'front', 'open');
  ears(ox, oy, 16, 9, 'front');
  legs(ox, oy, 16, 23, 'front', 0);
}

function sheepSleep(col, row, phase) {
  const ox = col * F, oy = row * F;

  // Curled up body - wider and lower
  const bx = phase === 1 ? 16 : 17;
  const by = phase === 1 ? 18 : 19;
  woolBody(ox, oy, bx, by, 12, 8);

  // Face tucked into body
  const fx = phase === 1 ? 14 : 15;
  face(ox, oy, fx, 20, 'front', 'closed');

  // Tiny legs barely visible
  rect(ox + 10, oy + 25, 2, 2, C.face_dark);
  rect(ox + 20, oy + 25, 2, 2, C.face_dark);

  // zzZ
  sleepZ(ox, oy, 24, phase === 1 ? 8 : 6, phase);
}

function sheepTired(col, row) {
  const ox = col * F, oy = row * F;

  // Body sinks 1px
  woolBody(ox, oy, 16, 16, 11, 9);
  face(ox, oy, 16, 18, 'front', 'half');
  // Droopy ears
  rect(ox + 9, oy + 12, 2, 2, C.ear_out);
  px(ox + 10, oy + 13, C.ear_pink);
  rect(ox + 21, oy + 12, 2, 2, C.ear_out);
  px(ox + 21, oy + 13, C.ear_pink);
  legs(ox, oy, 16, 24, 'front', 0);
}

function sheepAlert(col, row) {
  const ox = col * F, oy = row * F;

  // Body slightly raised
  woolBody(ox, oy, 16, 14, 11, 9);
  face(ox, oy, 16, 16, 'front', 'open');
  ears(ox, oy, 16, 7, 'alert');
  legs(ox, oy, 16, 22, 'front', 0);

  // Wide eyes (extra highlight)
  px(ox + 14, oy + 14, C.eye_white);
  px(ox + 13, oy + 14, C.eye_white);
  px(ox + 18, oy + 14, C.eye_white);
  px(ox + 19, oy + 14, C.eye_white);
}

function sheepScratchSelf(col, row, phase) {
  const ox = col * F, oy = row * F;

  // Body jitters based on phase
  const jx = phase === 1 ? -1 : 1;
  woolBody(ox, oy, 16 + jx, 15, 11, 9);
  face(ox, oy, 16 + jx, 17, 'front', 'open');
  ears(ox, oy, 16 + jx, 9, 'front');

  // One hind leg raised to scratch
  rect(ox + 10, oy + 23, 2, 3, C.face_dark);
  rect(ox + 20, oy + 23, 2, 3, C.face_dark);
  // Raised scratching leg
  rect(ox + 22 + jx, oy + 19, 2, 2, C.face_dark);
}

function sheepScratchWall(col, row, wallDir, phase) {
  const ox = col * F, oy = row * F;

  if (wallDir === 'N') {
    woolBody(ox, oy, 16, 17, 11, 8);
    face(ox, oy, 16, 12, 'back', 'open');
    ears(ox, oy, 16, 8, 'back');
    // Front legs reaching up
    const ly = phase === 1 ? 3 : 5;
    const ly2 = phase === 1 ? 5 : 3;
    rect(ox + 12, oy + ly, 2, 4, C.face_dark);
    rect(ox + 18, oy + ly2, 2, 4, C.face_dark);
    // Hind legs standing
    rect(ox + 12, oy + 24, 2, 3, C.face_dark);
    rect(ox + 18, oy + 24, 2, 3, C.face_dark);
  } else if (wallDir === 'S') {
    woolBody(ox, oy, 16, 14, 11, 8);
    face(ox, oy, 16, 17, 'front', 'open');
    ears(ox, oy, 16, 9, 'front');
    // Hind legs kicking toward bottom
    const ly = phase === 1 ? 26 : 24;
    const ly2 = phase === 1 ? 24 : 26;
    rect(ox + 11, oy + ly, 2, 31 - ly, C.face_dark);
    rect(ox + 19, oy + ly2, 2, 31 - ly2, C.face_dark);
    // Front legs standing
    rect(ox + 13, oy + 22, 2, 3, C.face_dark);
    rect(ox + 17, oy + 22, 2, 3, C.face_dark);
  } else if (wallDir === 'E') {
    woolBody(ox, oy, 14, 15, 10, 9);
    face(ox, oy, 22, 14, 'right', 'open');
    ears(ox, oy, 22, 9, 'right');
    // Front legs reaching right
    const lx = phase === 1 ? 27 : 25;
    const lx2 = phase === 1 ? 25 : 27;
    rect(ox + lx, oy + 14, 4, 2, C.face_dark);
    rect(ox + lx2, oy + 18, 4, 2, C.face_dark);
    rect(ox + 12, oy + 24, 2, 3, C.face_dark);
    rect(ox + 17, oy + 24, 2, 3, C.face_dark);
  } else if (wallDir === 'W') {
    woolBody(ox, oy, 18, 15, 10, 9);
    face(ox, oy, 9, 14, 'left', 'open');
    ears(ox, oy, 9, 9, 'left');
    // Front legs reaching left
    const lx = phase === 1 ? 1 : 3;
    const lx2 = phase === 1 ? 3 : 1;
    rect(ox + lx, oy + 14, 4, 2, C.face_dark);
    rect(ox + lx2, oy + 18, 4, 2, C.face_dark);
    rect(ox + 15, oy + 24, 2, 3, C.face_dark);
    rect(ox + 20, oy + 24, 2, 3, C.face_dark);
  }
}

// ─── 生成所有 32 帧 ───
// 布局严格对应 BlogPet.astro 中的 spriteSets

// Row 0
sheepScratchWall(0, 0, 'N', 1);  // [0,0] scratchWallN-1
sheepDiag(1, 0, -1, -1, 1);       // [1,0] NW walk1
sheepSleep(2, 0, 1);              // [2,0] sleep1
sheepSide(3, 0, 'right', 1);      // [3,0] E walk1
sheepScratchWall(4, 0, 'W', 1);  // [4,0] scratchWallW-1
sheepScratchSelf(5, 0, 1);        // [5,0] scratchSelf-1
sheepScratchSelf(6, 0, 2);        // [6,0] scratchSelf-2
sheepScratchSelf(7, 0, 1);        // [7,0] scratchSelf-3 (repeat variant)

// Row 1
sheepScratchWall(0, 1, 'N', 2);  // [0,1] scratchWallN-2
sheepDiag(1, 1, -1, -1, 2);       // [1,1] NW walk2
sheepSleep(2, 1, 2);              // [2,1] sleep2
sheepSide(3, 1, 'right', 2);      // [3,1] E walk2
sheepScratchWall(4, 1, 'W', 2);  // [4,1] scratchWallW-2
sheepDiag(5, 1, 1, 1, 1);         // [5,1] SE walk1
sheepDiag(6, 1, -1, 1, 2);        // [6,1] SW walk2
sheepScratchWall(7, 1, 'S', 1);  // [7,1] scratchWallS-1

// Row 2
sheepDiag(0, 2, 1, -1, 1);        // [0,2] NE walk1
sheepBack(1, 2, 1);                // [1,2] N walk1
sheepScratchWall(2, 2, 'E', 1);  // [2,2] scratchWallE-1
sheepTired(3, 2);                  // [3,2] tired
sheepSide(4, 2, 'left', 1);       // [4,2] W walk1
sheepDiag(5, 2, 1, 1, 2);         // [5,2] SE walk2
sheepScratchWall(6, 2, 'S', 2);  // [6,2] scratchWallS-2
sheepFront(7, 2, 2);              // [7,2] S walk2

// Row 3
sheepDiag(0, 3, 1, -1, 2);        // [0,3] NE walk2
sheepBack(1, 3, 2);                // [1,3] N walk2
sheepScratchWall(2, 3, 'E', 2);  // [2,3] scratchWallE-2
sheepIdle(3, 3);                   // [3,3] idle
sheepSide(4, 3, 'left', 2);       // [4,3] W walk2
sheepDiag(5, 3, -1, 1, 1);        // [5,3] SW walk1
sheepFront(6, 3, 1);              // [6,3] S walk1
sheepAlert(7, 3);                  // [7,3] alert

// ─── 输出 PNG ───
sharp(buf, { raw: { width: W, height: H, channels: 4 } })
  .png()
  .toFile('public/pets/oneko-sheep.png')
  .then(() => console.log('✅ oneko-sheep.png generated (256×128, 32 frames)'))
  .catch(err => console.error('❌', err));
