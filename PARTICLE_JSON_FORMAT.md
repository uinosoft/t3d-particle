# t3d-particle Particle JSON Resource Format

This document is compiled from the implementation and examples below:

- Loader parsing logic: `src/ParticleLoader.js`
- Editor data template: `editor/js/ParticleData.js`
- Editor UI options: `editor/js/ParticleGUI.js`
- Resource examples: `examples/resources/particles/*.json`

Purpose:

1. Provide developers with clear field meanings and valid values.
2. Provide a stable, schema-valid structure for automatic resource generation skills.

## 1. Overall Structure

```json
{
  "version": "0.0.2",
  "groups": [
    {
      "...group fields...": "...",
      "emitters": [
        {
          "...emitter fields...": "..."
        }
      ]
    }
  ]
}
```

- `version`: currently use "0.0.2".
- `groups`: array of particle groups. Each group corresponds to a ParticleGroup or MeshParticleGroup.

Compatibility notes:

- The editor import supports converting `0.0.1` to `0.0.2` (mainly `color/opacity/size/angle` moved from arrays to `{ elements, randomise }`).
- New generated resources should target `0.0.2`.

## 2. Group Fields

Each `groups[i]` contains the following fields.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `mode` | number | yes | `0` | Particle mode. `0=Billboard`, `1=Mesh`. |
| `perspective` | boolean | yes | `true` | Effective only when `mode=0`. Whether particle size scales with camera distance. |
| `meshUri` | string | yes | `"BuildIn/Box"` | Used when `mode=1`. Loader supports built-in meshes: `BuildIn/Box`, `BuildIn/Plane`, `BuildIn/Sphere`. |
| `textureUri` | string/null | yes | `null` | Texture path. `null` uses a default white 2x2 texture. |
| `textureFrame` | number[2] | yes | `[1,1]` | Texture atlas frames `[h, v]`. |
| `textureFrameLoop` | number | yes | `1` | Number of frame loops per particle lifetime. |
| `colorize` | boolean | yes | `true` | Whether to multiply texture by particle color. |
| `transparent` | boolean | yes | `true` | Material transparency. |
| `blending` | string | yes | `"add"` | Blending mode: `none / normal / add / sub / mul`. |
| `alphaTest` | number | yes | `0` | Alpha test threshold `[0,1]`. |
| `depthWrite` | boolean | yes | `false` | Whether to write to depth. |
| `depthTest` | boolean | yes | `true` | Whether to enable depth test. |
| `side` | string | yes | `"front"` | Face culling: `front / back / double`. |
| `fog` | boolean | yes | `true` | Whether affected by scene fog. |
| `emitters` | array | yes | at least 1 | Array of emitters. |

### 2.1 Group behavior notes

- For `mode=0` (Billboard):
  - `perspective` applies.
  - `meshUri` is ignored.
- For `mode=1` (Mesh):
  - `meshUri` applies.
  - `perspective` does not apply.
- If `meshUri` is not prefixed with `BuildIn/`, the loader will warn and fall back to a built-in plane.

## 3. Emitter Fields

Each `emitters[j]` contains the following fields.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `particleCount` | number | yes | `200` | Maximum particles the emitter holds (not per-second spawn). |
| `isStatic` | boolean | yes | `false` | Whether emitter is static (no simulation). |
| `direction` | number | yes | `1` | Lifecycle direction: `1=forward`, `-1=reverse`. |
| `activeMultiplier` | number | yes | `1` | Emission intensity multiplier. `1` normal, `0` no emission, `>1` bursts. |
| `meshAlignment` | number | yes | `0` | Mesh alignment mode (Mesh only): `0=None`, `1=FaceCamera`, `2=FaceCameraY`. |
| `maxAge` | object | yes | `{value:2,spread:0}` | Particle lifetime in seconds. |
| `position` | object | yes | see below | Initial position distribution. |
| `velocity` | object | yes | see below | Initial velocity distribution. |
| `acceleration` | object | yes | see below | Acceleration distribution. |
| `drag` | object | yes | `{value:0,spread:0,randomise:false}` | Drag. |
| `wiggle` | object | yes | `{value:0,spread:0}` | Wiggle magnitude. |
| `rotation` | object | yes | see below | Emitter rotation params. |
| `color` | object | yes | see below | Color over lifetime. |
| `opacity` | object | yes | see below | Opacity over lifetime. |
| `size` | object | yes | see below | Size over lifetime. |
| `angle` | object | yes | see below | Texture rotation angle over lifetime (radians). |

## 4. Compound Field Definitions

### 4.1 Simple vector distributions (`position` / `velocity` / `acceleration`)

#### `position`

```json
{
  "value": [0, 0, 0],
  "spread": [0, 0, 0],
  "distribution": 1,
  "randomise": false,
  "spreadClamp": [0, 0, 0],
  "radius": 2,
  "radiusScale": [1, 1, 1]
}
```

#### `velocity` / `acceleration`

```json
{
  "value": [0, 0, 0],
  "spread": [0, 0, 0],
  "distribution": 1,
  "randomise": false
}
```

- `value`: base 3D vector.
- `spread`: random spread vector.
- `distribution`: sampling distribution (see enum).
- `randomise`: whether to re-randomize on respawn.
- `spreadClamp` (position only): clamp step for random results.
- `radius` (position only): radius for sphere/disc distributions.
- `radiusScale` (position only): per-axis radius scale.

