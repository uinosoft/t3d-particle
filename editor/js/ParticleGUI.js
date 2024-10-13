import { Color3, Vector3 } from 't3d';
import { Pane } from 'tweakpane';
import { importFileJSON, exportFileJSON } from './Utils.js';
import { lang } from './lang.js';

export class ParticleGUI {

	constructor(data, entity) {
		this.data = data;
		this.entity = entity;

		this.root = new Pane();

		this._groupUIs = new WeakMap(); // groupEntity -> groupUI
		this._emitterUIs = new WeakMap(); // emitterEntity -> emitterUI

		this._createRootUI();
	}

	_createRootUI() {
		const { data, entity, root } = this;

		// create group buttons

		const groupButtons = {};

		function setRootButtons() {
			const isEmpty = data.getGroupLength() <= 0;
			groupButtons.removeGroup.disabled = isEmpty;
			groupButtons.exportData.disabled = isEmpty;
		}

		const methods = {
			createGroup: () => {
				const groupData = data.createGroup();
				const groupEntity = entity.createGroup(groupData);

				this._createGroupUI(groupEntity, groupData);

				setRootButtons();
			},
			removeGroup: () => {
				data.removeGroup();
				const groupEntity = entity.removeGroup();

				this._removeGroupUI(groupEntity);

				setRootButtons();
			},
			importData: () => {
				importFileJSON(_data => {
					data.clear();
					const groupEntities = entity.clear();

					groupEntities.forEach(groupEntity => this._removeGroupUI(groupEntity));

					_data = data.import(_data);
					_data.groups.forEach(groupData => {
						const groupEntity = entity.createGroup(groupData);
						this._createGroupUI(groupEntity, groupData);
					});

					setRootButtons();
				});
			},
			exportData: () => {
				exportFileJSON(data.export());
			}
		};

		const buttonNames = ['createGroup', 'removeGroup', 'importData', 'exportData'];
		for (let i = 0; i < buttonNames.length; i++) {
			const name = buttonNames[i];
			groupButtons[name] = root.addButton({ title: lang(name) }).on('click', methods[name]);
		}

		setRootButtons();
	}

