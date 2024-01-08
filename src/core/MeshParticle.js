import * as t3d from 't3d';
import { ParticleProperties } from '../ParticleProperties.js';
import { Utils } from './Utils.js';

export class MeshParticle {

	constructor() {
		this._matrix = new t3d.Matrix4();
		this._color = new t3d.Color3(1, 1, 1);
		this._opacity = 1;

		this._originPosition = [0, 0, 0];
		this._originVelocity = [0, 0, 0];
		this._originAcceleration = [0, 0, 0, 0]; // Acceleration, Drag
		this._originOpacityArray = [];
		this._originSizeArray = [];
		this._originAngleArray = [];
		this._originColorArray = [
			1, 1, 1,
			1, 1, 1,
			1, 1, 1,
			1, 1, 1
		];
		this._originParams = [0, 0, 0, 0]; // Alive, Age, MaxAge, Wiggle
		this._originRotation = [0, 1, 0, 0, 0]; // Axis, Angle, Dynamic ( not static )
		this._originRotationCenter = [0, 0, 0];
	}

	isAlive() {
		return !!this._originParams[0];
	}

	tick(dt, camera, emitter) {
		this._originParams[1] += dt;

		// if (emitter.duration !== null && this._originParams[1] > emitter.duration) {
		// 	this._originParams[0] = 0;
		// }

		if (this._originParams[1] > this._originParams[2]) {
			this._originParams[0] = 0;
		}

		if (this._originParams[0] === 0) {
			this._originParams[1] = 0.0;
			return;
		}

		this._update(camera, emitter);
	}

	submit(array, index) {
		const arrayIndex = index * 16;
		const matrixElements = this._matrix.elements;

		array[arrayIndex] = matrixElements[0];
		array[arrayIndex + 1] = matrixElements[1];
		array[arrayIndex + 2] = matrixElements[2];

		array[arrayIndex + 3] = matrixElements[4];
		array[arrayIndex + 4] = matrixElements[5];
		array[arrayIndex + 5] = matrixElements[6];

		array[arrayIndex + 6] = matrixElements[8];
		array[arrayIndex + 7] = matrixElements[9];
		array[arrayIndex + 8] = matrixElements[10];

		array[arrayIndex + 9] = matrixElements[12];
		array[arrayIndex + 10] = matrixElements[13];
		array[arrayIndex + 11] = matrixElements[14];

		array[arrayIndex + 12] = this._color.r;
		array[arrayIndex + 13] = this._color.g;
		array[arrayIndex + 14] = this._color.b;
		array[arrayIndex + 15] = this._opacity;
	}

