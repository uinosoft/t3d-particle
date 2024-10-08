import { ShaderChunk } from 't3d';
import { ShaderChunks } from './ShaderChunks.js';

export const ParticleShader = {

	name: 'particle_shader',

	defines: {
		HAS_PERSPECTIVE: true,
		COLORIZE: true,
		VALUE_OVER_LIFETIME_LENGTH: 4,

		SHOULD_ROTATE_TEXTURE: false,
		SHOULD_ROTATE_PARTICLES: false,
		SHOULD_WIGGLE_PARTICLES: false,

		SHOULD_CALCULATE_SPRITE: false
	},

	uniforms: {
		tex: null,
		textureAnimation: [1, 1, 1, 1],
		scale: 300,
		deltaTime: 0,
		runTime: 0
	},

	vertexShader: `
		${ShaderChunks.defines}
		${ShaderChunks.uniforms}
		${ShaderChunks.attributes}
		${ShaderChunks.varyings}

		${ShaderChunk.common_vert}
		${ShaderChunk.logdepthbuf_pars_vert}

		${ShaderChunks.branchAvoidanceFunctions}
		${ShaderChunks.unpackColor}
		${ShaderChunks.unpackRotationAxis}
		${ShaderChunks.floatOverLifetime}
		${ShaderChunks.colorOverLifetime}
		${ShaderChunks.paramFetchingFunctions}
		${ShaderChunks.rotationFunctions}

		void main() {
			//
			// Setup...
			//

			float age = getAge();
			float alive = getAlive();
			float maxAge = getMaxAge();
			float positionInTime = (age / maxAge);
			float isAlive = when_gt(alive, 0.0);

			#ifdef SHOULD_WIGGLE_PARTICLES
				float wiggleAmount = positionInTime * getWiggle();
				float wiggleSin = isAlive * sin(wiggleAmount);
				float wiggleCos = isAlive * cos(wiggleAmount);
			#endif

			//
			// Forces
			//

			// Get forces
			vec3 vel = velocity;
			vec3 acc= acceleration.xyz;

			// Calculate the required drag to apply to the forces.
			float drag = 1.0 - (positionInTime * 0.5) * acceleration.w;
			vel *= drag;

			vec3 pos = vec3(a_Position);
			pos += vel * age;
			pos += acc * age * age * 0.5;

			// Wiggly wiggly wiggle!
			#ifdef SHOULD_WIGGLE_PARTICLES
				pos.x += wiggleSin;
				pos.y += wiggleCos;
				pos.z += wiggleSin;
			#endif

			// Rotate the emitter around it's central point
			#ifdef SHOULD_ROTATE_PARTICLES
				pos = getRotation(pos, positionInTime);
			#endif

			// Convert pos to a world-space value
			vec4 mvPosition = u_View * u_Model * vec4(pos, 1.0);

			// Determine point size.
			float pointSize = getFloatOverLifetime(positionInTime, size) * isAlive;

			// Determine perspective
			#ifdef HAS_PERSPECTIVE
				float perspective = scale / length(mvPosition.xyz);
			#else
				float perspective = 1.0;
			#endif

			// Apply perpective to pointSize value
			float pointSizePerspective = pointSize * perspective;

			//
			// Appearance
			//

			// Determine color and opacity for this particle
			#ifdef COLORIZE
				vec3 c = isAlive * getColorOverLifetime(
					positionInTime,
					unpackColor(color.x),
					unpackColor(color.y),
					unpackColor(color.z),
					unpackColor(color.w)
				);
			#else
				vec3 c = vec3(1.0);
			#endif

			float o = isAlive * getFloatOverLifetime(positionInTime, opacity);

			// Assign color to vColor varying.
			vColor = vec4(c, o);

			// Determine angle
			#ifdef SHOULD_ROTATE_TEXTURE
				vAngle = isAlive * getFloatOverLifetime(positionInTime, angle);
			#endif

			// If this particle is using a sprite-sheet as a texture, we'll have to figure out
			// what frame of the texture the particle is using at it's current position in time.
			#ifdef SHOULD_CALCULATE_SPRITE
				float framesX = textureAnimation.x;
				float framesY = textureAnimation.y;
				float loopCount = textureAnimation.w;
				float totalFrames = textureAnimation.z;
				float frameNumber = mod((positionInTime * loopCount) * totalFrames, totalFrames);

				float column = floor(mod(frameNumber, framesX));
				float row = floor((frameNumber - column) / framesX);

				float columnNorm = column / framesX;
				float rowNorm = row / framesY;

				vSpriteSheet.x = 1.0 / framesX;
				vSpriteSheet.y = 1.0 / framesY;
				vSpriteSheet.z = columnNorm;
				vSpriteSheet.w = rowNorm;
			#endif

			//
			// Write values
			//

			// Set PointSize according to size at current point in time.
			gl_PointSize = pointSizePerspective;
			gl_Position = u_Projection * mvPosition;

			${ShaderChunk.logdepthbuf_vert}
		}
	`,

	fragmentShader: `
		${ShaderChunks.uniforms}

		${ShaderChunk.common_frag}
		${ShaderChunk.alphaTest_pars_frag}
		${ShaderChunk.fog_pars_frag}
		${ShaderChunk.logdepthbuf_pars_frag}

		${ShaderChunks.varyings}

		${ShaderChunks.branchAvoidanceFunctions}

		void main() {
			vec3 outgoingLight = vColor.xyz;

			${ShaderChunks.rotateTexture}

			${ShaderChunk.logdepthbuf_frag}

			outgoingLight = vColor.xyz * rotatedTexture.xyz;
			gl_FragColor = vec4(outgoingLight.xyz, rotatedTexture.w * vColor.w);

			#ifdef ALPHATEST
				if (gl_FragColor.a < u_AlphaTest) discard;
			#endif

			${ShaderChunk.fog_frag}
		}
	`

};