	_createGroupUI(groupEntity, groupData) {
		const { data, entity, root } = this;

		const groupFolder = root.addFolder({ title: lang('group') });
		this._groupUIs.set(groupEntity, groupFolder);

		// part1: create main group ui

		let isMeshParticle = !!groupEntity.isMeshParticleGroup;

		const rebuildGroup = () => {
			groupEntity._emitters.forEach(emitterEntity => this._removeEmitterUI(emitterEntity));

			groupEntity = entity.rebuildParticleGroup(groupEntity, groupData);
			isMeshParticle = !!groupEntity.isMeshParticleGroup;
			this._groupUIs.set(groupEntity, groupFolder);

			groupData.emitters.forEach((emitterData, i) => {
				const emitterEntity = groupEntity._emitters[i];
				this._createEmitterUI(groupEntity, emitterEntity, emitterData);
			});

			meshControl.enable(isMeshParticle);
			perspectiveControl.disable(isMeshParticle);
		};
		groupFolder.addBinding(groupData, 'mode', { options: { 'Billboard': 0, 'Mesh': 1 } }).on('change', rebuildGroup);

		const meshControl = groupFolder.addBinding(groupData, 'meshUri', {
			label: lang('mesh'),
			options: { 'Box': 'BuildIn/Box', 'Plane': 'BuildIn/Plane', 'Sphere': 'BuildIn/Sphere' },
			disabled: !isMeshParticle
		}).on('change', rebuildGroup);

		const perspectiveControl = groupFolder.addBinding(groupData, 'perspective', {
			label: lang('perspective'),
			disabled: isMeshParticle
		}).on('change', ({ value }) => {
			if (!isMeshParticle) {
				groupEntity.material.defines['HAS_PERSPECTIVE'] = value;
				groupEntity.material.needsUpdate = true;
			}
		});

		const textureCache = entity._textureCache;
		const textureNames = textureCache.getBuiltInTextureNames();
		const textureOptions = {};
		textureNames.forEach(name => { textureOptions[name] = name });
		groupFolder.addBinding({ value: textureCache.getNameByUri(groupData.textureUri) }, 'value', {
			label: lang('texture'),
			options: textureOptions
		}).on('change', ({ value }) => {
			const textureInfo = textureCache.getBuiltInTexture(value);
			groupEntity.setTextureValue(textureInfo.value);
			groupData.textureUri = textureInfo.uri;
		});

		const textureFramesFolder = groupFolder.addFolder({ title: lang('textureFrames'), expanded: false }).on('change', () => {
			if (isMeshParticle) return;

			groupEntity.textureFrames.fromArray(groupData.textureFrame);
			groupEntity.material.defines['SHOULD_CALCULATE_SPRITE'] = groupData.textureFrame[0] > 1 || groupData.textureFrame[1] > 1;
			groupEntity.material.uniforms.textureAnimation[0] = groupData.textureFrame[0];
			groupEntity.material.uniforms.textureAnimation[1] = groupData.textureFrame[1];

			groupEntity.textureFrameCount = groupData.textureFrame[0] * groupData.textureFrame[1];
			groupEntity.material.uniforms.textureAnimation[2] = groupData.textureFrame[0] * groupData.textureFrame[1];

			groupEntity.textureLoop = groupData.textureFrameLoop;
			groupEntity.material.uniforms.textureAnimation[3] = groupEntity.textureLoop;

			groupEntity.material.needsUpdate = true;
		});
		textureFramesFolder.addBinding(groupData.textureFrame, '0', { min: 1, step: 1, label: lang('frameH') });
		textureFramesFolder.addBinding(groupData.textureFrame, '1', { min: 1, step: 1, label: lang('frameV') });
		textureFramesFolder.addBinding(groupData, 'textureFrameLoop', { min: 1, step: 0.1, label: lang('textureLoop') });

		groupFolder.addBinding(groupData, 'colorize', { label: lang('colorize') }).on('change', ({ value }) => {
			if (!isMeshParticle) {
				groupEntity.material.defines['COLORIZE'] = value;
				groupEntity.material.needsUpdate = true;
			} else {
				groupEntity._emitters.forEach(emitter => {
					emitter.SHOULD_COLORIZE_PARTICLES = value;
				});
			}
		});

		groupFolder.addBinding(groupData, 'transparent', { label: lang('transparent') }).on('change', ({ value }) => {
			groupEntity.material.transparent = value;
		});

		groupFolder.addBinding(groupData, 'blending', {
			label: lang('blending'),
			options: { 'None': 'none', 'Normal': 'normal', 'Add': 'add', 'Sub': 'sub', 'Mul': 'mul' }
		}).on('change', ({ value }) => {
			groupEntity.material.blending = value;
		});

		groupFolder.addBinding(groupData, 'alphaTest', { min: 0, max: 1, step: 0.1, label: lang('alphaTest') }).on('change', ({ value }) => {
			groupEntity.material.alphaTest = value;
			groupEntity.material.needsUpdate = true;
		});

		groupFolder.addBinding(groupData, 'depthWrite', { label: lang('depthWrite') }).on('change', ({ value }) => {
			groupEntity.material.depthWrite = value;
		});

		groupFolder.addBinding(groupData, 'depthTest', { label: lang('depthTest') }).on('change', ({ value }) => {
			groupEntity.material.depthTest = value;
		});

		groupFolder.addBinding(groupData, 'side', {
			label: lang('side'),
			options: { 'Front': 'front', 'Back': 'back', 'Double': 'double' }
		}).on('change', ({ value }) => {
			groupEntity.material.side = value;
		});

		groupFolder.addBinding(groupData, 'fog', { label: lang('fog') }).on('change', ({ value }) => {
			groupEntity.material.fog = value;
			groupEntity.material.needsUpdate = true;
		});

		// part2: create emitter buttons

		const emitterButtons = {};

		function setEmitterButtons() {
			emitterButtons.removeEmitter.disabled = groupData.emitters.length <= 1;
		}

		const methods = {
			'addEmitter': () => {
				const emitterData = data.pushEmitter(groupData);
				const emitterEntity = entity.pushEmitter(emitterData, groupEntity);
				this._createEmitterUI(groupEntity, emitterEntity, emitterData);
				setEmitterButtons();
			},
			'removeEmitter': () => {
				data.popEmitter(groupData);
				const emitterEntity = entity.popEmitter(groupEntity);
				this._removeEmitterUI(emitterEntity);
				setEmitterButtons();
			}
		};

		emitterButtons['addEmitter'] = groupFolder.addButton({ title: lang('addEmitter') }).on('click', methods['addEmitter']);
		emitterButtons['removeEmitter'] = groupFolder.addButton({ title: lang('removeEmitter') }).on('click', methods['removeEmitter']);

		setEmitterButtons();

		// part3: create emitter uis

		groupData.emitters.forEach((emitterData, i) => {
			const emitterEntity = groupEntity._emitters[i];
			this._createEmitterUI(groupEntity, emitterEntity, emitterData);
		});
	}

