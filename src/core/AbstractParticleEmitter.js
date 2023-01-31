import * as t3d from "t3d";
import { ParticleProperties } from "../ParticleProperties.js";
import { Utils } from "./Utils.js";

/**
 * A map of options to configure an Emitter instance.
 *
 * @typedef {Object} EmitterOptions
 *
 * @property {distribution} [type=BOX] The default distribution this emitter should use to control
 *                         its particle's spawn position and force behaviour.
 *                         Must be an ParticleProperties.distributions.* value.
 *
 *
 * @property {Number} [particleCount=100] The total number of particles this emitter will hold. NOTE: this is not the number
 *                                  of particles emitted in a second, or anything like that. The number of particles
 *                                  emitted per-second is calculated by particleCount / maxAge (approximately!)
 *
 * @property {Number|null} [duration=null] The duration in seconds that this emitter should live for. If not specified, the emitter
 *                                         will emit particles indefinitely.
 *                                         NOTE: When an emitter is older than a specified duration, the emitter is NOT removed from
 *                                         it's group, but rather is just marked as dead, allowing it to be reanimated at a later time
 *                                         using `Emitter.prototype.enable()`.
 *
 * @property {Boolean} [isStatic=false] Whether this emitter should be not be simulated (true).
 * @property {Boolean} [activeMultiplier=1] A value between 0 and 1 describing what percentage of this emitter's particlesPerSecond should be
 *                                          emitted, where 0 is 0%, and 1 is 100%.
 *                                          For example, having an emitter with 100 particles, a maxAge of 2, yields a particlesPerSecond
 *                                          value of 50. Setting `activeMultiplier` to 0.5, then, will only emit 25 particles per second (0.5 = 50%).
 *                                          Values greater than 1 will emulate a burst of particles, causing the emitter to run out of particles
 *                                          before it's next activation cycle.
 *
 * @property {Boolean} [direction=1] The direction of the emitter. If value is `1`, emitter will start at beginning of particle's lifecycle.
 *                                   If value is `-1`, emitter will start at end of particle's lifecycle and work it's way backwards.
 *
 * @property {Object} [maxAge={}] An object describing the particle's maximum age in seconds.
 * @property {Number} [maxAge.value=2] A number between 0 and 1 describing the amount of maxAge to apply to all particles.
 * @property {Number} [maxAge.spread=0] A number describing the maxAge variance on a per-particle basis.
 *
 *
 * @property {Object} [position={}] An object describing this emitter's position.
 * @property {Object} [position.value=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's base position.
 * @property {Object} [position.spread=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's position variance on a per-particle basis.
 *                                                          Note that when using a SPHERE or DISC distribution, only the x-component
 *                                                          of this vector is used.
 *                                                          When using a LINE distribution, this value is the endpoint of the LINE.
 * @property {Object} [position.spreadClamp=new t3d.Vector3()] A t3d.Vector3 instance describing the numeric multiples the particle's should
 *                                                               be spread out over.
 *                                                               Note that when using a SPHERE or DISC distribution, only the x-component
 *                                                               of this vector is used.
 *                                                               When using a LINE distribution, this property is ignored.
 * @property {Number} [position.radius=10] This emitter's base radius.
 * @property {Object} [position.radiusScale=new t3d.Vector3()] A t3d.Vector3 instance describing the radius's scale in all three axes. Allows a SPHERE or DISC to be squashed or stretched.
 * @property {distribution} [position.distribution=value of the `type` option.] A specific distribution to use when radiusing particles. Overrides the `type` option.
 * @property {Boolean} [position.randomise=false] When a particle is re-spawned, whether it's position should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [velocity={}] An object describing this particle velocity.
 * @property {Object} [velocity.value=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's base velocity.
 * @property {Object} [velocity.spread=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's velocity variance on a per-particle basis.
 *                                                          Note that when using a SPHERE or DISC distribution, only the x-component
 *                                                          of this vector is used.
 * @property {distribution} [velocity.distribution=value of the `type` option.] A specific distribution to use when calculating a particle's velocity. Overrides the `type` option.
 * @property {Boolean} [velocity.randomise=false] When a particle is re-spawned, whether it's velocity should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [acceleration={}] An object describing this particle's acceleration.
 * @property {Object} [acceleration.value=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's base acceleration.
 * @property {Object} [acceleration.spread=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's acceleration variance on a per-particle basis.
 *                           Note that when using a SPHERE or DISC distribution, only the x-component
 *                           of this vector is used.
 * @property {distribution} [acceleration.distribution=value of the `type` option.] A specific distribution to use when calculating a particle's acceleration. Overrides the `type` option.
 * @property {Boolean} [acceleration.randomise=false] When a particle is re-spawned, whether it's acceleration should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [drag={}] An object describing this particle drag. Drag is applied to both velocity and acceleration values.
 * @property {Number} [drag.value=0] A number between 0 and 1 describing the amount of drag to apply to all particles.
 * @property {Number} [drag.spread=0] A number describing the drag variance on a per-particle basis.
 * @property {Boolean} [drag.randomise=false] When a particle is re-spawned, whether it's drag should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [wiggle={}] This is quite a fun one! The values of this object will determine whether a particle will wiggle, or jiggle, or wave,
 *                                or shimmy, or waggle, or... Well you get the idea. The wiggle is calculated over-time, meaning that a particle will
 *                                start off with no wiggle, and end up wiggling about with the distance of the `value` specified by the time it dies.
 *                                It's quite handy to simulate fire embers, or similar effects where the particle's position should slightly change over
 *                                time, and such change isn't easily controlled by rotation, velocity, or acceleration. The wiggle is a combination of sin and cos calculations, so is circular in nature.
 * @property {Number} [wiggle.value=0] A number describing the amount of wiggle to apply to all particles. It's measured in distance.
 * @property {Number} [wiggle.spread=0] A number describing the wiggle variance on a per-particle basis.
 *
 *
 * @property {Object} [rotation={}] An object describing this emitter's rotation. It can either be static, or set to rotate from 0radians to the value of `rotation.value`
 *                                  over a particle's lifetime. Rotation values affect both a particle's position and the forces applied to it.
 * @property {Object} [rotation.axis=new t3d.Vector3(0, 1, 0)] A t3d.Vector3 instance describing this emitter's axis of rotation.
 * @property {Object} [rotation.axisSpread=new t3d.Vector3()] A t3d.Vector3 instance describing the amount of variance to apply to the axis of rotation on
 *                                                              a per-particle basis.
 * @property {Number} [rotation.angle=0] The angle of rotation, given in radians. If `rotation.static` is true, the emitter will start off rotated at this angle, and stay as such.
 *                                       Otherwise, the particles will rotate from 0radians to this value over their lifetimes.
 * @property {Number} [rotation.angleSpread=0] The amount of variance in each particle's rotation angle.
 * @property {Boolean} [rotation.static=false] Whether the rotation should be static or not.
 * @property {Object} [rotation.center=The value of `position.value`] A t3d.Vector3 instance describing the center point of rotation.
 * @property {Boolean} [rotation.randomise=false] When a particle is re-spawned, whether it's rotation should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [color={}] An object describing a particle's color. This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
 *                               given to describe specific value changes over a particle's lifetime.
 *                               Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of t3d.Color3 instances are given, then the array will be interpolated to
 *                               have a length matching the value of ParticleProperties.valueOverLifetimeLength.
 * @property {Object} [color.value=new t3d.Color3()] Either a single t3d.Color3 instance, or an array of t3d.Color3 instances to describe the color of a particle over it's lifetime.
 * @property {Object} [color.spread=new t3d.Vector3()] Either a single t3d.Vector3 instance, or an array of t3d.Vector3 instances to describe the color variance of a particle over it's lifetime.
 * @property {Boolean} [color.randomise=false] When a particle is re-spawned, whether it's color should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [opacity={}] An object describing a particle's opacity. This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
 *                               given to describe specific value changes over a particle's lifetime.
 *                               Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of numbers are given, then the array will be interpolated to
 *                               have a length matching the value of ParticleProperties.valueOverLifetimeLength.
 * @property {Number} [opacity.value=1] Either a single number, or an array of numbers to describe the opacity of a particle over it's lifetime.
 * @property {Number} [opacity.spread=0] Either a single number, or an array of numbers to describe the opacity variance of a particle over it's lifetime.
 * @property {Boolean} [opacity.randomise=false] When a particle is re-spawned, whether it's opacity should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [size={}] An object describing a particle's size. This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
 *                               given to describe specific value changes over a particle's lifetime.
 *                               Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of numbers are given, then the array will be interpolated to
 *                               have a length matching the value of ParticleProperties.valueOverLifetimeLength.
 * @property {Number} [size.value=1] Either a single number, or an array of numbers to describe the size of a particle over it's lifetime.
 * @property {Number} [size.spread=0] Either a single number, or an array of numbers to describe the size variance of a particle over it's lifetime.
 * @property {Boolean} [size.randomise=false] When a particle is re-spawned, whether it's size should be re-randomised or not. Can incur a performance hit.
 *
 *
 * @property {Object} [angle={}] An object describing a particle's angle. The angle is a 2d-rotation, measured in radians, applied to the particle's texture.
 *                               NOTE: if a particle's texture is a sprite-sheet, this value IS IGNORED.
 *                               This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
 *                               given to describe specific value changes over a particle's lifetime.
 *                               Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of numbers are given, then the array will be interpolated to
 *                               have a length matching the value of ParticleProperties.valueOverLifetimeLength.
 * @property {Number} [angle.value=0] Either a single number, or an array of numbers to describe the angle of a particle over it's lifetime.
 * @property {Number} [angle.spread=0] Either a single number, or an array of numbers to describe the angle variance of a particle over it's lifetime.
 * @property {Boolean} [angle.randomise=false] When a particle is re-spawned, whether it's angle should be re-randomised or not. Can incur a performance hit.
 *
 */

