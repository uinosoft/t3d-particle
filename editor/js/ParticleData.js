export class ParticleData {

	constructor() {
		this._data = createRootData();
	}

	clear() {
		this._data = createRootData();
	}

	createGroup(index = -1) {
		const groupData = createGroupData();

		if (index >= 0) {
			this._data.groups.splice(index, 0, groupData);
		} else {
			this._data.groups.push(groupData);
		}

		return groupData;
	}

	removeGroup(index = -1) {
		if (index >= 0) {
			this._data.groups.splice(index, 1);
		} else {
			this._data.groups.pop();
		}
	}

	pushEmitter(groupData) {
		const emitterData = createEmitterData();

		groupData.emitters.push(emitterData);

		return emitterData;
	}

	popEmitter(groupData) {
		groupData.emitters.pop();
	}

	pushEmitterAttribute(attributeArray, type) {
		const attributeData = createAttributeData(type);

		attributeArray.push(attributeData);

		return attributeData;
	}

	popEmitterAttribute(attributeArray) {
		attributeArray.pop();
	}

	import(data) {
		const oldData = this._data;

		if (oldData.version !== data.version) {
			console.log('convert data version from ' + data.version + ' to ' + oldData.version);
			data.version = oldData.version;
		}

		// TODO validate data

		this._data = data;

		return data;
	}

	export() {
		return this._data;
	}

	getGroupLength() {
		return this._data.groups.length;
	}

}

function createRootData(group = false) {
	const data = {
		'version': '0.0.1',
		'groups': []
	};

	if (group) {
		data.groups.push(createGroupData());
	}

	return data;
}

// Set these in parser
// scale: window.innerHeight / 2.0, // ?
// maxParticleCount: 2000,
// fixedTimeStep
function createGroupData() {
	const data = {
		mode: 0, // 0: Billboard, 1: Mesh

		// only mode 0

		perspective: true,

		// only mode 1

		meshUri: 'BuildIn/Box',

		// common

		textureUri: null,
		textureFrame: [1, 1],
		textureFrameLoop: 1,

		colorize: true,
		transparent: true,
		blending: 'add', // 'none', 'normal', 'add', 'sub', 'mul'
		alphaTest: 0,
		depthWrite: false,
		depthTest: true,
		side: 'front', // 'front', 'back', 'double'
		fog: true,

		emitters: []
	};

	data.emitters.push(createEmitterData());

	return data;
}

function createEmitterData() {
	const data = {
		particleCount: 200,
		isStatic: false,
		direction: 1, // 1: forward, -1: backward
		activeMultiplier: 1.0,

		// only mode 1

		meshAlignment: 0, // 0: Null, 1: FaceCamera, 2: FaceCameraY

		// common

		maxAge: { value: 2.0, spread: 0.0 },
		position: { value: [0, 0, 0], spread: [0, 0, 0], distribution: 1, randomise: false, spreadClamp: [0, 0, 0], radius: 2.0, radiusScale: [1, 1, 1] },
		velocity: { value: [0, 25, 0], spread: [10, 7.5, 10], distribution: 1, randomise: false },
		acceleration: { value: [0, -9.8, 0], spread: [0, 0, 0], distribution: 1, randomise: false },
		drag: { value: 0, spread: 0, randomise: false },
		wiggle: { value: 0, spread: 0 },
		rotation: { axis: [0, 0, 0], axisSpread: [0, 0, 0], angle: 0.0, angleSpread: 0.0, isStatic: false, center: [0, 0, 0], randomise: false },

		color: [],
		opacity: [],
		size: [],
		angle: []
	};

	['color', 'opacity', 'size', 'angle'].forEach(type => {
		data[type].push(createAttributeData(type));
	});

	return data;
}

function createAttributeData(type) {
	switch (type) {
		case 'color':
			return {
				value: [1, 1, 1],
				spread: [0, 0, 0],
				randomise: false
			};
		case 'opacity':
		case 'size':
			return {
				value: 1.0,
				spread: 0.0,
				randomise: false
			};
		case 'angle':
			return {
				value: 0.0,
				spread: 0.0,
				randomise: false
			};
		default:
			console.error('Unknown attribute type: ' + type);
			return null;
	}
}