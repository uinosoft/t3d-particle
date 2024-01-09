import { Object3D } from 't3d';
import { Texture2DLoader } from 't3d/addons/loaders/Texture2DLoader.js';
import { ParticleLoader } from 't3d-particle';

export class ParticleEntity extends Object3D {

	constructor() {
		super();

		this._textureCache = new TextureCache();

		// Use particle loader to parse particle data
		this._particleLoader = new ParticleLoader();
		this._particleLoader.setTextureLoader({
			load: uri => this._textureCache.getBuiltInTexture(this._textureCache.getNameByUri(uri)).value
		});

		this._particleGroups = [];
	}

	clear() {
		this._particleGroups.forEach(particleGroup => {
			particleGroup.dispose();
			this.remove(particleGroup.mesh);
		});

		const particleGroups = this._particleGroups.slice(0);

		this._particleGroups.length = 0;

		return particleGroups;
	}

	createGroup(groupData, index = -1) {
		const particleGroup = this._particleLoader.parseParticleGroup(groupData, 2000);

		if (index >= 0) {
			this.children.splice(index, 0, particleGroup.mesh);
			this._particleGroups.splice(index, 0, particleGroup);
		} else {
			this.add(particleGroup.mesh);
			this._particleGroups.push(particleGroup);
		}

		return particleGroup;
	}

	removeGroup(index = -1) {
		let particleGroup;

		if (index >= 0) {
			particleGroup = this._particleGroups.splice(index, 1)[0];
		} else {
			particleGroup = this._particleGroups.pop();
		}

		if (particleGroup) {
			particleGroup.dispose();
			this.remove(particleGroup.mesh);
		}

		return particleGroup;
	}

	pushEmitter(emitterData, particleGroup) {
		const isMeshParticle = particleGroup.isMeshParticleGroup;

		const emitter = this._particleLoader.parseParticleEmitter(emitterData, isMeshParticle);

		particleGroup.addEmitter(emitter);

		return emitter;
	}

	popEmitter(particleGroup) {
		const emitters = particleGroup._emitters;

		if (emitters.length === 0) return;

		const lastEmitter = emitters[emitters.length - 1];

		particleGroup.removeEmitter(lastEmitter);

		return lastEmitter;
	}

	updateParticleCount(particleGroup, emitter, particleCount) {
		const emitters = particleGroup._emitters.slice(0);

		// update particle group buffer size and do not change emitter's order
		emitters.forEach(emitter => particleGroup.removeEmitter(emitter));

		emitter.particleCount = particleCount;

		emitters.forEach(emitter => {
			emitter.calculatePPSValue();
			particleGroup.addEmitter(emitter);
		});
	}

	rebuildParticleGroup(particleGroup, groupData) {
		const index = this._particleGroups.indexOf(particleGroup);

		this._particleGroups.splice(index, 1);
		particleGroup.dispose();
		this.remove(particleGroup.mesh);

		particleGroup = this.createGroup(groupData, index);

		return particleGroup;
	}

	update(camera) {
		this._particleGroups.forEach(particleGroup => particleGroup.tick(undefined, camera));
	}

}

// Texture caches
class TextureCache {

	constructor() {
		this._builtInTextures = {
			'empty': { uri: null, value: null },
			'smoke1': { uri: '../examples/resources/img/smokeparticle.png', value: null },
			'point': { uri: 'https://static.3dmomoda.com/textures/181009160bscjqf1tmbysoz2uvtuvilz.jpg', value: null },
			'fire': { uri: 'https://static.3dmomoda.com/textures/18100916vuhgsdtljucvrysf9wftwufb.jpg', value: null },
			'smoke2': { uri: 'https://static.3dmomoda.com/textures/18100916fmqvpceomi9sxmao1pvicn2n.png', value: null },
			'star': { uri: 'http://static.3dmomoda.com/textures/18092617nyspq5moaka1i2fhvs1hh66s.png', value: null },
			'cloud': { uri: '../examples/resources/img/cloud.png', value: null },
			'flame': { uri: '../examples/resources/img/sprite-flame2.jpg', value: null }
		};

		this._textureLoader = new Texture2DLoader();
	}

	get(uri) {
		// TODO cache textures
		if (uri) {
			return this._textureLoader.load(uri);
		} else {
			return null;
		}
	}

	getBuiltInTextureNames() {
		return Object.keys(this._builtInTextures);
	}

	getNameByUri(uri) {
		for (const name in this._builtInTextures) {
			if (this._builtInTextures[name].uri === uri) {
				return name;
			}
		}

		return 'empty';
	}

	getBuiltInTexture(name) {
		const info = this._builtInTextures[name];

		if (info.value === null && info.uri !== null) {
			info.value = this._textureLoader.load(info.uri);
		}

		return info;
	}

}