export class AbstractParticleEmitter {

	constructor(options) {
		this.uuid = t3d.generateUUID();

		const types = Utils.types,
			lifetimeLength = ParticleProperties.valueOverLifetimeLength;

		// Ensure we have a map of options to play with,
		// and that each option is in the correct format.

		options = Utils.ensureTypedArg(options, types.OBJECT, {});
		options.position = Utils.ensureTypedArg(options.position, types.OBJECT, {});
		options.velocity = Utils.ensureTypedArg(options.velocity, types.OBJECT, {});
		options.acceleration = Utils.ensureTypedArg(options.acceleration, types.OBJECT, {});
		options.radius = Utils.ensureTypedArg(options.radius, types.OBJECT, {});
		options.drag = Utils.ensureTypedArg(options.drag, types.OBJECT, {});
		options.rotation = Utils.ensureTypedArg(options.rotation, types.OBJECT, {});
		options.color = Utils.ensureTypedArg(options.color, types.OBJECT, {});
		options.opacity = Utils.ensureTypedArg(options.opacity, types.OBJECT, {});
		options.size = Utils.ensureTypedArg(options.size, types.OBJECT, {});
		options.angle = Utils.ensureTypedArg(options.angle, types.OBJECT, {});
		options.wiggle = Utils.ensureTypedArg(options.wiggle, types.OBJECT, {});
		options.maxAge = Utils.ensureTypedArg(options.maxAge, types.OBJECT, {});

		this.type = Utils.ensureTypedArg(options.type, types.NUMBER, ParticleProperties.distributions.BOX);

		// Start assigning properties...kicking it off with props that DON'T support values over
		// lifetimes.

		this.position = {
			_value: Utils.ensureInstanceOf(options.position.value, t3d.Vector3, new t3d.Vector3()),
			_spread: Utils.ensureInstanceOf(options.position.spread, t3d.Vector3, new t3d.Vector3()),
			_spreadClamp: Utils.ensureInstanceOf(options.position.spreadClamp, t3d.Vector3, new t3d.Vector3()),
			_distribution: Utils.ensureTypedArg(options.position.distribution, types.NUMBER, this.type),
			_randomise: Utils.ensureTypedArg(options.position.randomise, types.BOOLEAN, false),
			_radius: Utils.ensureTypedArg(options.position.radius, types.NUMBER, 10),
			_radiusScale: Utils.ensureInstanceOf(options.position.radiusScale, t3d.Vector3, new t3d.Vector3(1, 1, 1))
		};

		this.velocity = {
			_value: Utils.ensureInstanceOf(options.velocity.value, t3d.Vector3, new t3d.Vector3()),
			_spread: Utils.ensureInstanceOf(options.velocity.spread, t3d.Vector3, new t3d.Vector3()),
			_distribution: Utils.ensureTypedArg(options.velocity.distribution, types.NUMBER, this.type),
			_randomise: Utils.ensureTypedArg(options.velocity.randomise, types.BOOLEAN, false)
		};

		this.acceleration = {
			_value: Utils.ensureInstanceOf(options.acceleration.value, t3d.Vector3, new t3d.Vector3()),
			_spread: Utils.ensureInstanceOf(options.acceleration.spread, t3d.Vector3, new t3d.Vector3()),
			_distribution: Utils.ensureTypedArg(options.acceleration.distribution, types.NUMBER, this.type),
			_randomise: Utils.ensureTypedArg(options.acceleration.randomise, types.BOOLEAN, false)
		};

		this.drag = {
			_value: Utils.ensureTypedArg(options.drag.value, types.NUMBER, 0),
			_spread: Utils.ensureTypedArg(options.drag.spread, types.NUMBER, 0),
			_randomise: Utils.ensureTypedArg(options.drag.randomise, types.BOOLEAN, false)
		};

		this.wiggle = {
			_value: Utils.ensureTypedArg(options.wiggle.value, types.NUMBER, 0),
			_spread: Utils.ensureTypedArg(options.wiggle.spread, types.NUMBER, 0)
		};

		this.rotation = {
			_axis: Utils.ensureInstanceOf(options.rotation.axis, t3d.Vector3, new t3d.Vector3(0.0, 1.0, 0.0)),
			_axisSpread: Utils.ensureInstanceOf(options.rotation.axisSpread, t3d.Vector3, new t3d.Vector3()),
			_angle: Utils.ensureTypedArg(options.rotation.angle, types.NUMBER, 0),
			_angleSpread: Utils.ensureTypedArg(options.rotation.angleSpread, types.NUMBER, 0),
			_static: Utils.ensureTypedArg(options.rotation.static, types.BOOLEAN, false),
			_center: Utils.ensureInstanceOf(options.rotation.center, t3d.Vector3, this.position._value.clone()),
			_randomise: Utils.ensureTypedArg(options.rotation.randomise, types.BOOLEAN, false)
		};

		this.maxAge = {
			_value: Utils.ensureTypedArg(options.maxAge.value, types.NUMBER, 2),
			_spread: Utils.ensureTypedArg(options.maxAge.spread, types.NUMBER, 0)
		};

		// The following properties can support either single values, or an array of values that change
		// the property over a particle's lifetime (value over lifetime).

		this.color = {
			_value: Utils.ensureArrayInstanceOf(options.color.value, t3d.Color3, new t3d.Color3(1, 1, 1)),
			_spread: Utils.ensureArrayInstanceOf(options.color.spread, t3d.Vector3, new t3d.Vector3()),
			_randomise: Utils.ensureTypedArg(options.color.randomise, types.BOOLEAN, false)
		};

		this.opacity = {
			_value: Utils.ensureArrayTypedArg(options.opacity.value, types.NUMBER, 1),
			_spread: Utils.ensureArrayTypedArg(options.opacity.spread, types.NUMBER, 0),
			_randomise: Utils.ensureTypedArg(options.opacity.randomise, types.BOOLEAN, false)
		};

		this.size = {
			_value: Utils.ensureArrayTypedArg(options.size.value, types.NUMBER, 1),
			_spread: Utils.ensureArrayTypedArg(options.size.spread, types.NUMBER, 0),
			_randomise: Utils.ensureTypedArg(options.size.randomise, types.BOOLEAN, false)
		};

		this.angle = {
			_value: Utils.ensureArrayTypedArg(options.angle.value, types.NUMBER, 0),
			_spread: Utils.ensureArrayTypedArg(options.angle.spread, types.NUMBER, 0),
			_randomise: Utils.ensureTypedArg(options.angle.randomise, types.BOOLEAN, false)
		};

		// A set of flags to determine whether particular properties
		// should be re-randomised when a particle is reset.
		//
		// If a `randomise` property is given, this is preferred.
		// Otherwise, it looks at whether a spread value has been
		// given.
		//
		// It allows randomization to be turned off as desired. If
		// all randomization is turned off, then I'd expect a performance
		// boost as no attribute buffers (excluding the `params`)
		// would have to be re-passed to the GPU each frame (since nothing
		// except the `params` attribute would have changed).
		this.resetFlags = {
			// params: Utils.ensureTypedArg( options.maxAge.randomise, types.BOOLEAN, !!options.maxAge.spread ) ||
			//     Utils.ensureTypedArg( options.wiggle.randomise, types.BOOLEAN, !!options.wiggle.spread ),
			position: Utils.ensureTypedArg(options.position.randomise, types.BOOLEAN, false) ||
				Utils.ensureTypedArg(options.radius.randomise, types.BOOLEAN, false),
			velocity: Utils.ensureTypedArg(options.velocity.randomise, types.BOOLEAN, false),
			acceleration: Utils.ensureTypedArg(options.acceleration.randomise, types.BOOLEAN, false) ||
				Utils.ensureTypedArg(options.drag.randomise, types.BOOLEAN, false),
			rotation: Utils.ensureTypedArg(options.rotation.randomise, types.BOOLEAN, false),
			// rotationCenter: Utils.ensureTypedArg(options.rotation.randomise, types.BOOLEAN, false),
			size: Utils.ensureTypedArg(options.size.randomise, types.BOOLEAN, false),
			color: Utils.ensureTypedArg(options.color.randomise, types.BOOLEAN, false),
			opacity: Utils.ensureTypedArg(options.opacity.randomise, types.BOOLEAN, false),
			angle: Utils.ensureTypedArg(options.angle.randomise, types.BOOLEAN, false)
		};

		this.updateFlags = {};
		this.updateCounts = {};

		// A map to indicate which emitter parameters should update
		// which attribute.
		this.updateMap = {
			maxAge: 'params',
			position: 'position',
			velocity: 'velocity',
			acceleration: 'acceleration',
			drag: 'acceleration',
			wiggle: 'params',
			rotation: 'rotation',
			size: 'size',
			color: 'color',
			opacity: 'opacity',
			angle: 'angle'
		};

		for (const i in this.updateMap) {
			if (this.updateMap.hasOwnProperty(i)) {
				this.updateCounts[this.updateMap[i]] = 0.0;
				this.updateFlags[this.updateMap[i]] = false;
				this._createGetterSetters(this[i], i);
			}
		}

		// Ensure that the value-over-lifetime property objects above
		// have value and spread properties that are of the same length.
		//
		// Also, for now, make sure they have a length of 4 (min/max arguments here).

		Utils.ensureValueOverLifetimeCompliance(this.color, lifetimeLength, lifetimeLength);
		Utils.ensureValueOverLifetimeCompliance(this.opacity, lifetimeLength, lifetimeLength);
		Utils.ensureValueOverLifetimeCompliance(this.size, lifetimeLength, lifetimeLength);
		Utils.ensureValueOverLifetimeCompliance(this.angle, lifetimeLength, lifetimeLength);

		// Assign renaining option values.

		this.particleCount = Utils.ensureTypedArg(options.particleCount, types.NUMBER, 100);
		this.duration = Utils.ensureTypedArg(options.duration, types.NUMBER, null);
		this.isStatic = Utils.ensureTypedArg(options.isStatic, types.BOOLEAN, false);
		this.activeMultiplier = Utils.ensureTypedArg(options.activeMultiplier, types.NUMBER, 1);
		this.direction = Utils.ensureTypedArg(options.direction, types.NUMBER, 1);

		// For mesh particles

		this.isLookAtCamera = Utils.ensureTypedArg(options.isLookAtCamera, types.BOOLEAN, false);
		this.isLookAtCameraOnlyY = Utils.ensureTypedArg(options.isLookAtCameraOnlyY, types.BOOLEAN, false);

		// Whether this emitter is alive or not.
		this.alive = Utils.ensureTypedArg(options.alive, types.BOOLEAN, true);

		// The following properties are set internally and are not
		// user-controllable.

		this.particlesPerSecond = 0;
		this.calculatePPSValue();

		// Holds the time the emitter has been alive for.
		this.age = 0.0;

		// Holds a reference to this emitter's group once
		// it's added to one.
		this.group = null;
	}

