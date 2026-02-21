import type { GrassPatch, GrassStage } from "./petRigConfig";

export class GrassManager {
  private readonly maxGrass: number;
  private readonly clickThrottleMs: number;
  private grassPatches: GrassPatch[] = [];
  private lastClickTs = 0;

  constructor(maxGrass = 10, clickThrottleMs = 200) {
    this.maxGrass = maxGrass;
    this.clickThrottleMs = clickThrottleMs;
  }

  get patches() {
    return this.grassPatches;
  }

  canPlant(now = Date.now()) {
    return now - this.lastClickTs >= this.clickThrottleMs;
  }

  plant(x: number, y: number, now = Date.now()) {
    if (!this.canPlant(now)) {
      return null;
    }

    this.lastClickTs = now;
    const patch: GrassPatch = {
      id: `${now}-${Math.random().toString(16).slice(2, 8)}`,
      x,
      y,
      createdAt: now,
      stage: "sprout",
      claimedBy: null,
    };

    this.grassPatches.push(patch);
    if (this.grassPatches.length > this.maxGrass) {
      this.grassPatches.shift();
    }

    return patch;
  }

  findById(id: string) {
    return this.grassPatches.find((patch) => patch.id === id) ?? null;
  }

  findNearestAvailable(x: number, y: number, excludedId: string | null = null) {
    let nearest: GrassPatch | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const patch of this.grassPatches) {
      if (excludedId && patch.id === excludedId) {
        continue;
      }
      if (patch.stage === "vanishing") {
        continue;
      }
      if (patch.claimedBy) {
        continue;
      }

      const distance = Math.hypot(patch.x - x, patch.y - y);
      if (!nearest || distance < nearestDistance) {
        nearest = patch;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  markStage(id: string, stage: GrassStage) {
    const patch = this.findById(id);
    if (!patch) {
      return null;
    }
    patch.stage = stage;
    return patch;
  }

  claim(id: string, actor: "sheep" = "sheep") {
    const patch = this.findById(id);
    if (!patch) {
      return null;
    }
    patch.claimedBy = actor;
    return patch;
  }

  release(id: string) {
    const patch = this.findById(id);
    if (!patch) {
      return null;
    }
    patch.claimedBy = null;
    return patch;
  }

  removeById(id: string) {
    const index = this.grassPatches.findIndex((patch) => patch.id === id);
    if (index < 0) {
      return null;
    }
    return this.grassPatches.splice(index, 1)[0] ?? null;
  }
}
