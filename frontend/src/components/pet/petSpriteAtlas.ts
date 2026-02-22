export type PetAnim = "idle" | "run" | "eat" | "sleep";
export type PetFacing = "left" | "right";

export type SpriteClip = {
  row: number;
  frames: number[];
  fps: number;
};

export type SpriteClipKey = `${PetAnim}_${PetFacing}`;

export type PetSpriteAtlas = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  scale: number;
  clips: Record<SpriteClipKey, SpriteClip>;
};

const LOOP_FRAMES = [0, 1, 2, 3];

export const PET_SHEEP_TOPDOWN_ATLAS: PetSpriteAtlas = {
  src: "/media/pet/sheep-topdown-sprite.png",
  frameWidth: 32,
  frameHeight: 32,
  columns: 6,
  rows: 8,
  scale: 2,
  clips: {
    idle_left: { row: 4, frames: LOOP_FRAMES, fps: 6 },
    idle_right: { row: 5, frames: LOOP_FRAMES, fps: 6 },
    run_left: { row: 6, frames: LOOP_FRAMES, fps: 12 },
    run_right: { row: 7, frames: LOOP_FRAMES, fps: 12 },
    eat_left: { row: 4, frames: LOOP_FRAMES, fps: 8 },
    eat_right: { row: 5, frames: LOOP_FRAMES, fps: 8 },
    sleep_left: { row: 4, frames: LOOP_FRAMES, fps: 2 },
    sleep_right: { row: 5, frames: LOOP_FRAMES, fps: 2 },
  },
};