	_update(camera, emitter) {
		const age = this._originParams[1];
		const positionInTime = age / this._originParams[2];

		// position

		const velocity = _vec3_2.fromArray(this._originVelocity);

		if (emitter.SHOULD_DRAG_PARTICLES) {
			const fDrag = 1.0 - (positionInTime * 0.5) * this._originAcceleration[3];
			velocity.multiplyScalar(fDrag);
		}

		const acceleration = _vec3_1.fromArray(this._originAcceleration);

		_position
			.fromArray(this._originPosition)
			.add(velocity.multiplyScalar(age))
			.add(acceleration.multiplyScalar(age * age * 0.5));

		if (emitter.SHOULD_WIGGLE_PARTICLES) {
			const fWiggle = positionInTime * this._originParams[3] * Math.PI;
			const fWiggleSin = Math.sin(fWiggle);
			const fWiggleCos = Math.cos(fWiggle);

			_position.x += fWiggleSin;
			_position.y += fWiggleCos;
			_position.z += fWiggleSin;
		}

		if (emitter.SHOULD_ROTATE_PARTICLES) {
			const rotationAngle = this._originRotation[3];
			if (rotationAngle !== 0) {
				let angle = 0.0;
				if (this._originRotation[4] === 0) {
					angle = rotationAngle;
				} else {
					angle = Utils.lerp(0.0, rotationAngle, positionInTime);
				}

				const axis = _vec3_1.fromArray(this._originRotation);
				const rotationMatrix = _mat4_1.makeRotationAxis(axis, angle);

				const translated = _vec3_1.fromArray(this._originRotationCenter).sub(_position);
				translated.applyMatrix4(rotationMatrix);

				_position.fromArray(this._originRotationCenter).sub(translated);
			}
		}

		// scale

		_scale.set(1, 1, 1);

		if (emitter.SHOULD_SIZE_PARTICLES) {
			const s = getFloatOverLifetime(positionInTime, this._originSizeArray);
			_scale.set(s, s, s);
		}

		// rotation

		if (emitter.isLookAtCamera || emitter.isLookAtCameraOnlyY) {
			if (emitter.isLookAtCamera) {
				_rotation.copy(camera.quaternion);
			} else if (emitter.isLookAtCameraOnlyY) {
				_mat4_1.getInverse(emitter.group.mesh.worldMatrix);
				_mat4_1.multiply(camera.worldMatrix);
				_vec3_1.setFromMatrixPosition(_mat4_1);
				_vec3_2.copy(_position).sub(_vec3_1);
				_vec3_2.y = 0;
				_rotation.setFromUnitVectors(_vec3_1.set(0, 0, -1), _vec3_2.normalize());
			}
		} else if (emitter.SHOULD_ANGLE_PARTICLES) {
			const r = getFloatOverLifetime(positionInTime, this._originAngleArray); // rotate all x, y, z ?
			_euler_1.set(r, r, r);
			_rotation.setFromEuler(_euler_1, false);
		}

		// combine to matrix

		this._matrix.transform(_position, _scale, _rotation);

		// color & opacity

		if (emitter.SHOULD_COLORIZE_PARTICLES) {
			getColorOverLifetime(
				positionInTime,
				this._originColorArray,
				this._color
			);

			this._opacity = getFloatOverLifetime(positionInTime, this._originOpacityArray);
		} else {
			this._color.setRGB(1, 1, 1);
			this._opacity = 1;
		}
	}

}

const _vec3_1 = new t3d.Vector3();
const _vec3_2 = new t3d.Vector3();
const _euler_1 = new t3d.Euler();
const _mat4_1 = new t3d.Matrix4();

const _position = new t3d.Vector3();
const _rotation = new t3d.Quaternion();
const _scale = new t3d.Vector3();

function getFloatOverLifetime(positionInTime, attr) {
	const maxAge = ParticleProperties.valueOverLifetimeLength - 1;

	let value = 0;

	if (positionInTime <= 0.0) {
		value = 0;
	} else if (positionInTime >= 1.0) {
		value = attr[maxAge];
	} else {
		const deltaAge = positionInTime * maxAge;
		for (let i = 0; i < maxAge; i++) {
			if (deltaAge > i && deltaAge < i + 1.0) {
				value += Utils.lerp(attr[i], attr[i + 1], deltaAge - i);
				break;
			}
		}
	}

	return value;
}

function getColorOverLifetime(positionInTime, attr, out) {
	const maxAge = ParticleProperties.valueOverLifetimeLength - 1;

	if (positionInTime <= 0.0) {
		out.fromArray(attr, 0);
	} else if (positionInTime >= 1.0) {
		out.fromArray(attr, maxAge * 3);
	} else {
		const deltaAge = positionInTime * maxAge;
		let ratio, index, nextIndex;
		for (let i = 0; i < maxAge; i++) {
			if (deltaAge > i && deltaAge < i + 1.0) {
				ratio = deltaAge - i;
				index = i * 3;
				nextIndex = index + 3;
				out.r = ratio * (attr[nextIndex + 0] - attr[index + 0]) + attr[index + 0];
				out.g = ratio * (attr[nextIndex + 1] - attr[index + 1]) + attr[index + 1];
				out.b = ratio * (attr[nextIndex + 2] - attr[index + 2]) + attr[index + 2];
				break;
			}
		}
	}

	return out;
}