	_removeGroupUI(groupEntity) {
		const groupUI = this._groupUIs.get(groupEntity);
		groupUI.dispose();
	}

	_createEmitterUI(groupEntity, emitterEntity, emitterData) {
		const { data, entity } = this;

		const root = this._groupUIs.get(groupEntity);
		const emitterFolder = root.addFolder({ title: lang('emitter'), expanded: false });
		this._emitterUIs.set(emitterEntity, emitterFolder);

		const isMeshParticle = !!groupEntity.isMeshParticleGroup;

		emitterFolder.addBinding(emitterData, 'meshAlignment', {
			label: lang('meshAlignment'),
			options: { 'None': 0, 'FaceCamera': 1, 'FaceCameraY': 2 },
			disabled: !isMeshParticle
		}).on('change', ({ value }) => {
			emitterEntity.isLookAtCamera = value == 1;
			emitterEntity.isLookAtCameraOnlyY = value == 2;
		});

		emitterFolder.addBinding(emitterData, 'particleCount', {
			min: 0,
			step: 1,
			label: lang('particleCount')
		}).on('change', ({ value }) => {
			entity.updateParticleCount(groupEntity, emitterEntity, value);
		});

		emitterFolder.addBinding(emitterData, 'isStatic', { label: lang('static') }).on('change', ({ value }) => {
			emitterEntity.isStatic = value;
		});

		emitterFolder.addBinding(emitterData, 'direction', {
			label: lang('direction'),
			options: { 'forward': 1, 'backward': -1 }
		}).on('change', ({ value }) => {
			emitterEntity.direction = value;
		});

		emitterFolder.addBinding(emitterData, 'activeMultiplier', {
			min: 0,
			step: 0.1,
			label: lang('activeMultiplier')
		}).on('change', ({ value }) => {
			emitterEntity.activeMultiplier = value;
		});

		const maxAgeFolder = emitterFolder.addFolder({ title: lang('maxAge'), expanded: false });
		maxAgeFolder.addBinding(emitterData.maxAge, 'value', {
			min: 0,
			step: 0.01,
			label: lang('value')
		}).on('change', ({ value }) => {
			emitterEntity.maxAge.value = value;
			emitterEntity.calculatePPSValue();
		});
		maxAgeFolder.addBinding(emitterData.maxAge, 'spread', {
			min: 0,
			step: 0.01,
			label: lang('spread')
		}).on('change', ({ value }) => {
			emitterEntity.maxAge.spread = value;
			emitterEntity.calculatePPSValue();
		});

		_simpleAttributeUI({
			name: 'position',
			root: emitterFolder,
			attributeData: emitterData.position,
			attributeEntity: emitterEntity.position
		});

		_simpleAttributeUI({
			name: 'velocity',
			root: emitterFolder,
			attributeData: emitterData.velocity,
			attributeEntity: emitterEntity.velocity
		});

		_simpleAttributeUI({
			name: 'acceleration',
			root: emitterFolder,
			attributeData: emitterData.acceleration,
			attributeEntity: emitterEntity.acceleration
		});

		const dragFolder = emitterFolder.addFolder({ title: lang('drag'), expanded: false });
		dragFolder.addBinding(emitterData.drag, 'value', {
			min: 0,
			step: 0.01,
			label: lang('value')
		}).on('change', ({ value }) => {
			emitterEntity.drag.value = value;
		});
		dragFolder.addBinding(emitterData.drag, 'spread', {
			min: 0,
			step: 0.01,
			label: lang('spread')
		}).on('change', ({ value }) => {
			emitterEntity.drag.spread = value;
		});
		dragFolder.addBinding(emitterData.drag, 'randomise', { label: lang('randomise') }).on('change', ({ value }) => {
			emitterEntity.drag.randomise = value;
		});

		const rotationFolder = emitterFolder.addFolder({ title: lang('rotation'), expanded: false });
		rotationFolder.addBinding(emitterData.rotation, 'angle', {
			step: 0.01,
			label: lang('value')
		}).on('change', ({ value }) => {
			emitterEntity.rotation.angle = value;
		});
		rotationFolder.addBinding(emitterData.rotation, 'angleSpread', {
			step: 0.01,
			label: lang('spread')
		}).on('change', ({ value }) => {
			emitterEntity.rotation.angleSpread = value;
		});
		rotationFolder.addBinding({ value: _convertArrayToVector(emitterData.rotation.axis) }, 'value', {
			label: lang('rotationAxis')
		}).on('change', ({ value }) => {
			emitterEntity.rotation.axis.copy(value);
			emitterEntity.rotation.axis = emitterEntity.rotation.axis; // eslint-disable-line
			emitterEntity.rotation.axis.toArray(emitterData.rotation.axis);
		});
		rotationFolder.addBinding({ value: _convertArrayToVector(emitterData.rotation.axisSpread) }, 'value', {
			label: lang('rotationAxisSpread'),
			x: { min: 0 },
			y: { min: 0 },
			z: { min: 0 }
		}).on('change', ({ value }) => {
			emitterEntity.rotation.axisSpread.copy(value);
			emitterEntity.rotation.axisSpread = emitterEntity.rotation.axisSpread; // eslint-disable-line
			emitterEntity.rotation.axisSpread.toArray(emitterData.rotation.axisSpread);
		});
		rotationFolder.addBinding({ value: _convertArrayToVector(emitterData.rotation.center) }, 'value', {
			label: lang('rotationCenter')
		}).on('change', ({ value }) => {
			emitterEntity.rotation.center.copy(value);
			emitterEntity.rotation.center = emitterEntity.rotation.center; // eslint-disable-line
			emitterEntity.rotation.center.toArray(emitterData.rotation.center);
		});
		rotationFolder.addBinding(emitterData.rotation, 'isStatic', { label: lang('static') }).on('change', ({ value }) => {
			emitterEntity.rotation.static = value;
		});
		rotationFolder.addBinding(emitterData.rotation, 'randomise', { label: lang('randomise') }).on('change', ({ value }) => {
			emitterEntity.rotation.randomise = value;
		});

		_arrayAttributeUI({
			name: 'color',
			root: emitterFolder,
			attributeData: emitterData.color,
			attributeEntity: emitterEntity.color,
			data
		});

		_arrayAttributeUI({
			name: 'opacity',
			root: emitterFolder,
			attributeData: emitterData.opacity,
			attributeEntity: emitterEntity.opacity,
			data,
			minValue: 0,
			maxValue: 1
		});

		_arrayAttributeUI({
			name: 'size',
			root: emitterFolder,
			attributeData: emitterData.size,
			attributeEntity: emitterEntity.size,
			data,
			minValue: 0
		});

		_arrayAttributeUI({
			name: 'angle',
			root: emitterFolder,
			attributeData: emitterData.angle,
			attributeEntity: emitterEntity.angle,
			data
		});
	}

