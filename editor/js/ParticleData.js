import * as t3d from 't3d';
class ParticleData {

	constructor() {
		this.listGroups = new Array();
		this.listGroups[0] = new ParticleGroupData();
	}

	reset() {
		this.listGroups.length = 0;
		this.listGroups[0] = new ParticleGroupData();
	}

}

class ParticleGroupData {

	constructor() {
		this.texture = new GroupTexture();
		this.fixedTimeStep = 0.33;
		this.useMesh = false;
		this.meshUrl = "BuildIn/Plane";

		this.hasPerspective = true;
		this.isColorize = true;
		this.blendingMode = "add";
		this.isTransparent = true;
		this.alphaTest = 0.0;
		this.isDepthWrite = false;
		this.isDepthTest = false;
		this.isFog = false;
		this.scale = window.innerHeight / 2.0;
		this.maxParticleCount = 2000;
		this.vec4Quaternion = new t3d.Vector4(0, 0, 0, 1);

		this.listEmitters = new Array();
		this.listEmitters[0] = new ParticleEmitterData();
	}

}

class ParticleEmitterData {

	constructor() {
		this.distribution = 1;
		this.particleCount = 1000;
		this.duration = -1;
		this.isStatic = false;
		this.isLookAtCamera = false;
		this.isLookAtCameraOnlyY = false;
		this.activeMultiplier = 1.0;
		this.direction = 1;

		this.maxAge = new MaxAge();
		this.position = new Position();
		this.velocity = new Velocity();
		this.acceleration = new Acceleration();
		this.drag = new Drag();
		this.wiggle = new Wiggle();
		this.rotation = new Rotation();

		this.listColor = new Array();
		this.listColor[0] = new Color();

		this.listOpacity = new Array();
		this.listOpacity[0] = new Opacity();

		this.listSize = new Array();
		this.listSize[0] = new Size();

		this.listAngle = new Array();
		this.listAngle[0] = new Angle();
	}

}

class GroupTexture {

	constructor() {
		this.name = "32x32_star.png";
		this.url = "http://static.3dmomoda.com/textures/18092617nyspq5moaka1i2fhvs1hh66s.png";
		this.vec2Frames = new t3d.Vector2(1, 1);
		this.iFrameCount = 1;
		this.iLoop = 1;
	}

}

class MaxAge {

	constructor() {
		this.value = 1.0;
		this.spread = 1.0;
	}

}

class Position {

	constructor() {
		this.value = new t3d.Vector3(0, 0, 0);
		this.spread = new t3d.Vector3(0, 0, 0);
		this.spreadClamp = new t3d.Vector3(0, 0, 0);
		this.radius = 2.0;
		this.radiusScale = new t3d.Vector3(1, 1, 1);
		this.distribution = 1;
		this.randomise = false;
	}

}

class Velocity {

	constructor() {
		this.value = new t3d.Vector3(0, 10, 0);
		this.spread = new t3d.Vector3(10, 0, 10);
		this.distribution = 1;
		this.randomise = false;
	}

}

class Acceleration {

	constructor() {
		this.value = new t3d.Vector3(0, 0, 0);
		this.spread = new t3d.Vector3(0, 0, 0);
		this.distribution = 1;
		this.randomise = false;
	}

}

class Drag {

	constructor() {
		this.value = 0;
		this.spread = 0;
		this.randomise = false;
	}

}

class Wiggle {

	constructor() {
		this.value = 0;
		this.spread = 0;
	}

}

class Rotation {

	constructor() {
		this.axis = new t3d.Vector3(0, 0, 0);
		this.axisSpread = new t3d.Vector3(0, 0, 0);
		this.angle = 0.0;
		this.angleSpread = 0.0;
		this.isStatic = false;
		this.center = new t3d.Vector3(0, 0, 0);
		this.randomise = false;
	}

}

class Color {

	constructor() {
		this.value = 0xffffff;
		this.spread = new t3d.Vector3(0, 0, 0);
		this.randomise = false;
	}

}

class Opacity {

	constructor() {
		this.value = 1.0;
		this.spread = 0.0;
		this.randomise = false;
	}

}

class Size {

	constructor() {
		this.value = 1.0;
		this.spread = 0.0;
		this.randomise = false;
	}

}

class Angle {

	constructor() {
		this.value = 0.0;
		this.spread = 0.0;
		this.randomise = false;
	}

}

export
{
	ParticleData,
	ParticleGroupData,
	ParticleEmitterData,
	GroupTexture,
	MaxAge,
	Position,
	Velocity,
	Acceleration,
	Drag,
	Wiggle,
	Rotation,
	Color,
	Opacity,
	Size,
	Angle
}