	_createGetterSetters(propObj, propName) {
		const self = this;

		for (const i in propObj) {
			if (propObj.hasOwnProperty(i)) {
				const name = i.replace('_', '');

				Object.defineProperty(propObj, name, {
					get: (function (prop) {
						return function () {
							return this[prop];
						};
					}(i)),

					set: (function (prop) {
						return function (value) {
							const mapName = self.updateMap[propName],
								prevValue = this[prop],
								length = ParticleProperties.valueOverLifetimeLength;

							if (prop === '_randomise') {
								self.resetFlags[mapName] = value;
							} else {
								self.updateFlags[mapName] = true;
								self.updateCounts[mapName] = 0.0;
							}

							this[prop] = value;

							self.group.$updateDefines(self);

							// If the previous value was an array, then make
							// sure the provided value is interpolated correctly.
							if (Array.isArray(prevValue)) {
								Utils.ensureValueOverLifetimeCompliance(self[propName], length, length);
							}
						};
					}(i))
				});
			}
		}
	}

	/**
	 * Calculate the `particlesPerSecond` value for this emitter. It's used
	 * when determining which particles should die and which should live to
	 * see another day. Or be born, for that matter. The "God" property.
	 */
	calculatePPSValue() {
		const particleCount = this.particleCount;
		const maxAge = this.maxAge._value + Math.abs(this.maxAge._spread * 0.5);

		if (this.duration !== null) {
			this.particlesPerSecond = particleCount / Math.min(maxAge, this.duration);
		} else {
			this.particlesPerSecond = particleCount / maxAge;
		}

		return this;
	}