	_removeEmitterUI(emitterEntity) {
		const emitterUI = this._emitterUIs.get(emitterEntity);
		emitterUI.dispose();
	}

}

function _simpleAttributeUI(options) {
	const { name, root, attributeData, attributeEntity } = options;

	const folder = root.addFolder({ title: lang(name), expanded: false });

	folder.addBinding(attributeData, 'distribution', {
		label: lang('distribution'),
		options: { Box: 1, Sphere: 2, Disc: 3, Line: 4 }
	}).on('change', ({ value }) => {
		attributeEntity.distribution = value;
	});

	folder.addBinding({ value: _convertArrayToVector(attributeData.value) }, 'value', {
		label: lang('value')
	}).on('change', ({ value }) => {
		attributeEntity.value.copy(value);
		attributeEntity.value = attributeEntity.value; // eslint-disable-line
		attributeEntity.value.toArray(attributeData.value);
	});
	folder.addBinding({ value: _convertArrayToVector(attributeData.spread) }, 'value', {
		label: lang('spread'),
		x: { min: 0 },
		y: { min: 0 },
		z: { min: 0 }
	}).on('change', ({ value }) => {
		attributeEntity.spread.copy(value);
		attributeEntity.spread = attributeEntity.spread; // eslint-disable-line
		attributeEntity.spread.toArray(attributeData.spread);
	});

	folder.addBinding(attributeData, 'randomise', { label: lang('randomise') }).on('change', ({ value }) => {
		attributeEntity.randomise = value;
	});
}