### 4.2 Scalar helpers

#### `maxAge`

```json
{ "value": 2, "spread": 0 }
```

#### `drag`

```json
{ "value": 0, "spread": 0, "randomise": false }
```

#### `wiggle`

```json
{ "value": 0, "spread": 0 }
```

### 4.3 `rotation`

```json
{
  "axis": [0, 0, 0],
  "axisSpread": [0, 0, 0],
  "angle": 0,
  "angleSpread": 0,
  "isStatic": false,
  "center": [0, 0, 0],
  "randomise": false
}
```

- `axis`: rotation axis.
- `axisSpread`: random variation of axis.
- `angle`: rotation angle (radians).
- `angleSpread`: random variation of angle.
- `isStatic`: whether rotation is static.
- `center`: rotation center.
- `randomise`: re-randomize on respawn.

### 4.4 Lifecycle array fields (`color` / `opacity` / `size` / `angle`)

Unified structure:

```json
{
  "elements": [
    { "value": 1, "spread": 0 }
  ],
  "randomise": false
}
```

Where:

- `color.elements[k]`:
  - `value`: `[r,g,b]` (recommended range `[0,1]`).
  - `spread`: `[r,g,b]`.
- `opacity/size/angle.elements[k]`:
  - `value`: number.
  - `spread`: number.
- `elements` length is recommended between 1 and 4 (editor UI follows this range).
- `randomise`: whether to re-randomize element values on respawn.

## 5. Enums and Valid Values

### 5.1 Distribution types (`distribution`)

- `1`: BOX
- `2`: SPHERE
- `3`: DISC
- `4`: LINE

### 5.2 Group mode (`mode`)

- `0`: Billboard
- `1`: Mesh

### 5.3 Mesh alignment (`meshAlignment`)

- `0`: None
- `1`: FaceCamera
- `2`: FaceCameraY

### 5.4 Material enums

- `blending`: `none / normal / add / sub / mul`
- `side`: `front / back / double`

## 6. Minimal usable example (Billboard)

This minimal structure can be parsed by the current Loader (keeps all required fields):

```json
{
  "version": "0.0.2",
  "groups": [
    {
      "mode": 0,
      "perspective": true,
      "meshUri": "BuildIn/Box",
      "textureUri": null,
      "textureFrame": [1, 1],
      "textureFrameLoop": 1,
      "colorize": true,
      "transparent": true,
      "blending": "add",
      "alphaTest": 0,
      "depthWrite": false,
      "depthTest": true,
      "side": "front",
      "fog": true,
      "emitters": [
        {
          "particleCount": 200,
          "isStatic": false,
          "direction": 1,
          "activeMultiplier": 1,
          "meshAlignment": 0,
          "maxAge": { "value": 2, "spread": 0 },
          "position": {
            "value": [0, 0, 0],
            "spread": [0, 0, 0],
            "distribution": 1,
            "randomise": false,
            "spreadClamp": [0, 0, 0],
            "radius": 2,
            "radiusScale": [1, 1, 1]
          },
          "velocity": {
            "value": [0, 0, 0],
            "spread": [0, 0, 0],
            "distribution": 1,
            "randomise": false
          },
          "acceleration": {
            "value": [0, 0, 0],
            "spread": [0, 0, 0],
            "distribution": 1,
            "randomise": false
          },
          "drag": { "value": 0, "spread": 0, "randomise": false },
          "wiggle": { "value": 0, "spread": 0 },
          "rotation": {
            "axis": [0, 0, 0],
            "axisSpread": [0, 0, 0],
            "angle": 0,
            "angleSpread": 0,
            "isStatic": false,
            "center": [0, 0, 0],
            "randomise": false
          },
          "color": {
            "elements": [
              { "value": [1, 1, 1], "spread": [0, 0, 0] }
            ],
            "randomise": false
          },
          "opacity": {
            "elements": [
              { "value": 1, "spread": 0 }
            ],
            "randomise": false
          },
          "size": {
            "elements": [
              { "value": 1, "spread": 0 }
            ],
            "randomise": false
          },
          "angle": {
            "elements": [
              { "value": 0, "spread": 0 }
            ],
            "randomise": false
          }
        }
      ]
    }
  ]
}
```

## 7. Implementation notes

1. The current `ParticleLoader.parseParticleGroup(groupJson, maxParticleCount = 2000)` uses a fixed `2000` in its default call path and will not automatically sum emitter `particleCount` values.
2. `ParticleLoader` is not very tolerant of missing fields (for example, missing `position` will cause conversion errors), so auto-generated JSON must fully populate required fields.
3. For mesh mode, if `meshUri` is not a built-in value, the loader will warn and fall back to a built-in geometry.

## 8. JSON Schema and example validation

- Schema file: `schemas/particle.schema.json`
- Zero-dependency validator: `scripts/validate-particle-schema.mjs`

Validation command:

```bash
node scripts/validate-particle-schema.mjs
```

Current repository examples (`examples/resources/particles/*.json`) validation status: 9/9 pass.

## 9. Auto-generation Skill

Auto-generation constraints and workflow have been migrated to the skill:

- `./.github/skills/generate-particle-resource/SKILL.md`

This skill generates schema-compliant particle resources that can be directly loaded by `ParticleLoader`.