	/**
	 * Enables the emitter. If not already enabled, the emitter
	 * will start emitting particles.
	 *
	 * @return {Emitter} This emitter instance.
	 */
	enable() {
		this.alive = true;
		return this;
	}

	/**
	 * Disables th emitter, but does not instantly remove it's
	 * particles fromt the scene. When called, the emitter will be
	 * 'switched off' and just stop emitting. Any particle's alive will
	 * be allowed to finish their lifecycle.
	 *
	 * @return {Emitter} This emitter instance.
	 */
	disable() {
		this.alive = false;
		return this;
	}

	/**
	 * Remove this emitter from it's parent group (if it has been added to one).
	 * Delgates to ParticleGroup.prototype.removeEmitter().
	 *
	 * When called, all particle's belonging to this emitter will be instantly
	 * removed from the scene.
	 *
	 * @return {Emitter} This emitter instance.
	 *
	 * @see ParticleGroup.prototype.removeEmitter
	 */
	remove() {
		if (this.group !== null) {
			this.group.removeEmitter(this);
		} else {
			console.error('Emitter does not belong to a group, cannot remove.');
		}

		return this;
	}

	reset(force) {}

	_assignValue() {}

	_assignPositionValue(array, offset) {
		const distributions = ParticleProperties.distributions,
			prop = this.position,
			value = prop._value,
			spread = prop._spread,
			distribution = prop._distribution;

		switch (distribution) {
			case distributions.BOX:
				Utils.getRandomVector3(array, offset, value, spread, prop._spreadClamp);
				break;
			case distributions.SPHERE:
				Utils.getRandomVector3OnSphere(array, offset, value, prop._radius, prop._spread.x, prop._radiusScale, prop._spreadClamp.x, prop._distributionClamp || this.particleCount);
				break;
			case distributions.DISC:
				Utils.getRandomVector3OnDisc(array, offset, value, prop._radius, prop._spread.x, prop._radiusScale, prop._spreadClamp.x);
				break;
			case distributions.LINE:
				Utils.getRandomVector3OnLine(array, offset, value, spread);
				break;
		}

		return array;
	}