function _arrayAttributeUI(options) {
	const { name, root, attributeData, attributeEntity, minValue, maxValue, data } = options;
	const elementDataArray = attributeData.elements;

	const folder = root.addFolder({ title: lang(name), expanded: false });

	folder.addBinding(attributeData, 'randomise', { label: lang('randomise') }).on('change', ({ value }) => {
		attributeEntity.randomise = value;
	});

	function setButtons() {
		createButton.disabled = elementDataArray.length >= 4;
		removeButton.disabled = elementDataArray.length <= 1;
	}

	const methods = {
		create: function() {
			data.pushEmitterAttribute(elementDataArray, name);
			_updateAttributeEntity();
			_createElementUI(elementDataArray[elementDataArray.length - 1], elementDataArray.length - 1);
			setButtons();
		},
		remove: function() {
			data.popEmitterAttribute(elementDataArray);
			_updateAttributeEntity();
			_removeElementUI();
			setButtons();
		}
	};

	const createButton = folder.addButton({ title: lang('create') }).on('click', methods.create);
	const removeButton = folder.addButton({ title: lang('remove') }).on('click', methods.remove);

	setButtons();

	elementDataArray.forEach(_createElementUI);

	function _createElementUI(elementData, index) {
		const elementFolder = folder.addFolder({ title: lang(name) + '_' + index, expanded: false });

		if (name == 'color') {
			elementFolder.addBinding({ value: _convertArrayToColor(elementData.value) }, 'value', {
				color: { type: 'float' },
				label: lang('value')
			}).on('change', ({ value }) => {
				_updateAttributeEntityByType('value');
				_setColorToArray(value, elementData.value);
			});

			elementFolder.addBinding({ value: _convertArrayToVector(elementData.spread) }, 'value', {
				label: lang('spread'),
				x: { min: 0, max: 1 },
				y: { min: 0, max: 1 },
				z: { min: 0, max: 1 }
			}).on('change', ({ value }) => {
				_updateAttributeEntityByType('spread');
				_setVectorToArray(value, elementData.spread);
			});
		} else {
			elementFolder.addBinding(elementData, 'value', {
				min: minValue,
				max: maxValue,
				label: lang('value')
			}).on('change', () => {
				_updateAttributeEntityByType('value');
			});

			elementFolder.addBinding(elementData, 'spread', {
				min: 0,
				max: maxValue,
				label: lang('spread')
			}).on('change', () => {
				_updateAttributeEntityByType('spread');
			});
		}
	}

	function _removeElementUI() {
		folder.children[folder.children.length - 1].dispose();
	}

	function _updateAttributeEntityByType(type) {
		const array = [];
		elementDataArray.forEach(elementData => {
			const element = elementData[type];
			if (Array.isArray(element)) {
				if (type === 'value') {
					array.push(new Color3().fromArray(element));
				} else {
					array.push(new Vector3().fromArray(element));
				}
			} else {
				array.push(elementData[type]);
			}
		});
		attributeEntity[type] = array;
	}

	const _types = ['value', 'spread'];
	function _updateAttributeEntity() {
		_types.forEach(_updateAttributeEntityByType);
	}
}

function _convertArrayToVector(array) {
	if (array.length === 2) {
		return { x: array[0], y: array[1] };
	} else if (array.length === 3) {
		return { x: array[0], y: array[1], z: array[2] };
	} else {
		return { x: array[0], y: array[1], z: array[2], w: array[3] };
	}
}

function _convertArrayToColor(array) {
	return { r: array[0], g: array[1], b: array[2] };
}

function _setVectorToArray(vector, target) {
	target[0] = vector.x;
	target[1] = vector.y;
	if (vector.z) target[2] = vector.z;
	if (vector.w) target[3] = vector.w;
}

function _setColorToArray(color, target) {
	target[0] = color.r;
	target[1] = color.g;
	target[2] = color.b;
}