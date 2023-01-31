import { AbstractParticleEmitter } from "./AbstractParticleEmitter.js";

export class ParticleEmitter extends AbstractParticleEmitter {

	constructor(options) {
		super(options);

		// The following properties are set internally and are not
		// user-controllable.

		// The current particle index for which particles should
		// be marked as active on the next update cycle.
		this.activationIndex = 0;

		// The offset in the typed arrays this emitter's
		// particle's values will start at
		this.attributeOffset = 0;

		// The end of the range in the attribute buffers
		this.attributeEnd = 0;

		// Holds the number of currently-alive particles
		this.activeParticleCount = 0.0;

		// Holds a reference to this emitter's group's attributes object
		// for easier access.
		this.attributes = null;

		// Holds a reference to the params attribute's typed array
		// for quicker access.
		this.paramsArray = null;

		this.bufferUpdateRanges = {};
		this.attributeKeys = null;
		this.attributeCount = 0;
	}

	/**
	 * Simulates one frame's worth of particles, updating particles
	 * that are already alive, and marking ones that are currently dead
	 * but should be alive as alive.
	 *
	 * If the emitter is marked as static, then this function will do nothing.
	 *
	 * @param  {Number} dt The number of seconds to simulate (deltaTime)
	 */
	tick(dt) {
		if (this.isStatic) {
			return;
		}

		if (this.paramsArray === null) {
			this.paramsArray = this.attributes.params.typedArray.array;
		}

		const start = this.attributeOffset,
			end = start + this.particleCount,
			params = this.paramsArray, // vec3( alive, age, maxAge, wiggle )
			ppsDt = this.particlesPerSecond * this.activeMultiplier * dt,
			activationIndex = this.activationIndex;

		// Reset the buffer update indices.
		this._resetBufferRanges();

		// Increment age for those particles that are alive,
		// and kill off any particles whose age is over the limit.
		this._checkParticleAges(start, end, params, dt);

		// If the emitter is dead, reset the age of the emitter to zero,
		// ready to go again if required
		if (this.alive === false) {
			this.age = 0.0;
			return;
		}

		// If the emitter has a specified lifetime and we've exceeded it,
		// mark the emitter as dead.
		if (this.duration !== null && this.age > this.duration) {
			this.alive = false;
			this.age = 0.0;
			return;
		}

		const activationStart = this.particleCount === 1 ? activationIndex : (activationIndex | 0),
			activationEnd = Math.min(activationStart + ppsDt, this.activationEnd),
			activationCount = activationEnd - this.activationIndex | 0,
			dtPerParticle = activationCount > 0 ? dt / activationCount : 0;

		this._activateParticles(activationStart, activationEnd, params, dtPerParticle);

		// Move the activation window forward, soldier.
		this.activationIndex += ppsDt;

		if (this.activationIndex > end) {
			this.activationIndex = start;
		}

		// Increment the age of the emitter.
		this.age += dt;
	}

	/**
	 * Resets all the emitter's particles to their start positions
	 * and marks the particles as dead if the `force` argument is
	 * true.
	 *
	 * @param  {Boolean} [force=undefined] If true, all particles will be marked as dead instantly.
	 * @return {ParticleEmitter}       This emitter instance.
	 */
	reset(force) {
		this.age = 0.0;
		this.alive = false;

		if (force === true) {
			const start = this.attributeOffset,
				end = start + this.particleCount,
				array = this.paramsArray,
				attr = this.attributes.params.bufferAttribute;

			for (let i = end - 1, index; i >= start; --i) {
				index = i * 4;

				array[index] = 0.0;
				array[index + 1] = 0.0;
			}

			attr.updateRange.offset = 0;
			attr.updateRange.count = -1;
			attr.needsUpdate = true;
		}

		return this;
	}

	_assignValue(prop, index) {
		let typedArray, typedArray2,
			positionX,
			positionY,
			positionZ;

		switch (prop) {
			case 'position':
				typedArray = this.attributes.position.typedArray;
				this._assignPositionValue(typedArray.array, typedArray.componentSize * index);
				break;

			case 'velocity':
			case 'acceleration':
				typedArray = this.attributes.position.typedArray;

				// Ensure position values aren't zero? otherwise no force will be applied.
				positionX = typedArray.array[index * 3 + 0];
				positionY = typedArray.array[index * 3 + 1];
				positionZ = typedArray.array[index * 3 + 2];

				typedArray = this.attributes[prop].typedArray;
				this._assignForceValue(typedArray.array, typedArray.componentSize * index, prop, [positionX, positionY, positionZ]);
				break;

			case 'size':
			case 'opacity':
				typedArray = this.attributes[prop].typedArray;
				this._assignAbsLifetimeValue(typedArray.array, typedArray.componentSize * index, prop);
				break;

			case 'angle':
				typedArray = this.attributes.angle.typedArray;
				this._assignAngleValue(typedArray.array, typedArray.componentSize * index);
				break;

			case 'params':
				typedArray = this.attributes.params.typedArray;
				this._assignParamsValue(typedArray.array, typedArray.componentSize * index, true);
				break;

			case 'rotation':
				typedArray = this.attributes.rotation.typedArray;
				typedArray2 = this.attributes.rotationCenter.typedArray;
				this._assignRotationValue(
					typedArray.array, typedArray.componentSize * index,
					typedArray2.array, typedArray2.componentSize * index,
					true
				);
				break;

			case 'color':
				typedArray = this.attributes.color.typedArray;
				this._assignColorValue(typedArray.array, typedArray.componentSize * index, true);
				break;
		}
	}