	_assignForceValue(array, offset, attrName, particlePos) {
		const distributions = ParticleProperties.distributions,
			prop = this[attrName],
			value = prop._value,
			spread = prop._spread,
			distribution = prop._distribution;

		switch (distribution) {
			case distributions.BOX:
				Utils.getRandomVector3(array, offset, value, spread);
				break;
			case distributions.SPHERE:
				Utils.getRandomDirectionVector3OnSphere(
					array, offset,
					particlePos[0],
					particlePos[1],
					particlePos[2],
					this.position.value,
					value.x,
					spread.x
				);
				break;
			case distributions.DISC:
				Utils.getRandomDirectionVector3OnDisc(
					array, offset,
					particlePos[0],
					particlePos[1],
					particlePos[2],
					this.position.value,
					value.x,
					spread.x
				);
				break;
			case distributions.LINE:
				Utils.getRandomVector3OnLine(array, offset, value, spread);
				break;
		}

		if (attrName === 'acceleration') {
			const drag = Utils.clamp(Utils.randomFloat(this.drag._value, this.drag._spread), 0, 1);
			array[offset + 3] = drag;
		}

		return array;
	}

	_assignAbsLifetimeValue(array, offset, attrName) {
		const prop = this[attrName];

		if (Utils.arrayValuesAreEqual(prop._value) && Utils.arrayValuesAreEqual(prop._spread)) {
			const value = Math.abs(Utils.randomFloat(prop._value[0], prop._spread[0]));
			array[offset + 0] = value;
			array[offset + 1] = value;
			array[offset + 2] = value;
			array[offset + 3] = value;
		} else {
			array[offset + 0] = Math.abs(Utils.randomFloat(prop._value[0], prop._spread[0]));
			array[offset + 1] = Math.abs(Utils.randomFloat(prop._value[1], prop._spread[1]));
			array[offset + 2] = Math.abs(Utils.randomFloat(prop._value[2], prop._spread[2]));
			array[offset + 3] = Math.abs(Utils.randomFloat(prop._value[3], prop._spread[3]));
		}

		return array;
	}

