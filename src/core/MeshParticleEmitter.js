import { MeshParticle } from './MeshParticle.js';
import { AbstractParticleEmitter } from './AbstractParticleEmitter.js';

export class MeshParticleEmitter extends AbstractParticleEmitter {

	constructor(options) {
		super(options);

		this._activeParticles = new Array();
		this._particlePool = new Array();

		// accumulate spawn decimal
		this._spawnDecimal = 0.0;
	}

	tick(dt, camera) {
		if (this.isStatic) {
			for (let i = 0, len = this._activeParticles.length; i < len; i++) {
				if (this._activeParticles[i].isAlive()) {
					const group = this.group;
					this._activeParticles[i].submit(group.$instanceBuffer.array, group.$allocBufferIndex());
				}
			}
			return;
		}

		if (this.alive === false) {
			this.age = 0.0;
			return;
		}

		const outDuration = this.duration !== null && this.age > this.duration;

		// spawn particles

		if (!outDuration) {
			const activationCount = this._activeParticles.length;

			const _ppsDt = this.particlesPerSecond * this.activeMultiplier * dt + this._spawnDecimal;
			const ppsDt = Math.floor(_ppsDt);
			this._spawnDecimal = _ppsDt - ppsDt;

			const spawnCount = Math.min(activationCount + ppsDt, this.particleCount) - activationCount;

			for (let i = 0; i < spawnCount; i++) {
				const particle = this._particlePool.length <= 0 ? new MeshParticle() : this._particlePool.shift();

				this._resetParticle(particle);

				this._activeParticles.push(particle);
			}
		}

		// tick particles

		for (let i = 0, len = this._activeParticles.length; i < len; i++) {
			this._activeParticles[i].tick(dt, camera, this);

			if (this._activeParticles[i].isAlive()) {
				const group = this.group;
				this._activeParticles[i].submit(group.$instanceBuffer.array, group.$allocBufferIndex());
			} else {
				this._particlePool.push(this._activeParticles[i]);

				this._activeParticles.splice(i, 1);
				len--;
				i--;
			}
		}

		// trun alive to false if out of duration & has no active particles

		if (outDuration && this._activeParticles.length <= 0) {
			this.alive = false;
			this.age = 0.0;
		}

		// update age

		if (this.alive) {
			this.age += dt;
		}
	}

	_onRemove() {
		this.particlesPerSecond = 0;
		this._spawnDecimal = 0.0;

		this.group = null;
	}

	reset(force) {
		this.alive = false;
		this.age = 0.0;

		if (force) {
			this._activeParticles = [];
			this._particlePool = [];
		}
	}

	$updateFlags(group) {
		this.SHOULD_DRAG_PARTICLES = false || !!Math.max(this.drag._value, this.drag._spread);
		this.SHOULD_WIGGLE_PARTICLES = false || !!Math.max(this.wiggle._value, this.wiggle._spread);
		this.SHOULD_ROTATE_PARTICLES = false || !!Math.max(this.rotation._angle, this.rotation._angleSpread);
		this.SHOULD_COLORIZE_PARTICLES = group.colorize;
		this.SHOULD_SIZE_PARTICLES = true;
		this.SHOULD_ANGLE_PARTICLES = true;
	}

	_assignValue(prop, out, particlePos, out2) {
		switch (prop) {
			case 'position':
				this._assignPositionValue(out, 0);
				break;
			case 'velocity':
			case 'acceleration':
				this._assignForceValue(out, 0, prop, particlePos);
				break;
			case 'size':
			case 'opacity':
				this._assignAbsLifetimeValue(out, 0, prop);
				break;
			case 'angle':
				this._assignAngleValue(out, 0);
				break;
			case 'params':
				this._assignParamsValue(out, 0);
				break;
			case 'rotation':
				this._assignRotationValue(out, 0, out2, 0);
				break;
			case 'color':
				this._assignColorValue(out, 0);
				break;
		}
	}

	_resetParticle(particle) {
		this._assignValue('position', particle._originPosition);
		this._assignValue('velocity', particle._originVelocity, particle._originPosition);
		this._assignValue('acceleration', particle._originAcceleration, particle._originPosition);
		this._assignValue('opacity', particle._originOpacityArray);
		this._assignValue('size', particle._originSizeArray);
		this._assignValue('angle', particle._originAngleArray);
		this._assignValue('color', particle._originColorArray);
		this._assignValue('params', particle._originParams);
		this._assignValue('rotation', particle._originRotation, undefined, particle._originRotationCenter);
	}

}