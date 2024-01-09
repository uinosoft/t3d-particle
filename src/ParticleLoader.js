import { Color3, FileLoader, Loader, Vector3, Vector2, Object3D, Geometry, Attribute, Buffer, BoxGeometry, SphereGeometry } from 't3d';
import { ParticleGroup } from './core/ParticleGroup.js';
import { MeshParticleGroup } from './core/MeshParticleGroup.js';
import { MeshParticleEmitter } from './core/MeshParticleEmitter.js';
import { ParticleEmitter } from './core/ParticleEmitter.js';

/**
 * Loads particle groups from JSON file which is exported from Particle Editor.
 */
export class ParticleLoader extends Loader {

	constructor(manager) {
		super(manager);

		this.geometries = {
			Plane: new ParticlePlaneGeometry(1, 1),
			Box: new BoxGeometry(1, 1, 1),
			Sphere: new SphereGeometry(1, 20, 20)
		};

		this._textureLoader = null;
	}

	setTextureLoader(textureLoader) {
		this._textureLoader = textureLoader;
		return this;
	}

	load(url, onLoad, onProgress, onError) {
		const scope = this;

		const loader = new FileLoader(scope.manager);
		loader.setPath(scope.path);
		loader.setResponseType('json');
		loader.setRequestHeader(scope.requestHeader);
		loader.setWithCredentials(scope.withCredentials);

		loader.load(url, json => {
			try {
				const result = scope.parse(json);
				result.json = json;
				onLoad(result);
			} catch (e) {
				if (onError) {
					onError(e);
				} else {
					console.error(e);
				}

				scope.manager.itemError(url);
			}
		}, onProgress, onError);
	}

	parse(json) {
		const result = {};
		result.groups = [];
		result.root = new Object3D();

		json.groups.forEach(groupJson => {
			const group = this.parseParticleGroup(groupJson);
			result.groups.push(group);
			result.root.add(group.mesh);
		});

		return result;
	}

	parseParticleCount(groupJson) {
		let count = 0;
		groupJson.emitters.forEach(emitterJson => {
			count += emitterJson.particleCount;
		});
		return count;
	}

	parseParticleGroup(groupJson, maxParticleCount = 2000) {
		const isMeshParticle = groupJson.mode == 1;

		const options = this._convertGroupData(groupJson);

		if (maxParticleCount) {
			options.maxParticleCount = maxParticleCount;
		} else {
			options.maxParticleCount = this.parseParticleCount(groupJson);
		}

		let particleGroup;

		if (isMeshParticle) {
			particleGroup = new MeshParticleGroup(options);
			particleGroup.isMeshParticleGroup = true;
		} else {
			particleGroup = new ParticleGroup(options);
			particleGroup.isParticleGroup = true;
		}

		// emitters

		groupJson.emitters.forEach(emitterJson => {
			particleGroup.addEmitter(this.parseParticleEmitter(emitterJson, isMeshParticle));
		});

		return particleGroup;
	}

	parseParticleEmitter(emitterJson, isMeshParticle = false) {
		const options = this._convertEmitterData(emitterJson);

		let particleEmitter;

		if (isMeshParticle) {
			particleEmitter = new MeshParticleEmitter(options);
			particleEmitter.isMeshParticleEmitter = true;
		} else {
			particleEmitter = new ParticleEmitter(options);
			particleEmitter.isParticleEmitter = true;
		}

		return particleEmitter;
	}

	_convertGroupData(source) {
		const geometries = this.geometries;
		const textureLoader = this._textureLoader;

		const data = {};

		const isMeshParticle = source.mode == 1;

		if (isMeshParticle) {
			let uri = source.meshUri;

			if (uri.startsWith('BuildIn/')) {
				uri = uri.substring(8);
			} else {
				console.warn('Mesh particle group only support built-in geometries for now.');
			}

			data.geometry = geometries[uri] || geometries.Plane;
		} else {
			data.hasPerspective = source.perspective;
		}

		data.texture = { value: null };
		if (source.textureUri) {
			if (!textureLoader) {
				console.warn('ParticleLoader: No texture loader is set. Use `ParticleLoader.setTextureLoader` to set one.');
			} else {
				data.texture.value = textureLoader.load(source.textureUri);
			}
		}
		data.texture.frames = new Vector2().fromArray(source.textureFrame);
		data.texture.loop = source.textureFrameLoop;

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

	_convertEmitterData(source) {
		const data = {};

		data.particleCount = source.particleCount;
		data.isStatic = source.isStatic;
		data.direction = source.direction;
		data.activeMultiplier = source.activeMultiplier;

		data.isLookAtCamera = source.meshAlignment == 1;
		data.isLookAtCameraOnlyY = source.meshAlignment == 2;

		const simpleKeys = ['maxAge', 'position', 'velocity', 'acceleration', 'drag', 'wiggle', 'rotation'];

		simpleKeys.forEach(key => {
			data[key] = this._convertSimpleAttributeData(source[key]);
		});

		const arrayKeys = ['color', 'opacity', 'size', 'angle'];

		arrayKeys.forEach(key => {
			data[key] = this._convertArrayAttributeData(source[key]);
		});

		return data;
	}

	_convertSimpleAttributeData(source) {
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

	_convertArrayAttributeData(source) {
		const value = [], spread = [];
		source.elements.forEach(element => {
			value.push(Array.isArray(element.value) ? new Color3().fromArray(element.value) : element.value);
			spread.push(Array.isArray(element.spread) ? new Vector3().fromArray(element.spread) : element.spread);
		});
		return { value, spread, randomise: source.randomise };
	}

}

class ParticlePlaneGeometry extends Geometry {

	constructor() {
		super();

		this.addAttribute('a_Position', new Attribute(new Buffer(new Float32Array([
			-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0
		]), 3)));
		this.addAttribute('a_Uv', new Attribute(new Buffer(new Float32Array([
			0, 1, 1, 1, 0, 0, 1, 0
		]), 2)));
		this.addAttribute('a_Normal', new Attribute(new Buffer(new Float32Array([
			0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1
		]), 3)));
		this.setIndex(new Attribute(new Buffer(new Uint16Array([
			0, 2, 1, 2, 3, 1
		]), 1)));

		this.computeBoundingBox();
		this.computeBoundingSphere();
	}

}