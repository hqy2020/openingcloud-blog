export type GrassPatch = {
  id: string;
  x: number;
  y: number;
  createdAt: number;
};

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
      id: `${now}-${Math.random().toString(16).slice(2, 6)}`,
      x,
      y,
      createdAt: now,
    };

    this.grassPatches.push(patch);
    if (this.grassPatches.length > this.maxGrass) {
      this.grassPatches.shift();
    }

    return patch;
  }

  consumeNearest(x: number, y: number) {
    if (this.grassPatches.length === 0) {
      return null;
    }

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.grassPatches.forEach((patch, index) => {
      const distance = Math.hypot(patch.x - x, patch.y - y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return this.grassPatches.splice(nearestIndex, 1)[0] ?? null;
  }

  findById(id: string) {
    return this.grassPatches.find((patch) => patch.id === id) ?? null;
  }

  removeById(id: string) {
    const index = this.grassPatches.findIndex((patch) => patch.id === id);
    if (index < 0) {
      return null;
    }
    return this.grassPatches.splice(index, 1)[0] ?? null;
  }
}
