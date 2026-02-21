export type PetState =
  | "idle"
  | "hover_watch"
  | "walking_to_grass"
  | "eating"
  | "happy"
  | "sleeping"
  | "waking"
  | "dragging"
  | "returning_home";

export type PetMood = "neutral" | "hungry" | "excited" | "sleepy";
export type PetFacing = "left" | "right";
export type GrassStage = "sprout" | "grown" | "being_eaten" | "vanishing";

export type PetPosition = {
  x: number;
  y: number;
};

export type PetPartId =
  | "sheep_shadow"
  | "sheep_body"
  | "sheep_head"
  | "sheep_ear_l"
  | "sheep_ear_r"
  | "sheep_leg_fl"
  | "sheep_leg_fr"
  | "sheep_leg_bl"
  | "sheep_leg_br"
  | "sheep_tail"
  | "sheep_eye_open"
  | "sheep_eye_closed"
  | "sheep_mouth_open"
  | "sheep_mouth_closed";

export interface GrassPatch {
  id: string;
  x: number;
  y: number;
  createdAt: number;
  stage: GrassStage;
  claimedBy: "sheep" | null;
}

export interface PetPartConfig {
  id: PetPartId;
  src: string;
  pivotX: number;
  pivotY: number;
  defaultX: number;
  defaultY: number;
  zIndex: number;
}

export const PET_SOURCES = {
  cloudHome: "/media/pet/clouds-home-clean.png",
  legacySheep: "/media/pet/sheep-cutout.png",
  grass: {
    sproutA: "/media/pet/grass/grass_sprout_1.png",
    sproutB: "/media/pet/grass/grass_sprout_2.png",
    growA: "/media/pet/grass/grass_grow_1.png",
    growB: "/media/pet/grass/grass_grow_2.png",
    full: "/media/pet/grass/grass_full.png",
    eatA: "/media/pet/grass/grass_eat_1.png",
    eatB: "/media/pet/grass/grass_eat_2.png",
  },
};

export const PET_CHAT_LINES = [
  "咩咩，我在云上等你喂草呀～",
  "今天也要一起把博客养肥一点吗？",
  "轻点一下地面，我就开吃啦！",
  "我先在云上巡逻，等你的草信号。",
  "咩～别让我饿太久，我会想你。",
];

export const PET_EAT_LINES = ["真香~", "好吃！", "谢谢款待~", "再来一棵！"];
export const PET_GUIDE_LINE = "点击空白处可以种草哦～";

export const PET_CLIP_DURATION = {
  idleBreathe: 2.4,
  idleBlinkMs: 120,
  idleEarTwitch: 0.4,
  walkCycle: 0.55,
  eatCycle: 0.42,
  happyHop: 0.9,
  sleepEnterMs: 700,
  sleepLoop: 2.8,
  wakeUpMs: 600,
  dragStruggle: 0.36,
};

export const PET_WORLD = {
  cloudHomeWidth: 168,
  cloudHomeHeight: 168,
  cloudHomeRight: 14,
  cloudHomeBottom: 10,
  cloudHomeAnchorX: 74,
  cloudHomeAnchorY: 72,
  mouthOffsetXLeft: 8,
  mouthOffsetXRight: 44,
  mouthOffsetY: 24,
  renderWidth: 56,
  renderHeight: 60,
  rigLogicalWidth: 205,
  rigLogicalHeight: 220,
  rigScale: 0.255,
};

export const PET_PARTS: PetPartConfig[] = [
  {
    id: "sheep_shadow",
    src: "/media/pet/parts/sheep_shadow.png",
    pivotX: 59,
    pivotY: 15,
    defaultX: 42,
    defaultY: 182,
    zIndex: 1,
  },
  {
    id: "sheep_leg_bl",
    src: "/media/pet/parts/sheep_leg_bl.png",
    pivotX: 16,
    pivotY: 8,
    defaultX: 118,
    defaultY: 124,
    zIndex: 12,
  },
  {
    id: "sheep_leg_br",
    src: "/media/pet/parts/sheep_leg_br.png",
    pivotX: 16,
    pivotY: 8,
    defaultX: 150,
    defaultY: 122,
    zIndex: 13,
  },
  {
    id: "sheep_tail",
    src: "/media/pet/parts/sheep_tail.png",
    pivotX: 6,
    pivotY: 14,
    defaultX: 150,
    defaultY: 72,
    zIndex: 15,
  },
  {
    id: "sheep_body",
    src: "/media/pet/parts/sheep_body.png",
    pivotX: 56,
    pivotY: 52,
    defaultX: 44,
    defaultY: 86,
    zIndex: 20,
  },
  {
    id: "sheep_leg_fl",
    src: "/media/pet/parts/sheep_leg_fl.png",
    pivotX: 16,
    pivotY: 8,
    defaultX: 36,
    defaultY: 124,
    zIndex: 28,
  },
  {
    id: "sheep_leg_fr",
    src: "/media/pet/parts/sheep_leg_fr.png",
    pivotX: 16,
    pivotY: 8,
    defaultX: 78,
    defaultY: 120,
    zIndex: 29,
  },
  {
    id: "sheep_head",
    src: "/media/pet/parts/sheep_head.png",
    pivotX: 36,
    pivotY: 42,
    defaultX: 14,
    defaultY: 36,
    zIndex: 30,
  },
  {
    id: "sheep_ear_l",
    src: "/media/pet/parts/sheep_ear_l.png",
    pivotX: 4,
    pivotY: 10,
    defaultX: 6,
    defaultY: 18,
    zIndex: 32,
  },
  {
    id: "sheep_ear_r",
    src: "/media/pet/parts/sheep_ear_r.png",
    pivotX: 20,
    pivotY: 10,
    defaultX: 58,
    defaultY: 18,
    zIndex: 33,
  },
  {
    id: "sheep_eye_open",
    src: "/media/pet/parts/sheep_eye_open.png",
    pivotX: 8,
    pivotY: 5,
    defaultX: 45,
    defaultY: 60,
    zIndex: 34,
  },
  {
    id: "sheep_eye_closed",
    src: "/media/pet/parts/sheep_eye_closed.png",
    pivotX: 8,
    pivotY: 5,
    defaultX: 45,
    defaultY: 60,
    zIndex: 34,
  },
  {
    id: "sheep_mouth_open",
    src: "/media/pet/parts/sheep_mouth_open.png",
    pivotX: 9,
    pivotY: 5,
    defaultX: 40,
    defaultY: 82,
    zIndex: 35,
  },
  {
    id: "sheep_mouth_closed",
    src: "/media/pet/parts/sheep_mouth_closed.png",
    pivotX: 9,
    pivotY: 5,
    defaultX: 40,
    defaultY: 82,
    zIndex: 35,
  },
];

export function isNearPosition(from: PetPosition, to: PetPosition, threshold: number) {
  return Math.hypot(from.x - to.x, from.y - to.y) <= threshold;
}

export function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
