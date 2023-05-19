import { Mesh, ShaderMaterial, Geometry, Attribute, Buffer } from 't3d';
import { InfiniteGridShader } from 't3d/addons/shaders/InfiniteGridShader.js';

export class Grid extends Mesh {

	constructor() {
		const gridgeometry = new Geometry();
		gridgeometry.addAttribute('a_Position', new Attribute(new Buffer(new Float32Array(geometryData.positions), 3)));
		gridgeometry.addAttribute('a_Normal', new Attribute(new Buffer(new Float32Array(geometryData.normals), 3)));
		gridgeometry.setIndex(new Attribute(new Buffer(new Uint16Array([2, 1, 0, 5, 4, 3]), 1)));

		const gridmaterial = new ShaderMaterial(InfiniteGridShader);
		gridmaterial.transparent = true;
		gridmaterial.depthWrite = false;
		gridmaterial.defines.USE_LINEARFADE = true;

		gridmaterial.uniforms.primaryScale = 10;
		gridmaterial.uniforms.secondaryScale = 1;
		gridmaterial.uniforms.primaryFade = 0.7;
		gridmaterial.uniforms.secondaryFade = 0.4;
		gridmaterial.uniforms.end = 100;

		super(gridgeometry, gridmaterial);

		this.frustumCulled = false;

		this.renderOrder = -100;
	}

}

const geometryData = {
	positions: [
		1, 1, 0,
		-1, -1, 0,
		-1, 1, 0,
		-1, -1, 0,
		1, 1, 0,
		1, -1, 0
	],
	normals: [
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1
	]
};