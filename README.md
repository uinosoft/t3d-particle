t3d-particle
====

[![NPM Package][npm]][npm-url]

This is a particle system based on [t3d.js](https://github.com/uinosoft/t3d.js).
Inspired by [ShaderParticleEngine](https://github.com/squarefeet/ShaderParticleEngine).
Added support for mesh particles.

[Examples](https://uinosoft.github.io/t3d-particle/examples/)

### Usage

#### Creating

Here is a simple example to create particles:

````javascript
// Creating a particle group.
const particleGroup = new ParticleGroup({
    texture: {
        value: t3d.Texture2D.fromSrc('./resources/img/smokeparticle.png')
    },
    maxParticleCount: 2000
});

// Creating a particle emitter.
const particleEmitter = new ParticleEmitter({
    type: ParticleProperties.distributions.BOX,
    maxAge: {
        value: 2
    },
    position: {
        value: new t3d.Vector3(0, 0, -50),
        spread: new t3d.Vector3(0, 0, 0)
    },
    acceleration: {
        value: new t3d.Vector3(0, -10, 0),
        spread: new t3d.Vector3(10, 0, 10)
    },
    velocity: {
        value: new t3d.Vector3(0, 25, 0),
        spread: new t3d.Vector3(10, 7.5, 10)
    },
    color: {
        value: [new t3d.Color3(1, 1, 1), new t3d.Color3(1, 0, 0)]
    },
    size: {
        value: 1
    },
    particleCount: 1000
});

// To add an emitter to a group
particleGroup.addEmitter(particleEmitter);

// To render the group, add the particle group's mesh object to your scene:
scene.add(particleGroup.mesh);
````

You can also create mesh particles by:

````javascript
const particleGroup = new MeshParticleGroup({/*...GroupOptions...*/});

const particleEmitter = new MeshParticleEmitter({/*...Emitter...*/});

// ...
````

#### A full options to configure an ParticleGroup:

<b>texture</b>(<i>Object</i>):&emsp;describing the texture used by particle.  

<b>fixedTimeStep</b>(<i>Number</i>):&emsp;If no `dt` (or `deltaTime`) value is passed to this group's `tick()` function, this number will be used to move the particle simulation forward. Value in SECONDS. Default is 0.016s.  

<b>maxParticleCount</b>(<i>Number</i>):&emsp;Maximum number of particles.  

<b>hasPerspective</b>(<i>Number</i>):&emsp;Whether the distance a particle is from the camera should affect the particle's size. Default is true. Only for ParticleGroup.

<b>colorize</b>(<i>Boolean</i>):&emsp;Whether the particles in this group should be rendered with color, or whether the only color of particles will come from the provided texture. Default is true. Only for ParticleGroup.  

<b>scale</b>(<i>Number</i>):&emsp;The scale factor to apply to this group's particle sizes. Useful for setting particle sizes to be relative to renderer size. Default is 300. Only for ParticleGroup.  

<b>geometry</b>(<i>Geometry</i>):&emsp;Useful for group's particles geometry information. Only for MeshParticleGroup.

#### A full options to configure an ParticleEmitter: 

<b>type</b>(<i>Number</i>):&emsp;The default distribution this emitter should use to control its particle's spawn position and force behaviour. Default is 1.1 will be distributed within a box. 2 will be distributed on a sphere. 3 will be distributed on a 2d-disc shape. 4 will be distributed along a line.  

<b>particleCount</b>(<i>Number</i>):&emsp;The total number of particles this emitter will hold. Default is 100.

<b>duration</b>(<i>Number|null</i>):&emsp;The duration in seconds that this emitter should live for. If not specified, the emitter will emit particles indefinitely. Default is null.  

<b>isStatic</b>(<i>Boolean</i>):&emsp;Whether this emitter should be not be simulated (true). Default is false.

<b>activeMultiplier</b>(<i>Object</i>):&emsp;A value between 0 and 1 describing what percentage of this emitter's particlesPerSecond should be emitted, where 0 is 0%, and 1 is 100%. Default is 1.

<b>direction</b>(<i>Number</i>):&emsp;The direction of the emitter. If value is `1`, emitter will start at beginning of particle's lifecycle.If value is `-1`, emitter will start at end of particle's lifecycle and work it's way backwards. Default is 1. Only for ParticleEmitter.  

<b>isLookAtCamera</b>(<i>Boolean</i>):&emsp;Whether particle is always facing the camera. Default is false. Only for MeshParticleEmitter.  

<b>isLookAtCameraOnlyY</b>(<i>Boolean</i>):&emsp;Whether particle locks the Y-axis. Default is false. Only for MeshParticleEmitter.

<b>maxAge</b>(<i>Object</i>):&emsp;An object describing the particle's maximum age in seconds.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Number</i>) | A number between 0 and 1 describing the amount of maxAge to apply to all particles. | Default is 2s |
| <b>spread</b>(<i>Number</i>) | A number describing the maxAge variance on a per-particle basis. | Default is 0 |  

<b>position</b>(<i>Object</i>):&emsp;An object describing this emitter's position.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing this emitter's base position. | Default is Vector3(0,0,0) |
| <b>spread</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing this emitter's position variance on a per-particle basis. | Default is Vector3(0,0,0) |
| <b>spreadClamp</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing the numeric multiples the particle's should be spread out over. | Default is Vector3(0,0,0) |
| <b>radius</b>(<i>Number</i>) | This emitter's base radius. | Default is 10 |
| <b>radiusScale</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing the radius's scale in all three axes. Allows a SPHERE or DISC to be squashed or stretched. | Default is Vector3(0,0,0) |
| <b>distribution</b>(<i>Number or Function</i>) | A specific distribution to use when radiusing particles. Overrides the `type` option. | Default is `type` option. |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's position should be re-randomised or not. Can incur a performance hit. | Default is false |  

<b>velocity</b>(<i>Object</i>):&emsp;An object describing this particle velocity.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing this emitter's base velocity. | Default is Vector3(0,0,0) |
| <b>spread</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing this emitter's velocity variance on a per-particle basis.Note that when using a SPHERE or DISC distribution, only the x-component of this vector is used. | Default is Vector3(0,0,0) |
| <b>distribution</b>(<i>Number or Function</i>) | A specific distribution to use when calculating a particle's velocity. Overrides the `type` option. | Default is `type` option. |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's velocity should be re-randomised or not. Can incur a performance hit. | Default is false |  

<b>acceleration</b>(<i>Object</i>):&emsp;An object describing this particle's acceleration.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing this emitter's base acceleration. | Default is Vector3(0,0,0) |
| <b>spread</b>(<i>Vector3</i>) | A t3d.Vector3 instance describing this emitter's acceleration variance on a per-particle basis. Note that when using a SPHERE or DISC distribution, only the x-component of this vector is used. | Default is Vector3(0,0,0) |
| <b>distribution</b>(<i>Number or Function</i>) | A specific distribution to use when calculating a particle's acceleration. Overrides the `type` option. | Default is `type` option. |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's acceleration should be re-randomised or not. Can incur a performance hit. | Default is false |  

<b>drag</b>(<i>Object</i>):&emsp;An object describing this particle drag. Drag is applied only to velocity values.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Number</i>) | A number between 0 and 1 describing the amount of drag to apply to all particles. | Default is 0 |
| <b>spread</b>(<i>Number</i>) | A number describing the drag variance on a per-particle basis. | Default is 0 |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's drag should be re-randomised or not. Can incur a performance hit. | Default is false |  

<b>wiggle</b>(<i>Object</i>):&emsp;The values of this object will determine whether a particle will wiggle, or jiggle, or wave,...or shimmy, or waggle, or... Well you get the idea.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Number</i>) | A number describing the amount of wiggle to apply to all particles. It's measured in distance. | Default is 0 |
| <b>spread</b>(<i>Number</i>) | A number describing the wiggle variance on a per-particle basis. | Default is 0 |  

<b>rotation</b>(<i>Object</i>):&emsp;An object describing this emitter's rotation. It can either be static, or set to rotate from 0 radians to the value of `rotation.value` over a particle's lifetime. Rotation values affect both a particle's position and the forces applied to it.  
|  |  |  |
| --- | --- | :--: |
| <b>axis</b>(<i>Number</i>) | A t3d.Vector3 instance describing this emitter's axis of rotation. | Default is Vector3(0, 1, 0) |
| <b>axisSpread</b>(<i>Number</i>) | A t3d.Vector3 instance describing the amount of variance to apply to the axis of rotation on a per-particle basis. | Default is Vector3() |
| <b>angle</b>(<i>Number</i>) | The angle of rotation, given in radians. If `rotation.static` is true, the emitter will start off rotated at this angle, and stay as such. Otherwise, the particles will rotate from 0 radians to this value over their lifetimes. | Default is 0 |
| <b>axisSpread</b>(<i>Number</i>) | The amount of variance in each particle's rotation angle. | Default is 0 |
| <b>static</b>(<i>Boolean</i>) | Whether the rotation should be static or not. | Default is false |
| <b>center</b>(<i>Number</i>) | A t3d.Vector3 instance describing the center point of rotation. | Default is The value of `position.value` |
| <b>randomise</b>(<i>Number</i>) | When a particle is re-spawned, whether it's rotation should be re-randomised or not. Can incur a performance hit. | Default is false |

<b>color</b>(<i>Object</i>):&emsp;An object describing a particle's color.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Color3 or Array<Color3></i>) | Either a single t3d.Color3 instance, or an array of t3d.Color3 instances to describe the color of a particle over it's lifetime. | Default is Color3(0,0,0) |
| <b>spread</b>(<i>Vector3 or Array<Vector3></i>) | Either a single t3d.Vector3 instance, or an array of t3d.Vector3 instances to describe the color variance of a particle over it's lifetime. | Default is Vector3(0,0,0) |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's color should be re-randomised or not. Can incur a performance hit. | Default is false |

<b>opacity</b>(<i>Object</i>):&emsp;An object describing a particle's opacity.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Number or Array<Number></i>) | Either a single number, or an array of numbers to describe the opacity of a particle over it's lifetime. | Default is 1 |
| <b>spread</b>(<i>Number or Array<Number></i>) | Either a single number, or an array of numbers to describe the opacity variance of a particle over it's lifetime. | Default is 0 |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's opacity should be re-randomised or not. Can incur a performance hit. | Default is false |

<b>size</b>(<i>Object</i>):&emsp;An object describing a particle's size.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Number or Array<Number></i>) | Either a single number, or an array of numbers to describe the size of a particle over it's lifetime. | Default is 1 |
| <b>spread</b>(<i>Number or Array<Number></i>) | Either a single number, or an array of numbers to describe the size variance of a particle over it's lifetime. | Default is 0 |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's size should be re-randomised or not. Can incur a performance hit. | Default is false |

<b>angle</b>(<i>Object</i>):&emsp;An object describing a particle's angle.  
|  |  |  |
| --- | --- | :--: |
| <b>value</b>(<i>Number or Array<Number></i>) | Either a single number, or an array of numbers to describe the angle of a particle over it's lifetime. | Default is 1 |
| <b>spread</b>(<i>Number or Array<Number></i>) | Either a single number, or an array of numbers to describe the angle variance of a particle over it's lifetime. | Default is 0 |
| <b>randomise</b>(<i>Boolean</i>) | When a particle is re-spawned, whether it's angle should be re-randomised or not. Can incur a performance hit. | Default is false |

#### Runtime Changing

````javascript
// Trigger the setter for this property to force an
// update to the emitter's position attribute.
particleEmitter.position.value = particleEmitter.position.value.set(2, 2, 2);

particleEmitter.rotation.angle += 0.1;

// other properties...
````

[npm]: https://img.shields.io/npm/v/t3d-particle
[npm-url]: https://www.npmjs.com/package/t3d-particle