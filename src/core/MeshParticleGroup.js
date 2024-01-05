import * as t3d from 't3d';
import { Utils } from './Utils.js';
import { MeshParticleShader } from '../shaders/MeshParticleShader.js';
import { AbstractParticleGroup } from './AbstractParticleGroup.js';
import { MeshParticleEmitter } from './MeshParticleEmitter.js';

export class MeshParticleGroup extends AbstractParticleGroup {

	constructor(options) {
		const types = Utils.types;

		// Ensure we have a map of options to play with
		options = Utils.ensureTypedArg(options, types.OBJECT, {});

		super(options, MeshParticleShader);

		// Set max particle count

		if (options.maxParticleCount === undefined) {
			console.warn('MeshParticleGroup: options.maxParticleCount is not provided, set to 1000 by default.');
			options.maxParticleCount = 1000;
		}
		this.maxParticleCount = options.maxParticleCount;

		// Create geometry

		if (!options.geometry || !(options.geometry instanceof t3d.Geometry)) {
			console.warn('MeshParticleGroup: options.geometry is not provided, set a box geometry by default.');
			options.geometry = new t3d.BoxGeometry(1, 1, 1);
		}
		const geometry = generateInstancedGeometry(options.geometry, this.maxParticleCount);
		this.$instanceBuffer = geometry.attributes.mcol0.buffer;
		this._geometry = geometry;

		// Create mesh

		this.mesh = new t3d.Mesh(geometry, this.material);
		this.mesh.frustumCulled = false;

		//

		this._particleCount = 0;
		this._aliveParticleCount = 0;
	}

	addEmitter(emitter) {
		if (emitter instanceof MeshParticleEmitter === false) {
			console.error('`emitter` argument must be instance of MeshParticleEmitter. Was provided with:', emitter);
			return;
		} else if (this._emitters.indexOf(emitter) > -1) {
			console.error('MeshParticleEmitter already exists in this group. Will not add again.');
			return;
		} else if (emitter.group !== null) {
			console.error('MeshParticleEmitter already belongs to another group. Will not add to requested group.');
			return;
		}

		this._particleCount += emitter.particleCount;

		if (this._particleCount > this.maxParticleCount) {
			console.warn('MeshParticleGroup: maxParticleCount exceeded. Requesting', this._particleCount, 'particles, can support only', this.maxParticleCount);
		}

		emitter.group = this;

		this._emitters.push(emitter);

		this.$updateDefines(emitter);

		return this;
	}

	removeEmitter(emitter) {
		const emitterIndex = this._emitters.indexOf(emitter);

		if (emitter instanceof MeshParticleEmitter === false) {
			console.error('`emitter` argument must be instance of MeshParticleEmitter. Was provided with:', emitter);
			return;
		} else if (emitterIndex === -1) {
			console.error('MeshParticleEmitter does not exist in this group. Will not remove.');
			return;
		}

		this._particleCount -= emitter.particleCount;

		emitter.group = null;

		this._emitters.splice(emitterIndex, 1);

		return this;
	}

	tick(dt, camera) {
		const emitters = this._emitters,
			numEmitters = emitters.length,
			deltaTime = dt || this.fixedTimeStep;

		if (numEmitters === 0) {
			return;
		}

		this._aliveParticleCount = 0;

		for (let i = 0; i < numEmitters; i++) {
			emitters[i].tick(deltaTime, camera);
		}

		this.$instanceBuffer.version++;
		this._geometry.instanceCount = this._aliveParticleCount;
	}

	dispose() {
		this.mesh.geometry.dispose();
		this.mesh.material.dispose();

		for (let i = 0, l = this._emitters.length; i < l; i++) {
			this._emitters[i].group = null;
		}

		this._emitters = [];
		this._particleCount = 0;
		this._aliveParticleCount = 0;

		return this;
	}

	get particleCount() {
		return this._particleCount;
	}

	get aliveParticleCount() {
		return this._aliveParticleCount;
	}

	$updateDefines(emitter) {
		emitter.$updateFlags(this);
	}

	$allocBufferIndex() {
		return this._aliveParticleCount++;
	}

}

function generateInstancedGeometry(geometry, count) {
	const instancedGeometry = geometry.clone();

	const buffer = new t3d.Buffer(new Float32Array(count * 16), 16);
	buffer.usage = t3d.BUFFER_USAGE.DYNAMIC_DRAW;

	const mcol0 = new t3d.Attribute(buffer, 3, 0);
	const mcol1 = new t3d.Attribute(buffer, 3, 3);
	const mcol2 = new t3d.Attribute(buffer, 3, 6);
	const mcol3 = new t3d.Attribute(buffer, 3, 9);
	const colors = new t3d.Attribute(buffer, 4, 12);

	mcol0.divisor = 1;
	mcol1.divisor = 1;
	mcol2.divisor = 1;
	mcol3.divisor = 1;
	colors.divisor = 1;

	instancedGeometry.addAttribute('mcol0', mcol0);
	instancedGeometry.addAttribute('mcol1', mcol1);
	instancedGeometry.addAttribute('mcol2', mcol2);
	instancedGeometry.addAttribute('mcol3', mcol3);
	instancedGeometry.addAttribute('color', colors);

	return instancedGeometry;
}