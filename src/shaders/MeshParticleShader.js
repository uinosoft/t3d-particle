export const MeshParticleShader = {

	name: 'mesh_particle_shader',

	uniforms: {
		tex: null
	},

	vertexShader: `
		#include <common_vert>

		attribute vec3 mcol0;
		attribute vec3 mcol1;
		attribute vec3 mcol2;
		attribute vec3 mcol3;
		attribute vec4 color;

		attribute vec2 a_Uv;

		varying vec2 vUv;
		varying vec4 varyColor;

		#include <logdepthbuf_pars_vert>

		void main() {
			mat4 matrix = mat4(
				vec4(mcol0, 0),
				vec4(mcol1, 0),
				vec4(mcol2, 0),
				vec4(mcol3, 1)
			);

			vec4 worldPosition = u_Model * matrix * vec4(a_Position, 1.0);
			gl_Position = u_ProjectionView * worldPosition;

			varyColor = color;
			vUv = a_Uv;

			#include <logdepthbuf_vert>
		}
	`,

	fragmentShader: `
		uniform sampler2D tex;

		#include <common_frag>
		#include <fog_pars_frag>
		#include <logdepthbuf_pars_frag>

		varying vec2 vUv;
		varying vec4 varyColor;

		void main() {
			#include <logdepthbuf_frag>

			gl_FragColor = varyColor * texture2D(tex, vUv);

			#include <fog_frag>
		}
	`

};