	_assignAngleValue(array, offset) {
		const prop = this.angle;

		if (Utils.arrayValuesAreEqual(prop._value) && Utils.arrayValuesAreEqual(prop._spread)) {
			const value = Utils.randomFloat(prop._value[0], prop._spread[0]);
			array[offset + 0] = value;
			array[offset + 1] = value;
			array[offset + 2] = value;
			array[offset + 3] = value;
		} else {
			array[offset + 0] = Utils.randomFloat(prop._value[0], prop._spread[0]);
			array[offset + 1] = Utils.randomFloat(prop._value[1], prop._spread[1]);
			array[offset + 2] = Utils.randomFloat(prop._value[2], prop._spread[2]);
			array[offset + 3] = Utils.randomFloat(prop._value[3], prop._spread[3]);
		}

		return array;
	}

	_assignParamsValue(array, offset, init) {
		if (init) {
			array[offset + 0] = this.isStatic ? 1 : 0;
		} else {
			array[offset + 0] = 1;
		}
		array[offset + 1] = 0;
		array[offset + 2] = Utils.randomFloat(this.maxAge._value, this.maxAge._spread);
		array[offset + 3] =  Utils.randomFloat(this.wiggle._value, this.wiggle._spread);

		return array;
	}

	_assignRotationValue(array, offset, array2, offset2, pack) {
		const rotationAxis = Utils.getRotationAxis(_vec3_1, this.rotation._axis, this.rotation._axisSpread);

		if (pack) {
			rotationAxis.x += 1;
			rotationAxis.y += 1;
			rotationAxis.z += 1;

			rotationAxis.multiplyScalar(0.5);

			_col3_1.setRGB(rotationAxis.x, rotationAxis.y, rotationAxis.z);

			array[offset + 0] = _col3_1.getHex();
			array[offset + 1] = Utils.randomFloat(this.rotation._angle, this.rotation._angleSpread);
			array[offset + 2] = this.rotation._static ? 0 : 1;
		} else {
			array[offset + 0] = rotationAxis.x;
			array[offset + 1] = rotationAxis.y;
			array[offset + 2] = rotationAxis.z;

			array[offset + 3] = Utils.randomFloat(this.rotation._angle, this.rotation._angleSpread);
			array[offset + 4] = this.rotation._static ? 0 : 1;
		}

		this.rotation._center.toArray(array2, offset2);
	}

	_assignColorValue(array, offset, pack) {
		const base = this.color._value;
		const spread = this.color._spread;

		const numItems = base.length;

		for (let i = 0; i < numItems; ++i) {
			const spreadVector = spread[i];

			_col3_1.copy(base[i]);

			_col3_1.r += (Math.random() * spreadVector.x) - (spreadVector.x * 0.5);
			_col3_1.g += (Math.random() * spreadVector.y) - (spreadVector.y * 0.5);
			_col3_1.b += (Math.random() * spreadVector.z) - (spreadVector.z * 0.5);

			_col3_1.r = Utils.clamp(_col3_1.r, 0, 1);
			_col3_1.g = Utils.clamp(_col3_1.g, 0, 1);
			_col3_1.b = Utils.clamp(_col3_1.b, 0, 1);

			if (pack) {
				array[offset + i] = _col3_1.getHex();
			} else {
				_col3_1.toArray(array, offset + i * 3);
			}
		}
	}

}

const _vec3_1 = new t3d.Vector3();
const _col3_1 = new t3d.Color3();