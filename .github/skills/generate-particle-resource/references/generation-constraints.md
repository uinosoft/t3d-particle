# Generation Constraints (Machine-Oriented)

This file contains strict output constraints for generated particle resources.

## Root Constraints

- `version` must be `"0.0.2"`.
- `groups` must be an array with at least one item.

## Group Constraints

Required keys:

- `mode`
- `perspective`
- `meshUri`
- `textureUri`
- `textureFrame`
- `textureFrameLoop`
- `colorize`
- `transparent`
- `blending`
- `alphaTest`
- `depthWrite`
- `depthTest`
- `side`
- `fog`
- `emitters`

Rules:

- `mode` in `{0, 1}`.
- `meshUri` matches `BuildIn/Box|BuildIn/Plane|BuildIn/Sphere`.
- `textureUri` is `string | null`.
- `textureFrame` length is 2 and each value >= 1.
- `textureFrameLoop` >= 1.
- `blending` in `{none, normal, add, sub, mul}`.
- `alphaTest` in `[0, 1]`.
- `side` in `{front, back, double}`.
- `emitters` length >= 1.

## Emitter Constraints

Required keys:

- `particleCount`
- `isStatic`
- `direction`
- `activeMultiplier`
- `meshAlignment`
- `maxAge`
- `position`
- `velocity`
- `acceleration`
- `drag`
- `wiggle`
- `rotation`
- `color`
- `opacity`
- `size`
- `angle`

Rules:

- `particleCount` is integer and >= 0.
- `direction` in `{1, -1}`.
- `activeMultiplier` >= 0.
- `meshAlignment` in `{0, 1, 2}`.

## Distribution Rules

For `position/velocity/acceleration.distribution`:

- Must be one of `{1, 2, 3, 4}`.
- Mapping: `1=BOX`, `2=SPHERE`, `3=DISC`, `4=LINE`.

## Lifecycle Arrays

- `color/opacity/size/angle` must use object form: `{ elements, randomise }`.
- `elements` length must be between 1 and 4.
- `color.elements[*].value` and `spread` are vec3.
- `opacity/size/angle.elements[*].value` and `spread` are numbers.

## Validation Command

Validate generated file (single file):

```bash
node scripts/validate-particle-schema.mjs <path-to-json>
```

Validate all example assets:

```bash
node scripts/validate-particle-schema.mjs
```
