import { Color3, Vector3 } from 't3d';
import { GUI } from 'lil-gui';
import { importFileJSON, exportFileJSON } from './Utils.js';
import { lang } from './lang.js';
import { LabelGroup, TextInput, Button, Panel, VectorInput, BooleanInput, ColorPicker, GradientPicker, NumericInput, SelectInput, SliderInput, ArrayInput } from '@playcanvas/pcui';
import '@playcanvas/pcui/styles';

export class ParticleGUI {

	constructor(data, entity) {
		this.data = data;
		this.entity = entity;

		const panel = new Panel({
			headerText: 'Particle Editor',
			collapsible: true,
			width: 300,
			scrollable: true,
			collapseHorizontally: true,
			class: 'root-panel'
		});
		document.body.appendChild(panel.dom);

		panel.append(
			new LabelGroup({
				text: 'TextInput',
				field: new TextInput({ placeholder: 'Enter text' })
			})
		);

		panel.append(
			new LabelGroup({
				text: 'Button',
				field: new Button({ text: 'Click Me' })
			})
		);

		panel.append(
			new LabelGroup({
				text: 'VectorInput',
				field: new VectorInput({ placeholder: ['X', 'Y', 'Z'], value: [1, 2, 3] })
			})
		);

		panel.append(
			new LabelGroup({
				enabled: false,
				text: 'BooleanInput',
				field: new BooleanInput({ value: true })
			})
		);

		const panel2 = new Panel({ headerText: 'Particle Group', collapsible: true });
		panel.append(panel2);

		const array = [
			[1, 2, 3],
			[3, 2, 1]
		];
		const elementArgs = {
			placeholder: ['X', 'Y', 'Z']
		};
		panel2.append(
			new LabelGroup({
				text: 'ArrayInput',
				field: new ArrayInput({ type: 'vec3', value: array, elementArgs })
			})
		);

		panel2.append(
			new LabelGroup({
				text: 'Button',
				field: new Button({ icon: 'E124', text: 'delete' })
			})
		);

		const panel3 = new Panel({ headerText: 'Particle Emitter', collapsible: true });
		panel.append(panel3);

		panel3.append(
			new LabelGroup({
				text: 'ColorPicker',
				field: new ColorPicker({ value: [1, 1, 0] })
			})
		);


		const keys = [
			[
				0, 1,
				1, 0
			],
			[
				0, 0,
				1, 0
			],
			[
				0, 0,
				1, 1
			]
		];
		panel3.append(
			new LabelGroup({
				text: 'GradientPicker',
				field: new GradientPicker({ value: { betweenCurves: false, keys, type: 4 } })
			})
		);

		panel3.append(
			new LabelGroup({
				text: 'NumberInput',
				field: new NumericInput({ value: 0, min: 0, max: 1, step: 0.1 })
			})
		);

		panel3.append(
			new LabelGroup({
				text: 'SelectInput',
				field: new SelectInput({ value: 1, options: [{ v: 1, t: 'A' }, { v: 2, t: 'B' }] })
			})
		);

		panel3.append(
			new LabelGroup({
				text: 'SliderInput',
				field: new SliderInput({ value: 0, min: 0, max: 1, step: 0.1 })
			})
		);



		this.root = new GUI({ title: 'Particle Editor' });

		this._groupUIs = new WeakMap(); // groupEntity -> groupUI
		this._emitterUIs = new WeakMap(); // emitterEntity -> emitterUI

		this._createRootUI();
	}

	_createRootUI() {
		const { data, entity, root } = this;

		// create group buttons

		const groupButtons = {};

		function setRootButtons() {
			const notEmpty = data.getGroupLength() > 0;
			groupButtons.removeGroup.enable(notEmpty);
			groupButtons.exportData.enable(notEmpty);
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
			groupButtons[name] = root.add(methods, name).name(lang(name));
		}

		setRootButtons();
	}