	_resetParticle(index) {
		const resetFlags = this.resetFlags,
			updateFlags = this.updateFlags,
			updateCounts = this.updateCounts,
			keys = this.attributeKeys;

		let key, updateFlag;

		for (let i = this.attributeCount - 1; i >= 0; --i) {
			key = keys[i];
			updateFlag = updateFlags[key];

			if (resetFlags[key] === true || updateFlag === true) {
				this._assignValue(key, index);
				this._updateAttributeUpdateRange(key, index);

				if (updateFlag === true && updateCounts[key] === this.particleCount) {
					updateFlags[key] = false;
					updateCounts[key] = 0.0;
				} else if (updateFlag == true) {
					++updateCounts[key];
				}
			}
		}
	}

	_setBufferUpdateRanges(keys) {
		this.attributeKeys = keys;
		this.attributeCount = keys.length;

		for (let i = this.attributeCount - 1; i >= 0; --i) {
			this.bufferUpdateRanges[keys[i]] = {
				min: Number.POSITIVE_INFINITY,
				max: Number.NEGATIVE_INFINITY
			};
		}
	}

	_setAttributeOffset(startIndex) {
		this.attributeOffset = startIndex;
		this.activationIndex = startIndex;
		this.activationEnd = startIndex + this.particleCount;
	}

	_updateAttributeUpdateRange(attr, i) {
		const ranges = this.bufferUpdateRanges[attr];

		ranges.min = Math.min(i, ranges.min);
		ranges.max = Math.max(i, ranges.max);
	}

	_resetBufferRanges() {
		const ranges = this.bufferUpdateRanges,
			keys = this.bufferUpdateKeys;

		let i = this.bufferUpdateCount - 1, key;

		for (i; i >= 0; --i) {
			key = keys[i];
			ranges[key].min = Number.POSITIVE_INFINITY;
			ranges[key].max = Number.NEGATIVE_INFINITY;
		}
	}

	_onRemove() {
		// Reset any properties of the emitter that were set by
		// a group when it was added.
		this.particlesPerSecond = 0;
		this.attributeOffset = 0;
		this.activationIndex = 0;
		this.activeParticleCount = 0;
		this.group = null;
		this.attributes = null;
		this.paramsArray = null;
		this.age = 0.0;
	}

	_decrementParticleCount() {
		--this.activeParticleCount;

		// TODO:
		//  - Trigger event if count === 0.
	}

	_incrementParticleCount() {
		++this.activeParticleCount;

		// TODO:
		//  - Trigger event if count === this.particleCount.
	}

	_checkParticleAges(start, end, params, dt) {
		for (let i = end - 1, index, maxAge, age, alive; i >= start; --i) {
			index = i * 4;

			alive = params[index];

			if (alive === 0.0) {
				continue;
			}

			// Increment age
			age = params[index + 1];
			maxAge = params[index + 2];

			if (this.direction === 1) {
				age += dt;

				if (age >= maxAge) {
					age = 0.0;
					alive = 0.0;
					this._decrementParticleCount();
				}
			} else {
				age -= dt;

				if (age <= 0.0) {
					age = maxAge;
					alive = 0.0;
					this._decrementParticleCount();
				}
			}

			params[index] = alive;
			params[index + 1] = age;

			this._updateAttributeUpdateRange('params', i);
		}
	}

	_activateParticles(activationStart, activationEnd, params, dtPerParticle) {
		const direction = this.direction;

		for (let i = activationStart, index, dtValue; i < activationEnd; ++i) {
			index = i * 4;

			// Don't re-activate particles that aren't dead yet.
			// if ( params[ index ] !== 0.0 && ( this.particleCount !== 1 || this.activeMultiplier !== 1 ) ) {
			//     continue;
			// }

			if (params[index] != 0.0 && this.particleCount !== 1) {
				continue;
			}

			// Increment the active particle count.
			this._incrementParticleCount();

			// Mark the particle as alive.
			params[index] = 1.0;

			// Reset the particle
			this._resetParticle(i);

			// Move each particle being activated to
			// it's actual position in time.
			//
			// This stops particles being 'clumped' together
			// when frame rates are on the lower side of 60fps
			// or not constant (a very real possibility!)
			dtValue = dtPerParticle * (i - activationStart);
			if (dtValue <= params[index + 1]) {
				params[index + 1] = direction === -1 ? params[index + 2] - dtValue : dtValue;
			}

			this._updateAttributeUpdateRange('params', i);
		}
	}

}