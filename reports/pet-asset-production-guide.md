# Pet V2 Asset Production Guide

This guide is for replacing placeholder assets with final art while keeping the current runtime behavior unchanged.

## 1. Scope
- Project: `/Users/openingcloud/IdeaProjects/openingcloud-blog`
- Runtime: `React + motion` (no new engine)
- Main component: `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/src/components/pet/BlogPetMachine.tsx`
- State machine: `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/src/components/pet/usePetStateMachine.ts`

## 2. Source Of Truth
- Rig and runtime constants: `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/src/components/pet/petRigConfig.ts`
- Machine-readable cut spec: `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/config/pet-cut-guide.json`
- Runtime-facing rig JSON (reference): `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/config/pet-rig.json`

## 3. File Replacement Rule
Replace files in place with the same filename and path. Do not rename.

### 3.1 Sheep parts
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_body.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_head.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_ear_l.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_ear_r.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_leg_fl.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_leg_fr.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_leg_bl.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_leg_br.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_tail.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_eye_open.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_eye_closed.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_mouth_open.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_mouth_closed.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_shadow.png`

### 3.2 Grass frames
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_sprout_1.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_sprout_2.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_grow_1.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_grow_2.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_full.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_eat_1.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_eat_2.png`

### 3.3 FX placeholders (optional to replace now)
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/fx/heart.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/fx/sparkle.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/fx/zzz.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/fx/sweat.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/fx/exclaim.png`
- `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/fx/bubble_tail.png`

## 4. Coordinate And Pivot Spec
Use `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/config/pet-cut-guide.json`.

Important fields:
- `rect`: crop rectangle on source (`x`,`y`,`w`,`h`) from `/media/pet/sheep-cutout.png` (205x220)
- `pivot`: local rotation origin for this part
- `default`: world placement inside logical rig canvas
- `zIndex`: rendering order

Example (head):
- rect: `x=14, y=36, w=72, h=72`
- pivot: `x=36, y=42`
- default: `x=14, y=36`

## 5. Art Production Checklist
1. Keep transparent background and sRGB.
2. Keep silhouette and volume continuity at seams.
3. For occluded regions, paint hidden area fully (legs/tail under body).
4. Keep open/closed eye and mouth pairs aligned to same default coordinates.
5. Keep same filename and avoid changing folder layout.
6. Recommended budget: each file < 120KB, pet package < 1.2MB.

## 6. Animation Quality Checklist
1. Idle: breathing does not break edge seams.
2. Walk: four legs alternate clearly, no popping.
3. Eat: mouth swap and head nod feel synchronized.
4. Sleep: closed eye reads clearly at small scale.
5. Drag: limbs and ears readable on desktop pointer drag.

## 7. Quick Verify Commands
Run after replacing assets:

```bash
cd /Users/openingcloud/IdeaProjects/openingcloud-blog/frontend
npm run build
```

Optional dimension spot-check:

```bash
sips -g pixelWidth -g pixelHeight \
  /Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_head.png \
  /Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/parts/sheep_leg_fl.png \
  /Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/public/media/pet/grass/grass_sprout_1.png
```

## 8. Runtime Mapping
- Behavior and state transitions are implemented in `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/src/components/pet/usePetStateMachine.ts`.
- Visual clips and part motion are implemented in `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/src/components/pet/BlogPetMachine.tsx`.
- Bubble and emotion effects are in `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/src/components/pet/PetEffects.tsx`.

If art style changes significantly (shape proportions), update these constants in `/Users/openingcloud/IdeaProjects/openingcloud-blog/frontend/src/components/pet/petRigConfig.ts`:
- `PET_WORLD.rigScale`
- per-part `defaultX/defaultY`
- per-part `pivotX/pivotY`