	_createGroupUI(groupEntity, groupData) {
		const { data, entity, root } = this;

		const groupFolder = root.addFolder(lang('group'));
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
		groupFolder.add(groupData, 'mode', { 'Billboard': 0, 'Mesh': 1 }).onChange(rebuildGroup);

		const meshControl = groupFolder.add(groupData, 'meshUri', ['BuildIn/Box', 'BuildIn/Plane', 'BuildIn/Sphere']).name(lang('mesh')).onChange(rebuildGroup);
		meshControl.enable(isMeshParticle);

		const perspectiveControl = groupFolder.add(groupData, 'perspective').name(lang('perspective')).onChange(value => {
			if (!isMeshParticle) {
				groupEntity.material.defines['HAS_PERSPECTIVE'] = value;
				groupEntity.material.needsUpdate = true;
			}
		});
		perspectiveControl.disable(isMeshParticle);

		const textureCache = entity._textureCache;
		const textureNames = textureCache.getBuiltInTextureNames();
		groupFolder.add({ value: textureCache.getNameByUri(groupData.textureUri) }, 'value', textureNames).name(lang('texture')).onChange(value => {
			const textureInfo = textureCache.getBuiltInTexture(value);
			groupEntity.setTextureValue(textureInfo.value);
			groupData.textureUri = textureInfo.uri;
		});

		const textureFramesFolder = groupFolder.addFolder(lang('textureFrames')).onChange(() => {
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
		}).close();
		textureFramesFolder.add(groupData.textureFrame, '0', 1, 10, 1).name(lang('frameH'));
		textureFramesFolder.add(groupData.textureFrame, '1', 1, 10, 1).name(lang('frameV'));
		textureFramesFolder.add(groupData, 'textureFrameLoop', 1, 5, 0.1).name(lang('textureLoop'));

		groupFolder.add(groupData, 'colorize').name(lang('colorize')).onChange(value => {
			if (!isMeshParticle) {
				groupEntity.material.defines['COLORIZE'] = value;
				groupEntity.material.needsUpdate = true;
			} else {
				groupEntity._emitters.forEach(emitter => {
					emitter.SHOULD_COLORIZE_PARTICLES = value;
				});
			}
		});

		groupFolder.add(groupData, 'transparent').name(lang('transparent')).onChange(value => {
			groupEntity.material.transparent = value;
		});

		groupFolder.add(groupData, 'blending', ['none', 'normal', 'add', 'sub', 'mul']).name(lang('blending')).onChange(value => {
			groupEntity.material.blending = value;
		});

		groupFolder.add(groupData, 'alphaTest', 0, 1, 0.1).name(lang('alphaTest')).onChange(value => {
			groupEntity.material.alphaTest = value;
			groupEntity.material.needsUpdate = true;
		});

		groupFolder.add(groupData, 'depthWrite').name(lang('depthWrite')).onChange(value => {
			groupEntity.material.depthWrite = value;
		});

		groupFolder.add(groupData, 'depthTest').name(lang('depthTest')).onChange(value => {
			groupEntity.material.depthTest = value;
		});

		groupFolder.add(groupData, 'side', ['front', 'back', 'double']).name(lang('side')).onChange(value => {
			groupEntity.material.side = value;
		});

		groupFolder.add(groupData, 'fog').name(lang('fog')).onChange(value => {
			groupEntity.material.fog = value;
			groupEntity.material.needsUpdate = true;
		});

		// part2: create emitter buttons

		const emitterButtons = {};

		function setEmitterButtons() {
			emitterButtons.removeEmitter.enable(groupData.emitters.length > 1);
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

		emitterButtons['addEmitter'] = groupFolder.add(methods, 'addEmitter').name(lang('addEmitter'));
		emitterButtons['removeEmitter'] = groupFolder.add(methods, 'removeEmitter').name(lang('removeEmitter'));

		setEmitterButtons();

		// part3: create emitter uis

		groupData.emitters.forEach((emitterData, i) => {
			const emitterEntity = groupEntity._emitters[i];
			this._createEmitterUI(groupEntity, emitterEntity, emitterData);
		});
	}

	_removeGroupUI(groupEntity) {
		const groupUI = this._groupUIs.get(groupEntity);
		groupUI.destroy();
	}

	_createEmitterUI(groupEntity, emitterEntity, emitterData) {
		const { data, entity } = this;

		const root = this._groupUIs.get(groupEntity);
		const emitterFolder = root.addFolder(lang('emitter')).close();
		this._emitterUIs.set(emitterEntity, emitterFolder);

		// part1: create main emitter ui

		const isMeshParticle = !!groupEntity.isMeshParticleGroup;

		emitterFolder.add(emitterData, 'meshAlignment', { 'None': 0, 'FaceCamera': 1, 'FaceCameraY': 2 }).name(lang('meshAlignment')).onChange(value => {
			emitterEntity.isLookAtCamera = value == 1;
			emitterEntity.isLookAtCameraOnlyY = value == 2;
		}).enable(isMeshParticle);

		emitterFolder.add(emitterData, 'particleCount', 0, 500, 1).name(lang('particleCount')).onFinishChange(value => {
			entity.updateParticleCount(groupEntity, emitterEntity, value);
		});

		emitterFolder.add(emitterData, 'isStatic').name(lang('static')).onChange(value => {
			emitterEntity.isStatic = value;
		});

		emitterFolder.add(emitterData, 'direction', { 'forward': 1, 'backward': -1 }).name(lang('direction')).onChange(value => {
			emitterEntity.direction = value;
		});

		emitterFolder.add(emitterData, 'activeMultiplier', 0, 2, 0.1).name(lang('activeMultiplier')).onChange(value => {
			emitterEntity.activeMultiplier = value;
		});

		const maxAgeFolder = emitterFolder.addFolder(lang('maxAge')).close();
		maxAgeFolder.add(emitterData.maxAge, 'value', 0, 10).name(lang('value')).onFinishChange(value => {
			emitterEntity.maxAge.value = value;
			emitterEntity.calculatePPSValue();
		});
		maxAgeFolder.add(emitterData.maxAge, 'spread', 0, 10, 0.01).name(lang('spread')).onFinishChange(value => {
			emitterEntity.maxAge.spread = value;
			emitterEntity.calculatePPSValue();
		});

		_simpleAttributeUI({
			name: 'position',
			root: emitterFolder,
			attributeData: emitterData.position,
			attributeEntity: emitterEntity.position,
			maxValue: 100
		});

		_simpleAttributeUI({
			name: 'velocity',
			root: emitterFolder,
			attributeData: emitterData.velocity,
			attributeEntity: emitterEntity.velocity,
			maxValue: 50
		});

		_simpleAttributeUI({
			name: 'acceleration',
			root: emitterFolder,
			attributeData: emitterData.acceleration,
			attributeEntity: emitterEntity.acceleration,
			maxValue: 50
		});

		const dragFolder = emitterFolder.addFolder(lang('drag')).close();
		dragFolder.add(emitterData.drag, 'value', 0, 50, 0.01).name(lang('value')).onChange(value => {
			emitterEntity.drag.value = value;
		});
		dragFolder.add(emitterData.drag, 'spread', 0, 50, 0.01).name(lang('spread')).onChange(value => {
			emitterEntity.drag.spread = value;
		});
		dragFolder.add(emitterData.drag, 'randomise').name(lang('randomise')).onChange(value => {
			emitterEntity.drag.randomise = value;
		});

		const rotationFolder = emitterFolder.addFolder(lang('rotation')).close();
		const rotationAxisValueFolder = rotationFolder.addFolder(lang('rotationAxis')).close();
		const rotationAxisSpreadFolder = rotationFolder.addFolder(lang('rotationAxisSpread')).close();
		const rotationCenterFolder = rotationFolder.addFolder(lang('rotationCenter')).close();
		['x', 'y', 'z'].forEach((axisName, i) => {
			rotationAxisValueFolder.add(emitterData.rotation.axis, i + '', -1, 1).name(axisName).onChange(value => {
				emitterEntity.rotation.axis[axisName] = value;
				emitterEntity.rotation.axis = emitterEntity.rotation.axis; // eslint-disable-line
			});
			rotationAxisSpreadFolder.add(emitterData.rotation.axisSpread, i + '', 0, 1).name(axisName).onChange(value => {
				emitterEntity.rotation.axisSpread[axisName] = value;
				emitterEntity.rotation.axisSpread = emitterEntity.rotation.axisSpread; // eslint-disable-line
			});
			rotationCenterFolder.add(emitterData.rotation.center, i + '', -50, 50).name(axisName).onChange(value => {
				emitterEntity.rotation.center[axisName] = value;
				emitterEntity.rotation.center = emitterEntity.rotation.center; // eslint-disable-line
			});
		});
		rotationFolder.add(emitterData.rotation, 'angle', 0, 6.28, 0.01).name(lang('value')).onChange(value => {
			emitterEntity.rotation.angle = value;
		});
		rotationFolder.add(emitterData.rotation, 'angleSpread', 0, 6.28, 0.01).name(lang('spread')).onChange(value => {
			emitterEntity.rotation.angleSpread = value;
		});
		rotationFolder.add(emitterData.rotation, 'isStatic').name(lang('static')).onChange(value => {
			emitterEntity.rotation.static = value;
		});
		rotationFolder.add(emitterData.rotation, 'randomise').name(lang('randomise')).onChange(value => {
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
			minValue: 0,
			maxValue: 100
		});

		_arrayAttributeUI({
			name: 'angle',
			root: emitterFolder,
			attributeData: emitterData.angle,
			attributeEntity: emitterEntity.angle,
			data,
			minValue: -6.28,
			maxValue: 6.28
		});
	}

	_removeEmitterUI(emitterEntity) {
		const emitterUI = this._emitterUIs.get(emitterEntity);
		emitterUI.destroy();
	}

}

function _simpleAttributeUI(options) {
	const { name, root, attributeData, attributeEntity, maxValue } = options;

	const folder = root.addFolder(lang(name)).close();

	folder.add(attributeData, 'distribution', { Box: 1, Sphere: 2, Disc: 3, Line: 4 }).name(lang('distribution')).onChange(value => {
		attributeEntity.distribution = value;
	});

	const valueFolder = folder.addFolder(lang('value')).close();
	const spreadFolder = folder.addFolder(lang('spread')).close();
	['x', 'y', 'z'].forEach((axisName, i) => {
		valueFolder.add(attributeData.value, i + '', -maxValue, maxValue).name(axisName).onChange(value => {
			attributeEntity.value[axisName] = value;
			attributeEntity.value = attributeEntity.value; // eslint-disable-line
		});
		spreadFolder.add(attributeData.spread, i + '', 0, maxValue).name(axisName).onChange(value => {
			attributeEntity.spread[axisName] = value;
            attributeEntity.spread = attributeEntity.spread; // eslint-disable-line
		});
	});

	folder.add(attributeData, 'randomise').name(lang('randomise')).onChange(value => {
		attributeEntity.randomise = value;
	});
}

function _arrayAttributeUI(options) {
	const { name, root, attributeData, attributeEntity, minValue, maxValue, data } = options;
	const elementDataArray = attributeData.elements;

	const folder = root.addFolder(lang(name)).close();

	folder.add(attributeData, 'randomise').name(lang('randomise')).onChange(value => {
		attributeEntity.randomise = value;
	});

	function setButtons() {
		createButton.enable(elementDataArray.length < 4);
		removeButton.enable(elementDataArray.length > 1);
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

	const createButton = folder.add(methods, 'create').name(lang('create'));
	const removeButton = folder.add(methods, 'remove').name(lang('remove'));

	setButtons();

	elementDataArray.forEach(_createElementUI);

	function _createElementUI(elementData, index) {
		const elementFolder = folder.addFolder(lang(name) + '_' + index).close();

		if (name == 'color') {
			elementFolder.addColor(elementData, 'value').name(lang('value')).onChange(() => {
				_updateAttributeEntityByType('value');
			});

			const spreadFolder = elementFolder.addFolder(lang('spread')).close().onChange(() => {
				_updateAttributeEntityByType('spread');
			});
			['x', 'y', 'z'].forEach((axisName, i) => {
				spreadFolder.add(elementData.spread, i + '', 0, 1).name(axisName);
			});
		} else {
			elementFolder.add(elementData, 'value', minValue, maxValue).name(lang('value')).onChange(() => {
				_updateAttributeEntityByType('value');
			});

			elementFolder.add(elementData, 'spread', Math.max(minValue, 0), maxValue).name(lang('spread')).onChange(() => {
				_updateAttributeEntityByType('spread');
			});
		}
	}

	function _removeElementUI() {
		folder.folders[folder.folders.length - 1].destroy();
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