import { Object3D, PlaneGeometry, BoxGeometry, SphereGeometry, Matrix4, Color3, Vector3, Vector2 } from 't3d';
import { Texture2DLoader } from 't3d/addons/loaders/Texture2DLoader.js';
import { GeometryUtils } from 't3d/addons/geometries/GeometryUtils.js';
import { ParticleGroup, MeshParticleGroup, ParticleEmitter, MeshParticleEmitter } from 't3d-particle';

export class ParticleEntity extends Object3D {

	constructor() {
		super();

		this._geometryCache = new GeometryCache();
		this._textureCache = new TextureCache();

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
		const isMeshParticle = groupData.mode == 1;

		const options = _convertGroupData(groupData, this._geometryCache, this._textureCache);

		let particleGroup;

		if (isMeshParticle) {
			particleGroup = new MeshParticleGroup(options);
			particleGroup.isMeshParticleGroup = true;
		} else {
			particleGroup = new ParticleGroup(options);
		}

		if (index >= 0) {
			this.children.splice(index, 0, particleGroup.mesh);
			this._particleGroups.splice(index, 0, particleGroup);
		} else {
			this.add(particleGroup.mesh);
			this._particleGroups.push(particleGroup);
		}

		// emitters

		groupData.emitters.forEach(emitterData => {
			this.pushEmitter(emitterData, particleGroup);
		});

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

		const options = _convertEmitterData(emitterData);

		let emitter;

		if (isMeshParticle) {
			emitter = new MeshParticleEmitter(options);
		} else {
			emitter = new ParticleEmitter(options);
		}

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

// Resource caches

class GeometryCache {

	constructor() {
		this._builtInGeometries = {
			Plane: new PlaneGeometry(1, 1),
			Box: new BoxGeometry(1, 1, 1),
			Sphere: new SphereGeometry(1, 20, 20)
		};
		GeometryUtils.applyMatrix4(this._builtInGeometries.Plane, _planeRotationMatrix, true);
	}

	get(uri) {
		if (uri.startsWith('BuildIn/')) {
			uri = uri.substring(8);
		} else {
			console.warn('Mesh particle group only support built-in geometries for now.');
		}
		return this._builtInGeometries[uri] || this._builtInGeometries.Plane;
	}

}

const _planeRotationMatrix = new Matrix4().set(
	1, 0, 0, 0,
	0, 0, -1, 0,
	0, 1, 0, 0,
	0, 0, 0, 1
);

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

// Convert methods

function _convertGroupData(source, geometries, textures) {
	const data = {};

	data.maxParticleCount = 2000; // TODO remove this limit ?

	const isMeshParticle = source.mode == 1;

	if (isMeshParticle) {
		data.geometry = geometries.get(source.meshUri);
	} else {
		data.hasPerspective = source.perspective;
	}

	data.texture = {
		value: textures.getBuiltInTexture(textures.getNameByUri(source.textureUri)).value,
		frames: new Vector2().fromArray(source.textureFrame),
		loop: source.textureFrameLoop
	};

	data.colorize = source.colorize;
	data.transparent = source.transparent;
	data.blending = source.blending;
	data.alphaTest = source.alphaTest;
	data.depthWrite = source.depthWrite;
	data.depthTest = source.depthTest;
	data.side = source.side;
	data.fog = source.fog;

	return data;
}

function _convertEmitterData(source) {
	const data = {};

	data.particleCount = source.particleCount;
	data.isStatic = source.isStatic;
	data.direction = source.direction;
	data.activeMultiplier = source.activeMultiplier;

	data.isLookAtCamera = source.meshAlignment == 1;
	data.isLookAtCameraOnlyY = source.meshAlignment == 2;

	const simpleKeys = ['maxAge', 'position', 'velocity', 'acceleration', 'drag', 'wiggle', 'rotation'];

	simpleKeys.forEach(key => {
		data[key] = _convertSimpleAttributeData(source[key]);
	});

	const arrayKeys = ['color', 'opacity', 'size', 'angle'];

	arrayKeys.forEach(key => {
		data[key] = _convertArrayAttributeData(source[key]);
	});

	return data;
}

function _convertSimpleAttributeData(source) {
	const data = {};
	Object.keys(source).forEach(key => {
		const value = source[key];
		if (Array.isArray(value)) {
			data[key] = new Vector3().fromArray(value);
		} else {
			data[key] = value;
		}
	});
	return data;
}

function _convertArrayAttributeData(source) {
	const value = [], spread = [];
	source.elements.forEach(element => {
		value.push(Array.isArray(element.value) ? new Color3().fromArray(element.value) : element.value);
		spread.push(Array.isArray(element.spread) ? new Vector3().fromArray(element.spread) : element.spread);
	});
	return { value, spread, randomise: source.randomise };
}