---
name: generate-particle-resource
description: 'Generate t3d-particle resource JSON files for ParticleLoader. Use when user asks to create particle effect JSON, auto-generate emitter/group configs, or ensure particle JSON passes schema validation.'
argument-hint: 'effect goal, style, and target output path (optional)'
user-invocable: true
---

# Generate Particle Resource

Generate a complete particle resource JSON (`version: 0.0.2`) that can:

1. pass project schema validation, and
2. be loaded by `ParticleLoader`.

## Use When

- User asks to create a new particle effect JSON.
- User gives effect intent (fire, smoke, fountain, sparks) and wants ready-to-load data.
- User asks to ensure generated JSON is schema-valid and loader-compatible.

## Inputs You Should Confirm

- Effect intent: visual style and behavior over lifetime.
- Mode: billboard (`mode: 0`) or mesh (`mode: 1`).
- Texture: `textureUri` or `null`.
- Output path: default to `examples/resources/particles/<name>.json` if not specified.

## Procedure

1. Read developer format doc: [PARTICLE_JSON_FORMAT.md](../../../../PARTICLE_JSON_FORMAT.md).
2. Read generation constraints: [Generation Constraints](./references/generation-constraints.md).
3. Start from template: [particle-template.json](./assets/particle-template.json).
4. Fill all required fields. Do not omit required keys.
5. Save JSON file to requested path.
6. Validate with:
   - `node scripts/validate-particle-schema.mjs <target-json-path>`
7. If validation fails, fix and re-run until pass.
8. Report final output file path and validation result.

## Required Guarantees

- JSON must conform to `schemas/particle.schema.json`.
- JSON must keep `version` as `"0.0.2"`.
- Result must be directly consumable by `ParticleLoader`.

## Notes

- Keep values physically plausible (e.g., non-negative counts, sane lifetime).
- Prefer minimal but complete configs when user asks for a starter asset.
- For advanced effects, vary `color/opacity/size/angle.elements` across lifetime.
