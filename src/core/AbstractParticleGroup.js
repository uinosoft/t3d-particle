import * as t3d from 't3d';
import { Utils } from './Utils.js';

/**
 * A map of options to configure an ParticleGroup instance.
 * @typedef {Object} GroupOptions
 *
 * @property {Object} texture An object describing the texture used by the group.
 *
 * @property {Object} texture.value An instance of t3d.Texture.
 *
 * @property {Object=} texture.frames A t3d.Vector2 instance describing the number
 *                                    of frames on the x- and y-axis of the given texture.
 *                                    If not provided, the texture will NOT be treated as
 *                                    a sprite-sheet and as such will NOT be animated.
 *
 * @property {Number} [texture.frameCount=texture.frames.x * texture.frames.y] The total number of frames in the sprite-sheet.
 *                                                                   Allows for sprite-sheets that don't fill the entire
 *                                                                   texture.
 *
 * @property {Number} texture.loop The number of loops through the sprite-sheet that should
 *                                 be performed over the course of a single particle's lifetime.
 *
 * @property {Number} fixedTimeStep If no `dt` (or `deltaTime`) value is passed to this group's
 *                                  `tick()` function, this number will be used to move the particle
 *                                  simulation forward. Value in SECONDS.
 *
 * @property {Boolean} hasPerspective Whether the distance a particle is from the camera should affect
 *                                    the particle's size.
 *
 * @property {Boolean} colorize Whether the particles in this group should be rendered with color, or
 *                              whether the only color of particles will come from the provided texture.
 *
 * @property {Number} blending One of t3d.js's blending modes to apply to this group's `ShaderMaterial`.
 *
 * @property {Boolean} transparent Whether these particle's should be rendered with transparency.
 *
 * @property {Number} alphaTest Sets the alpha value to be used when running an alpha test on the `texture.value` property. Value between 0 and 1.
 *
 * @property {Boolean} depthWrite Whether rendering the group has any effect on the depth buffer.
 *
 * @property {Boolean} depthTest Whether to have depth test enabled when rendering this group.
 *
 * @property {Boolean} fog Whether this group's particles should be affected by their scene's fog.
 *
 * @property {Number} scale The scale factor to apply to this group's particle sizes. Useful for
 *                          setting particle sizes to be relative to renderer size.
 */

export class AbstractParticleGroup {

	constructor(options, shader) {
		this.uuid = t3d.generateUUID();

		const types = Utils.types;

		options.texture = Utils.ensureTypedArg(options.texture, types.OBJECT, {});

		// If no `deltaTime` value is passed to the `ParticleGroup.tick` function,
		// the value of this property will be used to advance the simulation.
		this.fixedTimeStep = Utils.ensureTypedArg(options.fixedTimeStep, types.NUMBER, 0.016);

		this.hasPerspective = Utils.ensureTypedArg(options.hasPerspective, types.BOOLEAN, true);

		this.colorize = Utils.ensureTypedArg(options.colorize, types.BOOLEAN, true);

		// Set material
		this.material = new t3d.ShaderMaterial(shader);
		this.uniforms = this.material.uniforms;
		this.defines = this.material.defines;
		this._setMaterial(options);

		// Where emitter's go to curl up in a warm blanket and live
		// out their days.
		this._emitters = [];
	}

	addEmitter(emitter) {}

	removeEmitter(emitter) {}

	tick(dt) {}

	dispose() {}

	_setMaterial(options) {
		const types = Utils.types;

		const material = this.material;
		const uniforms = this.uniforms;

		uniforms.tex = Utils.ensureInstanceOf(options.texture.value, t3d.Texture2D, defaultTexture);

		material.blending = Utils.ensureTypedArg(options.blending, types.STRING, t3d.BLEND_TYPE.ADD);
		material.transparent = Utils.ensureTypedArg(options.transparent, types.BOOLEAN, true);
		material.alphaTest = Utils.ensureTypedArg(options.alphaTest, types.NUMBER, 0.0);
		material.depthWrite = Utils.ensureTypedArg(options.depthWrite, types.BOOLEAN, false);
		material.depthTest = Utils.ensureTypedArg(options.depthTest, types.BOOLEAN, true);
		material.fog = Utils.ensureTypedArg(options.fog, types.BOOLEAN, true);
	}

}

const defaultTexture = new t3d.Texture2D();
defaultTexture.image = {
	data: new Uint8Array([
		255, 255, 255, 255,
		255, 255, 255, 255,
		255, 255, 255, 255,
		255, 255, 255, 255
	]),
	width: 2,
	height: 2
};
defaultTexture.magFilter = t3d.TEXTURE_FILTER.NEAREST;
defaultTexture.minFilter = t3d.TEXTURE_FILTER.NEAREST;
defaultTexture.generateMipmaps = false;