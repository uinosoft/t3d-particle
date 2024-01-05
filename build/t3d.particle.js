// t3d-particle
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('t3d')) :
	typeof define === 'function' && define.amd ? define(['exports', 't3d'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.t3d = global.t3d || {}, global.t3d));
})(this, (function (exports, t3d) { 'use strict';

	function _interopNamespaceDefault(e) {
		var n = Object.create(null);
		if (e) {
			Object.keys(e).forEach(function (k) {
				if (k !== 'default') {
					var d = Object.getOwnPropertyDescriptor(e, k);
					Object.defineProperty(n, k, d.get ? d : {
						enumerable: true,
						get: function () { return e[k]; }
					});
				}
			});
		}
		n.default = e;
		return Object.freeze(n);
	}

	var t3d__namespace = /*#__PURE__*/_interopNamespaceDefault(t3d);

	/**
	 * @typedef {Number} distribution
	 * @property {Number} ParticleProperties.distributions.BOX Values will be distributed within a box.
	 * @property {Number} ParticleProperties.distributions.SPHERE Values will be distributed within a sphere.
	 * @property {Number} ParticleProperties.distributions.DISC Values will be distributed within a 2D disc.
	 */

	const ParticleProperties = {
		/**
				* A map of supported distribution types used
				* by Emitter instances.
				*
				* These distribution types can be applied to
				* an emitter globally, which will affect the
				* `position`, `velocity`, and `acceleration`
				* value calculations for an emitter, or they
				* can be applied on a per-property basis.
				*
				* @enum {Number}
				*/
		distributions: {
			/**
						 * Values will be distributed within a box.
						 * @type {Number}
						 */
			BOX: 1,
			/**
						 * Values will be distributed on a sphere.
						 * @type {Number}
						 */
			SPHERE: 2,
			/**
						 * Values will be distributed on a 2d-disc shape.
						 * @type {Number}
						 */
			DISC: 3,
			/**
						 * Values will be distributed along a line.
						 * @type {Number}
						 */
			LINE: 4
		},
		/**
				* Set this value to however many 'steps' you
				* want value-over-lifetime properties to have.
				*
				* It's adjustable to fix an interpolation problem:
				*
				* Assuming you specify an opacity value as [0, 1, 0]
				*			and the `valueOverLifetimeLength` is 4, then the
				*			opacity value array will be reinterpolated to
				*			be [0, 0.66, 0.66, 0].
				*	 This isn't ideal, as particles would never reach
				*	 full opacity.
				*
				* NOTE:
				*		 This property affects the length of ALL
				*			 value-over-lifetime properties for ALL
				*			 emitters and ALL groups.
				*
				*		 Only values >= 3 && <= 4 are allowed.
				*
				* @type {Number}
				*/
		valueOverLifetimeLength: 4
	};

	/**
	 * A bunch of utility functions used throughout the library.
	 * @namespace
	 * @type {Object}
	 */
	const Utils = {
		/**
		 * A map of types used by `Utils.ensureTypedArg` and
		 * `Utils.ensureArrayTypedArg` to compare types against.
		 *
		 * @enum {String}
		 */
		types: {
			/**
			 * Boolean type.
			 * @type {String}
			 */
			BOOLEAN: 'boolean',
			/**
			 * String type.
			 * @type {String}
			 */
			STRING: 'string',
			/**
			 * Number type.
			 * @type {String}
			 */
			NUMBER: 'number',
			/**
			 * Object type.
			 * @type {String}
			 */
			OBJECT: 'object'
		},
		/**
		 * Given a value, a type, and a default value to fallback to,
		 * ensure the given argument adheres to the type requesting,
		 * returning the default value if type check is false.
		 *
		 * @param	{(boolean|string|number|object)} arg					The value to perform a type-check on.
		 * @param	{String} type				 The type the `arg` argument should adhere to.
		 * @param	{(boolean|string|number|object)} defaultValue A default value to fallback on if the type check fails.
		 * @return {(boolean|string|number|object)}							The given value if type check passes, or the default value if it fails.
		 */
		ensureTypedArg: function (arg, type, defaultValue) {
			if (typeof arg === type) {
				return arg;
			} else {
				return defaultValue;
			}
		},
		/**
		 * Given an array of values, a type, and a default value,
		 * ensure the given array's contents ALL adhere to the provided type,
		 * returning the default value if type check fails.
		 *
		 * If the given value to check isn't an Array, delegates to Utils.ensureTypedArg.
		 *
		 * @param	{Array|boolean|string|number|object} arg					The array of values to check type of.
		 * @param	{String} type				 The type that should be adhered to.
		 * @param	{(boolean|string|number|object)} defaultValue A default fallback value.
		 * @return {(boolean|string|number|object)}							The given value if type check passes, or the default value if it fails.
		 */
		ensureArrayTypedArg: function (arg, type, defaultValue) {
			// If the argument being checked is an array, loop through
			// it and ensure all the values are of the correct type,
			// falling back to the defaultValue if any aren't.
			if (Array.isArray(arg)) {
				for (let i = arg.length - 1; i >= 0; --i) {
					if (typeof arg[i] !== type) {
						return defaultValue;
					}
				}
				return arg;
			}

			// If the arg isn't an array then just fallback to
			// checking the type.
			return this.ensureTypedArg(arg, type, defaultValue);
		},
		/**
		 * Ensures the given value is an instance of a constructor function.
		 *
		 * @param	{Object} arg					The value to check instance of.
		 * @param	{Function} instance		 The constructor of the instance to check against.
		 * @param	{Object} defaultValue A default fallback value if instance check fails
		 * @return {Object}							The given value if type check passes, or the default value if it fails.
		 */
		ensureInstanceOf: function (arg, instance, defaultValue) {
			if (instance !== undefined && arg instanceof instance) {
				return arg;
			} else {
				return defaultValue;
			}
		},
		/**
		 * Given an array of values, ensure the instances of all items in the array
		 * matches the given instance constructor falling back to a default value if
		 * the check fails.
		 *
		 * If given value isn't an Array, delegates to `Utils.ensureInstanceOf`.
		 *
		 * @param	{Array|Object} arg					The value to perform the instanceof check on.
		 * @param	{Function} instance		 The constructor of the instance to check against.
		 * @param	{Object} defaultValue A default fallback value if instance check fails
		 * @return {Object}							The given value if type check passes, or the default value if it fails.
		 */
		ensureArrayInstanceOf: function (arg, instance, defaultValue) {
			// If the argument being checked is an array, loop through
			// it and ensure all the values are of the correct type,
			// falling back to the defaultValue if any aren't.
			if (Array.isArray(arg)) {
				for (let i = arg.length - 1; i >= 0; --i) {
					if (instance !== undefined && arg[i] instanceof instance === false) {
						return defaultValue;
					}
				}
				return arg;
			}

			// If the arg isn't an array then just fallback to
			// checking the type.
			return this.ensureInstanceOf(arg, instance, defaultValue);
		},
		/**
		 * Ensures that any "value-over-lifetime" properties of an emitter are
		 * of the correct length (as dictated by `ParticleProperties.valueOverLifetimeLength`).
		 *
		 * Delegates to `Utils.interpolateArray` for array resizing.
		 *
		 * If properties aren't arrays, then property values are put into one.
		 *
		 * @param	{Object} property	The property of an Emitter instance to check compliance of.
		 * @param	{Number} minLength The minimum length of the array to create.
		 * @param	{Number} maxLength The maximum length of the array to create.
		 */
		ensureValueOverLifetimeCompliance: function (property, minLength, maxLength) {
			minLength = minLength || 3;
			maxLength = maxLength || 3;

			// First, ensure both properties are arrays.
			if (Array.isArray(property._value) === false) {
				property._value = [property._value];
			}
			if (Array.isArray(property._spread) === false) {
				property._spread = [property._spread];
			}
			const valueLength = this.clamp(property._value.length, minLength, maxLength),
				spreadLength = this.clamp(property._spread.length, minLength, maxLength),
				desiredLength = Math.max(valueLength, spreadLength);
			if (property._value.length !== desiredLength) {
				property._value = this.interpolateArray(property._value, desiredLength);
			}
			if (property._spread.length !== desiredLength) {
				property._spread = this.interpolateArray(property._spread, desiredLength);
			}
		},
		/**
		 * Performs linear interpolation (lerp) on an array.
		 * For example, lerping [1, 10], with a `newLength` of 10 will produce [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].
		 * Delegates to `Utils.lerpTypeAgnostic` to perform the actual interpolation.
		 * @param	{Array} srcArray	The array to lerp.
		 * @param	{Number} newLength The length the array should be interpolated to.
		 * @return {Array} The interpolated array.
		 */
		interpolateArray: function (srcArray, newLength) {
			const sourceLength = srcArray.length,
				newArray = [typeof srcArray[0].clone === 'function' ? srcArray[0].clone() : srcArray[0]],
				factor = (sourceLength - 1) / (newLength - 1);
			for (let i = 1; i < newLength - 1; i++) {
				const f = i * factor,
					before = Math.floor(f),
					after = Math.ceil(f),
					delta = f - before;
				newArray[i] = this.lerpTypeAgnostic(srcArray[before], srcArray[after], delta);
			}
			newArray.push(typeof srcArray[sourceLength - 1].clone === 'function' ? srcArray[sourceLength - 1].clone() : srcArray[sourceLength - 1]);
			return newArray;
		},
		/**
		 * Clamp a number to between the given min and max values.
		 * @param	{Number} value The number to clamp.
		 * @param	{Number} min	 The minimum value.
		 * @param	{Number} max	 The maximum value.
		 * @return {Number}			 The clamped number.
		 */
		clamp: function (value, min, max) {
			return Math.max(min, Math.min(value, max));
		},
		/**
		 * If the given value is less than the epsilon value, then return
		 * a randomised epsilon value if specified, or just the epsilon value if not.
		 * Works for negative numbers as well as positive.
		 *
		 * @param	{Number} value		 The value to perform the operation on.
		 * @param	{Boolean} randomise Whether the value should be randomised.
		 * @return {Number}					 The result of the operation.
		 */
		zeroToEpsilon: function (value, randomise) {
			const epsilon = 0.00001;
			let result = value;
			result = randomise ? Math.random() * epsilon * 10 : epsilon;
			if (value < 0 && value > -epsilon) {
				result = -result;
			}

			// if ( value === 0 ) {
			//		 result = randomise ? Math.random() * epsilon * 10 : epsilon;
			// }
			// else if ( value > 0 && value < epsilon ) {
			//		 result = randomise ? Math.random() * epsilon * 10 : epsilon;
			// }
			// else if ( value < 0 && value > -epsilon ) {
			//		 result = -( randomise ? Math.random() * epsilon * 10 : epsilon );
			// }

			return result;
		},
		/**
		 * Linearly interpolates two values of letious types.
		 * The given values must be of the same type for the interpolation to work.
		 * @param	{Number|Object} start The start value of the lerp.
		 * @param	{Number|Object} end The end value of the lerp.
		 * @param	{Number} delta The delta posiiton of the lerp operation. Ideally between 0 and 1 (inclusive).
		 * @return {Number|Object|Undefined} The result of the operation. Result will be undefined if the start and end arguments aren't a supported type, or if their types do not match.
		 */
		lerpTypeAgnostic: function (start, end, delta) {
			const types = this.types;
			let out;
			if (typeof start === types.NUMBER && typeof end === types.NUMBER) {
				return this.lerp(start, end, delta);
			} else if (start instanceof t3d__namespace.Vector2 && end instanceof t3d__namespace.Vector2 || typeof start.x == types.NUMBER && typeof start.y == types.NUMBER && start.z == null && start.z == undefined && typeof end.x == types.NUMBER && typeof end.y == types.NUMBER && end.z == null && end.z == undefined) {
				if (start instanceof t3d__namespace.Vector2) {
					out = new t3d__namespace.Vector2();
				} else {
					out = {};
				}
				out.x = this.lerp(start.x, end.x, delta);
				out.y = this.lerp(start.y, end.y, delta);
				return out;
			} else if (start instanceof t3d__namespace.Vector3 && end instanceof t3d__namespace.Vector3 || typeof start.x == types.NUMBER && typeof start.y == types.NUMBER && typeof start.z == types.NUMBER && start.w == null && start.w == undefined && typeof end.x == types.NUMBER && typeof end.y == types.NUMBER && typeof end.z == types.NUMBER && end.w == null && end.w == undefined) {
				if (start instanceof t3d__namespace.Vector3) {
					out = new t3d__namespace.Vector3();
				} else {
					out = {};
				}
				out.x = this.lerp(start.x, end.x, delta);
				out.y = this.lerp(start.y, end.y, delta);
				out.z = this.lerp(start.z, end.z, delta);
				return out;
			} else if (start instanceof t3d__namespace.Vector4 && end instanceof t3d__namespace.Vector4 || typeof start.x == types.NUMBER && typeof start.y == types.NUMBER && typeof start.z == types.NUMBER && typeof start.w == types.NUMBER && typeof end.x == types.NUMBER && typeof end.y == types.NUMBER && typeof end.z == types.NUMBER && typeof end.w == types.NUMBER) {
				if (start instanceof t3d__namespace.Vector4) {
					out = new t3d__namespace.Vector4();
				} else {
					out = {};
				}
				out.x = this.lerp(start.x, end.x, delta);
				out.y = this.lerp(start.y, end.y, delta);
				out.z = this.lerp(start.z, end.z, delta);
				out.w = this.lerp(start.w, end.w, delta);
				return out;
			} else if (start instanceof t3d__namespace.Color3 && end instanceof t3d__namespace.Color3 || typeof start.r == types.NUMBER && typeof start.g == types.NUMBER && typeof start.b == types.NUMBER && typeof end.r == types.NUMBER && typeof end.g == types.NUMBER && typeof end.b == types.NUMBER) {
				if (start instanceof t3d__namespace.Color3) {
					out = new t3d__namespace.Color3();
				} else {
					out = {};
				}
				out.r = this.lerp(start.r, end.r, delta);
				out.g = this.lerp(start.g, end.g, delta);
				out.b = this.lerp(start.b, end.b, delta);
				return out;
			} else {
				console.warn('Invalid argument types, or argument types do not match:', start, end);
			}
		},
		/**
		 * Perform a linear interpolation operation on two numbers.
		 * @param	{Number} start The start value.
		 * @param	{Number} end	 The end value.
		 * @param	{Number} delta The position to interpolate to.
		 * @return {Number}			 The result of the lerp operation.
		 */
		lerp: function (start, end, delta) {
			return start + (end - start) * delta;
		},
		/**
		 * Whether the array has non-zero elements.
		 * @param {Array} array
		 * @returns {Boolean}
		 */
		hasNonZeroElement: function (array) {
			return array.some(element => element !== 0);
		},
		/**
		 * Rounds a number to a nearest multiple.
		 *
		 * @param	{Number} n				The number to round.
		 * @param	{Number} multiple The multiple to round to.
		 * @return {Number}					The result of the round operation.
		 */
		roundToNearestMultiple: function (n, multiple) {
			let remainder = 0;
			if (multiple === 0) {
				return n;
			}
			remainder = Math.abs(n) % multiple;
			if (remainder === 0) {
				return n;
			}
			if (n < 0) {
				return -(Math.abs(n) - remainder);
			}
			return n + multiple - remainder;
		},
		/**
		 * Check if all items in an array are equal. Uses strict equality.
		 *
		 * @param	{Array} array The array of values to check equality of.
		 * @return {Boolean}			 Whether the array's values are all equal or not.
		 */
		arrayValuesAreEqual: function (array) {
			for (let i = 0; i < array.length - 1; ++i) {
				if (array[i] !== array[i + 1]) {
					return false;
				}
			}
			return true;
		},
		/**
		 * Given a start value and a spread value, create and return a random
		 * number.
		 * @param	{Number} base	 The start value.
		 * @param	{Number} spread The size of the random variance to apply.
		 * @return {Number}				A randomised number.
		 */
		randomFloat: function (base, spread) {
			return base + spread * (Math.random() - 0.5);
		},
		getRandomVector3: function (array, offset, base, spread, spreadClamp) {
			let x = base.x + (Math.random() * spread.x - spread.x * 0.5),
				y = base.y + (Math.random() * spread.y - spread.y * 0.5),
				z = base.z + (Math.random() * spread.z - spread.z * 0.5);
			if (spreadClamp && spreadClamp.x) {
				x = -spreadClamp.x * 0.5 + Utils.roundToNearestMultiple(x, spreadClamp.x);
				y = -spreadClamp.y * 0.5 + Utils.roundToNearestMultiple(y, spreadClamp.y);
				z = -spreadClamp.z * 0.5 + Utils.roundToNearestMultiple(z, spreadClamp.z);
			}
			array[offset + 0] = x;
			array[offset + 1] = y;
			array[offset + 2] = z;
			return array;
		},
		getRandomVector3OnSphere: function (array, offset, base, radiusSpread, radiusSpreadClamp, radius, radiusScale) {
			const depth = 2 * Math.random() - 1,
				t = 6.2832 * Math.random(),
				r = Math.sqrt(1 - depth * depth);
			let rand = Utils.randomFloat(radius, radiusSpread.x),
				x = 0,
				y = 0,
				z = 0;
			if (radiusSpreadClamp.x) {
				rand = Math.round(rand / radiusSpreadClamp.x) * radiusSpreadClamp.x;
			}

			// Set position on sphere
			x = r * Math.cos(t) * rand;
			y = r * Math.sin(t) * rand;
			z = depth * rand;

			// Apply radius scale to this position
			x *= radiusScale.x;
			y *= radiusScale.y;
			z *= radiusScale.z;

			// Translate to the base position.
			x += base.x;
			y += base.y;
			z += base.z;
			array[offset + 0] = x;
			array[offset + 1] = y;
			array[offset + 2] = z;
			return array;
		},
		getRandomVector3OnDisc: function (array, offset, base, radiusSpread, radiusSpreadClamp, radius, radiusScale) {
			const t = 6.2832 * Math.random();
			let rand = Math.abs(Utils.randomFloat(radius, radiusSpread.x)),
				x = 0,
				y = 0,
				z = 0;
			if (radiusSpreadClamp.x) {
				rand = Math.round(rand / radiusSpreadClamp.x) * radiusSpreadClamp.x;
			}

			// Set position on sphere
			x = Math.cos(t) * rand;
			y = Math.sin(t) * rand;

			// Apply radius scale to this position
			x *= radiusScale.x;
			y *= radiusScale.y;

			// Translate to the base position.
			x += base.x;
			y += base.y;
			z += base.z;
			array[offset + 0] = x;
			array[offset + 1] = y;
			array[offset + 2] = z;
			return array;
		},
		getRandomVector3OnLine: function () {
			const pos = new t3d__namespace.Vector3();
			return function (array, offset, start, end) {
				pos.lerpVectors(start, end, Math.random());
				pos.toArray(array, offset);
				return array;
			};
		}(),
		getRandomDirectionVector3OnSphere: function () {
			const v = new t3d__namespace.Vector3();
			return function (array, offset, speed, speedSpread, posX, posY, posZ, emitterPosition) {
				v.copy(emitterPosition);
				v.x -= posX;
				v.y -= posY;
				v.z -= posZ;
				v.normalize().multiplyScalar(-Utils.randomFloat(speed.x, speedSpread.x));
				v.toArray(array, offset);
				return array;
			};
		}(),
		getRandomDirectionVector3OnDisc: function () {
			const v = new t3d__namespace.Vector3();
			return function (array, offset, speed, speedSpread, posX, posY, posZ, emitterPosition) {
				v.copy(emitterPosition);
				v.x -= posX;
				v.y -= posY;
				v.z -= posZ;
				v.normalize().multiplyScalar(-Utils.randomFloat(speed.x, speedSpread.x));
				v.toArray(array, offset);
				array[offset + 2] = 0;
				return array;
			};
		}(),
		getRotationAxis: function () {
			const vSpread = new t3d__namespace.Vector3();

			/**
			 * Given a rotation axis, and a rotation axis spread vector,
			 * calculate a randomised rotation axis, and pack it into
			 * a hexadecimal value represented in decimal form.
			 * @param	{Vector3} out			 The instance of t3d.Vector3 to save the result to.
			 * @param	{Object} axis			 t3d.Vector3 instance describing the rotation axis.
			 * @param	{Object} axisSpread t3d.Vector3 instance describing the amount of randomness to apply to the rotation axis.
			 * @return {Number}						The packed rotation axis, with randomness.
			 */
			return function (out, axis, axisSpread) {
				out.copy(axis).normalize();
				vSpread.copy(axisSpread).normalize();
				out.x += -axisSpread.x * 0.5 + Math.random() * axisSpread.x;
				out.y += -axisSpread.y * 0.5 + Math.random() * axisSpread.y;
				out.z += -axisSpread.z * 0.5 + Math.random() * axisSpread.z;

				// v.x = Math.abs( v.x );
				// v.y = Math.abs( v.y );
				// v.z = Math.abs( v.z );

				out.normalize();
				return out;
			};
		}()
	};

	const ShaderChunks = {
		// Register color-packing define statements.
		defines: `
		#define PACKED_COLOR_SIZE 256.0
		#define PACKED_COLOR_DIVISOR 255.0
	`,
		// All uniforms used by vertex / fragment shaders
		uniforms: `
		uniform float deltaTime;
		uniform float runTime;
		uniform sampler2D tex;
		uniform vec4 textureAnimation;
		uniform float scale;
	`,
		// All attributes used by the vertex shader.
		// Note that some attributes are squashed into other ones:
		// * Drag is acceleration.w
		attributes: `
		attribute vec4 acceleration;
		attribute vec3 velocity;
		attribute vec4 rotation;
		attribute vec3 rotationCenter;
		attribute vec4 params;
		attribute vec4 size;
		attribute vec4 angle;
		attribute vec4 color;
		attribute vec4 opacity;
	`,
		//
		varyings: `
		varying vec4 vColor;

		#ifdef SHOULD_ROTATE_TEXTURE
			varying float vAngle;
		#endif

		#ifdef SHOULD_CALCULATE_SPRITE
			varying vec4 vSpriteSheet;
		#endif
	`,
		// Branch-avoiding comparison fns & logical operators
		// - http://theorangeduck.com/page/avoiding-shader-conditionals
		branchAvoidanceFunctions: `
		float when_gt(float x, float y) {
			return max(sign(x - y), 0.0);
		}

		float when_lt(float x, float y) {
			return min( max(1.0 - sign(x - y), 0.0), 1.0 );
		}

		float when_eq(float x, float y) {
			return 1.0 - abs(sign(x - y));
		}

		float when_ge(float x, float y) {
			return 1.0 - when_lt(x, y);
		}

		float when_le(float x, float y) {
			return 1.0 - when_gt(x, y);
		}

		float and(float a, float b) {
			return a * b;
		}

		float or(float a, float b) {
			return min(a + b, 1.0);
		}
	`,
		// From:
		// - http://stackoverflow.com/a/12553149
		// - https://stackoverflow.com/questions/22895237/hexadecimal-to-rgb-values-in-webgl-shader
		unpackColor: `
		vec3 unpackColor(in float hex) {
			vec3 c = vec3(0.0);
			float r = mod((hex / PACKED_COLOR_SIZE / PACKED_COLOR_SIZE), PACKED_COLOR_SIZE);
			float g = mod((hex / PACKED_COLOR_SIZE), PACKED_COLOR_SIZE);
			float b = mod(hex, PACKED_COLOR_SIZE);

			c.r = r / PACKED_COLOR_DIVISOR;
			c.g = g / PACKED_COLOR_DIVISOR;
			c.b = b / PACKED_COLOR_DIVISOR;

			return c;
		}
	`,
		unpackRotationAxis: `
		vec3 unpackRotationAxis(in float hex) {
			 vec3 c = vec3(0.0);

			 float r = mod((hex / PACKED_COLOR_SIZE / PACKED_COLOR_SIZE), PACKED_COLOR_SIZE);
			 float g = mod((hex / PACKED_COLOR_SIZE), PACKED_COLOR_SIZE);
			 float b = mod(hex, PACKED_COLOR_SIZE);

			 c.r = r / PACKED_COLOR_DIVISOR;
			 c.g = g / PACKED_COLOR_DIVISOR;
			 c.b = b / PACKED_COLOR_DIVISOR;

			 c *= vec3(2.0);
			 c -= vec3(1.0);

			 return c;
		}
	`,
		floatOverLifetime: `
		float getFloatOverLifetime(in float positionInTime, in vec4 attr) {
			float value = 0.0;
			float deltaAge = positionInTime * float(VALUE_OVER_LIFETIME_LENGTH - 1);
			float fIndex = 0.0;
			float shouldApplyValue = 0.0;

			// Fix for static emitters (age is always zero).
			value += attr[0] * when_eq(deltaAge, 0.0);

			for(int i = 0; i < VALUE_OVER_LIFETIME_LENGTH - 1; ++i) {
				fIndex = float(i);
				shouldApplyValue = and(when_gt(deltaAge, fIndex), when_le(deltaAge, fIndex + 1.0));
				value += shouldApplyValue * mix(attr[i], attr[i + 1], deltaAge - fIndex);
			}

			return value;
		}
	`,
		colorOverLifetime: `
		vec3 getColorOverLifetime(in float positionInTime, in vec3 color1, in vec3 color2, in vec3 color3, in vec3 color4) {
			vec3 value = vec3(0.0);
			value.x = getFloatOverLifetime(positionInTime, vec4(color1.x, color2.x, color3.x, color4.x));
			value.y = getFloatOverLifetime(positionInTime, vec4(color1.y, color2.y, color3.y, color4.y));
			value.z = getFloatOverLifetime(positionInTime, vec4(color1.z, color2.z, color3.z, color4.z));
			return value;
		}
	`,
		paramFetchingFunctions: `
		float getAlive() {
			return params.x;
		}

		float getAge() {
			return params.y;
		}

		float getMaxAge() {
			return params.z;
		}

		float getWiggle() {
			return params.w;
		}
	`,
		forceFetchingFunctions: `
		vec4 getPosition(in float age) {
			return u_View * u_Model * vec4(a_Position, 1.0);
		}

		vec3 getVelocity(in float age) {
			return velocity * age;
		}

		vec3 getAcceleration(in float age) {
			return acceleration.xyz * age;
		}
	`,
		// Huge thanks to:
		// - http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
		rotationFunctions: `
		#ifdef SHOULD_ROTATE_PARTICLES
			mat4 getRotationMatrix(in vec3 axis, in float angle) {
				axis = normalize(axis);
				float s = sin(angle);
				float c = cos(angle);
				float oc = 1.0 - c;

				return mat4(
					oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
					oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
					oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0,
					0.0, 0.0, 0.0, 1.0
				);
			}

			vec3 getRotation(in vec3 pos, in float positionInTime) {
				if(rotation.y == 0.0) {
					return pos;
				}

				vec3 axis = unpackRotationAxis(rotation.x);
				vec3 center = rotationCenter;
				vec3 translated;
				mat4 rotationMatrix;

				float angle = 0.0;
				angle += when_eq(rotation.z, 0.0) * rotation.y;
				angle += when_gt(rotation.z, 0.0) * mix(0.0, rotation.y, positionInTime);
				translated = rotationCenter - pos;
				rotationMatrix = getRotationMatrix(axis, angle);
				return center - vec3(rotationMatrix * vec4(translated, 0.0));
			}
		#endif
	`,
		rotateTexture: `
		vec2 vUv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);

		// Spritesheets overwrite angle calculations.
		#ifdef SHOULD_CALCULATE_SPRITE
			float framesX = vSpriteSheet.x;
			float framesY = vSpriteSheet.y;
			float columnNorm = vSpriteSheet.z;
			float rowNorm = vSpriteSheet.w;

			vUv.x = gl_PointCoord.x * framesX + columnNorm;
			vUv.y = 1.0 - (gl_PointCoord.y * framesY + rowNorm);
		#endif

		#ifdef SHOULD_ROTATE_TEXTURE
			#ifdef SHOULD_CALCULATE_SPRITE
				float x = vUv.x - framesX * 0.5 - columnNorm;
				float y = vUv.y - (1.0 - rowNorm) + framesY * 0.5;
				float c = cos(-vAngle);
				float s = sin(-vAngle);

				vUv = vec2(c * x + s * y + framesX * 0.5 + columnNorm, c * y - s * x + (1.0 - rowNorm) - framesY * 0.5);
			#else
				float x = vUv.x - 0.5;
				float y = vUv.y - 0.5;
				float c = cos(-vAngle);
				float s = sin(-vAngle);

				vUv = vec2(c * x + s * y + 0.5, c * y - s * x + 0.5);
			#endif
		#endif

		vec4 rotatedTexture = texture2D(tex, vUv);
	`
	};

	const ParticleShader = {
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

		${t3d.ShaderChunk.common_vert}
		${t3d.ShaderChunk.logdepthbuf_pars_vert}

		${ShaderChunks.branchAvoidanceFunctions}
		${ShaderChunks.unpackColor}
		${ShaderChunks.unpackRotationAxis}
		${ShaderChunks.floatOverLifetime}
		${ShaderChunks.colorOverLifetime}
		${ShaderChunks.paramFetchingFunctions}
		${ShaderChunks.forceFetchingFunctions}
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

			// Get forces & position
			vec3 vel = getVelocity(age);
			vec3 accel = getAcceleration(age);
			vec3 force = vec3(0.0);
			vec3 pos = vec3(a_Position);

			// Calculate the required drag to apply to the forces.
			float drag = 1.0 - (positionInTime * 0.5) * acceleration.w;

			// Integrate forces...
			force += vel;
			force *= drag;
			force += accel * age;
			pos += force;

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

			${t3d.ShaderChunk.logdepthbuf_vert}
		}
	`,
		fragmentShader: `
		${ShaderChunks.uniforms}

		${t3d.ShaderChunk.common_frag}
		${t3d.ShaderChunk.fog_pars_frag}
		${t3d.ShaderChunk.logdepthbuf_pars_frag}

		${ShaderChunks.varyings}

		${ShaderChunks.branchAvoidanceFunctions}

		void main() {
			vec3 outgoingLight = vColor.xyz;

			#ifdef ALPHATEST
				if (vColor.w < float(ALPHATEST)) discard;
			#endif

			${ShaderChunks.rotateTexture}

			${t3d.ShaderChunk.logdepthbuf_frag}

			outgoingLight = vColor.xyz * rotatedTexture.xyz;
			gl_FragColor = vec4(outgoingLight.xyz, rotatedTexture.w * vColor.w);

			${t3d.ShaderChunk.fog_frag}
		}
	`
	};

	/**
	 * A map of options to configure an Emitter instance.
	 *
	 * @typedef {Object} EmitterOptions
	 *
	 * @property {distribution} [type=BOX] The default distribution this emitter should use to control
	 *												 its particle's spawn position and force behaviour.
	 *												 Must be an ParticleProperties.distributions.* value.
	 *
	 *
	 * @property {Number} [particleCount=100] The total number of particles this emitter will hold. NOTE: this is not the number
	 *																	of particles emitted in a second, or anything like that. The number of particles
	 *																	emitted per-second is calculated by particleCount / maxAge (approximately!)
	 *
	 * @property {Number|null} [duration=null] The duration in seconds that this emitter should live for. If not specified, the emitter
	 *																				 will emit particles indefinitely.
	 *																				 NOTE: When an emitter is older than a specified duration, the emitter is NOT removed from
	 *																				 it's group, but rather is just marked as dead, allowing it to be reanimated at a later time
	 *																				 using `Emitter.prototype.enable()`.
	 *
	 * @property {Boolean} [isStatic=false] Whether this emitter should be not be simulated (true).
	 * @property {Boolean} [activeMultiplier=1] A value between 0 and 1 describing what percentage of this emitter's particlesPerSecond should be
	 *																					emitted, where 0 is 0%, and 1 is 100%.
	 *																					For example, having an emitter with 100 particles, a maxAge of 2, yields a particlesPerSecond
	 *																					value of 50. Setting `activeMultiplier` to 0.5, then, will only emit 25 particles per second (0.5 = 50%).
	 *																					Values greater than 1 will emulate a burst of particles, causing the emitter to run out of particles
	 *																					before it's next activation cycle.
	 *
	 * @property {Boolean} [direction=1] The direction of the emitter. If value is `1`, emitter will start at beginning of particle's lifecycle.
	 *																	 If value is `-1`, emitter will start at end of particle's lifecycle and work it's way backwards.
	 *
	 * @property {Object} [maxAge={}] An object describing the particle's maximum age in seconds.
	 * @property {Number} [maxAge.value=2] A number between 0 and 1 describing the amount of maxAge to apply to all particles.
	 * @property {Number} [maxAge.spread=0] A number describing the maxAge variance on a per-particle basis.
	 *
	 *
	 * @property {Object} [position={}] An object describing this emitter's position.
	 * @property {Object} [position.value=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's base position.
	 * @property {Object} [position.spread=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's position variance on a per-particle basis.
	 *																													Note that when using a SPHERE or DISC distribution, only the x-component
	 *																													of this vector is used.
	 *																													When using a LINE distribution, this value is the endpoint of the LINE.
	 * @property {Object} [position.spreadClamp=new t3d.Vector3()] A t3d.Vector3 instance describing the numeric multiples the particle's should
	 *																															 be spread out over.
	 *																															 Note that when using a SPHERE or DISC distribution, only the x-component
	 *																															 of this vector is used.
	 *																															 When using a LINE distribution, this property is ignored.
	 * @property {Number} [position.radius=10] This emitter's base radius.
	 * @property {Object} [position.radiusScale=new t3d.Vector3()] A t3d.Vector3 instance describing the radius's scale in all three axes. Allows a SPHERE or DISC to be squashed or stretched.
	 * @property {distribution} [position.distribution=value of the `type` option.] A specific distribution to use when radiusing particles. Overrides the `type` option.
	 * @property {Boolean} [position.randomise=false] When a particle is re-spawned, whether it's position should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [velocity={}] An object describing this particle velocity.
	 * @property {Object} [velocity.value=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's base velocity.
	 * @property {Object} [velocity.spread=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's velocity variance on a per-particle basis.
	 *																													Note that when using a SPHERE or DISC distribution, only the x-component
	 *																													of this vector is used.
	 * @property {distribution} [velocity.distribution=value of the `type` option.] A specific distribution to use when calculating a particle's velocity. Overrides the `type` option.
	 * @property {Boolean} [velocity.randomise=false] When a particle is re-spawned, whether it's velocity should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [acceleration={}] An object describing this particle's acceleration.
	 * @property {Object} [acceleration.value=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's base acceleration.
	 * @property {Object} [acceleration.spread=new t3d.Vector3()] A t3d.Vector3 instance describing this emitter's acceleration variance on a per-particle basis.
	 *													 Note that when using a SPHERE or DISC distribution, only the x-component
	 *													 of this vector is used.
	 * @property {distribution} [acceleration.distribution=value of the `type` option.] A specific distribution to use when calculating a particle's acceleration. Overrides the `type` option.
	 * @property {Boolean} [acceleration.randomise=false] When a particle is re-spawned, whether it's acceleration should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [drag={}] An object describing this particle drag. Drag is applied to both velocity and acceleration values.
	 * @property {Number} [drag.value=0] A number between 0 and 1 describing the amount of drag to apply to all particles.
	 * @property {Number} [drag.spread=0] A number describing the drag variance on a per-particle basis.
	 * @property {Boolean} [drag.randomise=false] When a particle is re-spawned, whether it's drag should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [wiggle={}] This is quite a fun one! The values of this object will determine whether a particle will wiggle, or jiggle, or wave,
	 *																or shimmy, or waggle, or... Well you get the idea. The wiggle is calculated over-time, meaning that a particle will
	 *																start off with no wiggle, and end up wiggling about with the distance of the `value` specified by the time it dies.
	 *																It's quite handy to simulate fire embers, or similar effects where the particle's position should slightly change over
	 *																time, and such change isn't easily controlled by rotation, velocity, or acceleration. The wiggle is a combination of sin and cos calculations, so is circular in nature.
	 * @property {Number} [wiggle.value=0] A number describing the amount of wiggle to apply to all particles. It's measured in distance.
	 * @property {Number} [wiggle.spread=0] A number describing the wiggle variance on a per-particle basis.
	 *
	 *
	 * @property {Object} [rotation={}] An object describing this emitter's rotation. It can either be static, or set to rotate from 0radians to the value of `rotation.value`
	 *																	over a particle's lifetime. Rotation values affect both a particle's position and the forces applied to it.
	 * @property {Object} [rotation.axis=new t3d.Vector3(0, 1, 0)] A t3d.Vector3 instance describing this emitter's axis of rotation.
	 * @property {Object} [rotation.axisSpread=new t3d.Vector3()] A t3d.Vector3 instance describing the amount of variance to apply to the axis of rotation on
	 *																															a per-particle basis.
	 * @property {Number} [rotation.angle=0] The angle of rotation, given in radians. If `rotation.static` is true, the emitter will start off rotated at this angle, and stay as such.
	 *																			 Otherwise, the particles will rotate from 0radians to this value over their lifetimes.
	 * @property {Number} [rotation.angleSpread=0] The amount of variance in each particle's rotation angle.
	 * @property {Boolean} [rotation.static=false] Whether the rotation should be static or not.
	 * @property {Object} [rotation.center=The value of `position.value`] A t3d.Vector3 instance describing the center point of rotation.
	 * @property {Boolean} [rotation.randomise=false] When a particle is re-spawned, whether it's rotation should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [color={}] An object describing a particle's color. This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
	 *															 given to describe specific value changes over a particle's lifetime.
	 *															 Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of t3d.Color3 instances are given, then the array will be interpolated to
	 *															 have a length matching the value of ParticleProperties.valueOverLifetimeLength.
	 * @property {Object} [color.value=new t3d.Color3()] Either a single t3d.Color3 instance, or an array of t3d.Color3 instances to describe the color of a particle over it's lifetime.
	 * @property {Object} [color.spread=new t3d.Vector3()] Either a single t3d.Vector3 instance, or an array of t3d.Vector3 instances to describe the color variance of a particle over it's lifetime.
	 * @property {Boolean} [color.randomise=false] When a particle is re-spawned, whether it's color should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [opacity={}] An object describing a particle's opacity. This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
	 *															 given to describe specific value changes over a particle's lifetime.
	 *															 Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of numbers are given, then the array will be interpolated to
	 *															 have a length matching the value of ParticleProperties.valueOverLifetimeLength.
	 * @property {Number} [opacity.value=1] Either a single number, or an array of numbers to describe the opacity of a particle over it's lifetime.
	 * @property {Number} [opacity.spread=0] Either a single number, or an array of numbers to describe the opacity variance of a particle over it's lifetime.
	 * @property {Boolean} [opacity.randomise=false] When a particle is re-spawned, whether it's opacity should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [size={}] An object describing a particle's size. This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
	 *															 given to describe specific value changes over a particle's lifetime.
	 *															 Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of numbers are given, then the array will be interpolated to
	 *															 have a length matching the value of ParticleProperties.valueOverLifetimeLength.
	 * @property {Number} [size.value=1] Either a single number, or an array of numbers to describe the size of a particle over it's lifetime.
	 * @property {Number} [size.spread=0] Either a single number, or an array of numbers to describe the size variance of a particle over it's lifetime.
	 * @property {Boolean} [size.randomise=false] When a particle is re-spawned, whether it's size should be re-randomised or not. Can incur a performance hit.
	 *
	 *
	 * @property {Object} [angle={}] An object describing a particle's angle. The angle is a 2d-rotation, measured in radians, applied to the particle's texture.
	 *															 NOTE: if a particle's texture is a sprite-sheet, this value IS IGNORED.
	 *															 This property is a "value-over-lifetime" property, meaning an array of values and spreads can be
	 *															 given to describe specific value changes over a particle's lifetime.
	 *															 Depending on the value of ParticleProperties.valueOverLifetimeLength, if arrays of numbers are given, then the array will be interpolated to
	 *															 have a length matching the value of ParticleProperties.valueOverLifetimeLength.
	 * @property {Number} [angle.value=0] Either a single number, or an array of numbers to describe the angle of a particle over it's lifetime.
	 * @property {Number} [angle.spread=0] Either a single number, or an array of numbers to describe the angle variance of a particle over it's lifetime.
	 * @property {Boolean} [angle.randomise=false] When a particle is re-spawned, whether it's angle should be re-randomised or not. Can incur a performance hit.
	 *
	 */

	class AbstractParticleEmitter {
		constructor(options) {
			this.uuid = t3d__namespace.generateUUID();
			const types = Utils.types,
				lifetimeLength = ParticleProperties.valueOverLifetimeLength;

			// Ensure we have a map of options to play with,
			// and that each option is in the correct format.

			options = Utils.ensureTypedArg(options, types.OBJECT, {});
			options.position = Utils.ensureTypedArg(options.position, types.OBJECT, {});
			options.velocity = Utils.ensureTypedArg(options.velocity, types.OBJECT, {});
			options.acceleration = Utils.ensureTypedArg(options.acceleration, types.OBJECT, {});
			options.radius = Utils.ensureTypedArg(options.radius, types.OBJECT, {});
			options.drag = Utils.ensureTypedArg(options.drag, types.OBJECT, {});
			options.rotation = Utils.ensureTypedArg(options.rotation, types.OBJECT, {});
			options.color = Utils.ensureTypedArg(options.color, types.OBJECT, {});
			options.opacity = Utils.ensureTypedArg(options.opacity, types.OBJECT, {});
			options.size = Utils.ensureTypedArg(options.size, types.OBJECT, {});
			options.angle = Utils.ensureTypedArg(options.angle, types.OBJECT, {});
			options.wiggle = Utils.ensureTypedArg(options.wiggle, types.OBJECT, {});
			options.maxAge = Utils.ensureTypedArg(options.maxAge, types.OBJECT, {});
			this.type = Utils.ensureTypedArg(options.type, types.NUMBER, ParticleProperties.distributions.BOX);

			// Start assigning properties...kicking it off with props that DON'T support values over
			// lifetimes.

			this.position = {
				_value: Utils.ensureInstanceOf(options.position.value, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_spread: Utils.ensureInstanceOf(options.position.spread, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_spreadClamp: Utils.ensureInstanceOf(options.position.spreadClamp, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_distribution: options.position.distribution || this.type,
				_randomise: Utils.ensureTypedArg(options.position.randomise, types.BOOLEAN, false),
				_radius: Utils.ensureTypedArg(options.position.radius, types.NUMBER, 10),
				_radiusScale: Utils.ensureInstanceOf(options.position.radiusScale, t3d__namespace.Vector3, new t3d__namespace.Vector3(1, 1, 1))
			};
			this._setDistributeFunctions('position', this.position._distribution);
			this.velocity = {
				_value: Utils.ensureInstanceOf(options.velocity.value, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_spread: Utils.ensureInstanceOf(options.velocity.spread, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_distribution: options.velocity.distribution || this.type,
				_randomise: Utils.ensureTypedArg(options.velocity.randomise, types.BOOLEAN, false)
			};
			this._setDistributeFunctions('velocity', this.velocity._distribution);
			this.acceleration = {
				_value: Utils.ensureInstanceOf(options.acceleration.value, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_spread: Utils.ensureInstanceOf(options.acceleration.spread, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_distribution: options.acceleration.distribution || this.type,
				_randomise: Utils.ensureTypedArg(options.acceleration.randomise, types.BOOLEAN, false)
			};
			this._setDistributeFunctions('acceleration', this.acceleration._distribution);
			this.drag = {
				_value: Utils.ensureTypedArg(options.drag.value, types.NUMBER, 0),
				_spread: Utils.ensureTypedArg(options.drag.spread, types.NUMBER, 0),
				_randomise: Utils.ensureTypedArg(options.drag.randomise, types.BOOLEAN, false)
			};
			this.wiggle = {
				_value: Utils.ensureTypedArg(options.wiggle.value, types.NUMBER, 0),
				_spread: Utils.ensureTypedArg(options.wiggle.spread, types.NUMBER, 0)
			};
			this.rotation = {
				_axis: Utils.ensureInstanceOf(options.rotation.axis, t3d__namespace.Vector3, new t3d__namespace.Vector3(0.0, 1.0, 0.0)),
				_axisSpread: Utils.ensureInstanceOf(options.rotation.axisSpread, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_angle: Utils.ensureTypedArg(options.rotation.angle, types.NUMBER, 0),
				_angleSpread: Utils.ensureTypedArg(options.rotation.angleSpread, types.NUMBER, 0),
				_static: Utils.ensureTypedArg(options.rotation.static, types.BOOLEAN, false),
				_center: Utils.ensureInstanceOf(options.rotation.center, t3d__namespace.Vector3, this.position._value.clone()),
				_randomise: Utils.ensureTypedArg(options.rotation.randomise, types.BOOLEAN, false)
			};
			this.maxAge = {
				_value: Utils.ensureTypedArg(options.maxAge.value, types.NUMBER, 2),
				_spread: Utils.ensureTypedArg(options.maxAge.spread, types.NUMBER, 0)
			};

			// The following properties can support either single values, or an array of values that change
			// the property over a particle's lifetime (value over lifetime).

			this.color = {
				_value: Utils.ensureArrayInstanceOf(options.color.value, t3d__namespace.Color3, new t3d__namespace.Color3(1, 1, 1)),
				_spread: Utils.ensureArrayInstanceOf(options.color.spread, t3d__namespace.Vector3, new t3d__namespace.Vector3()),
				_randomise: Utils.ensureTypedArg(options.color.randomise, types.BOOLEAN, false)
			};
			this.opacity = {
				_value: Utils.ensureArrayTypedArg(options.opacity.value, types.NUMBER, 1),
				_spread: Utils.ensureArrayTypedArg(options.opacity.spread, types.NUMBER, 0),
				_randomise: Utils.ensureTypedArg(options.opacity.randomise, types.BOOLEAN, false)
			};
			this.size = {
				_value: Utils.ensureArrayTypedArg(options.size.value, types.NUMBER, 1),
				_spread: Utils.ensureArrayTypedArg(options.size.spread, types.NUMBER, 0),
				_randomise: Utils.ensureTypedArg(options.size.randomise, types.BOOLEAN, false)
			};
			this.angle = {
				_value: Utils.ensureArrayTypedArg(options.angle.value, types.NUMBER, 0),
				_spread: Utils.ensureArrayTypedArg(options.angle.spread, types.NUMBER, 0),
				_randomise: Utils.ensureTypedArg(options.angle.randomise, types.BOOLEAN, false)
			};

			// A set of flags to determine whether particular properties
			// should be re-randomised when a particle is reset.
			//
			// If a `randomise` property is given, this is preferred.
			// Otherwise, it looks at whether a spread value has been
			// given.
			//
			// It allows randomization to be turned off as desired. If
			// all randomization is turned off, then I'd expect a performance
			// boost as no attribute buffers (excluding the `params`)
			// would have to be re-passed to the GPU each frame (since nothing
			// except the `params` attribute would have changed).
			this.resetFlags = {
				// params: Utils.ensureTypedArg( options.maxAge.randomise, types.BOOLEAN, !!options.maxAge.spread ) ||
				//		 Utils.ensureTypedArg( options.wiggle.randomise, types.BOOLEAN, !!options.wiggle.spread ),
				position: Utils.ensureTypedArg(options.position.randomise, types.BOOLEAN, false) || Utils.ensureTypedArg(options.radius.randomise, types.BOOLEAN, false),
				velocity: Utils.ensureTypedArg(options.velocity.randomise, types.BOOLEAN, false),
				acceleration: Utils.ensureTypedArg(options.acceleration.randomise, types.BOOLEAN, false) || Utils.ensureTypedArg(options.drag.randomise, types.BOOLEAN, false),
				rotation: Utils.ensureTypedArg(options.rotation.randomise, types.BOOLEAN, false),
				// rotationCenter: Utils.ensureTypedArg(options.rotation.randomise, types.BOOLEAN, false),
				size: Utils.ensureTypedArg(options.size.randomise, types.BOOLEAN, false),
				color: Utils.ensureTypedArg(options.color.randomise, types.BOOLEAN, false),
				opacity: Utils.ensureTypedArg(options.opacity.randomise, types.BOOLEAN, false),
				angle: Utils.ensureTypedArg(options.angle.randomise, types.BOOLEAN, false)
			};
			this.updateFlags = {};
			this.updateCounts = {};

			// A map to indicate which emitter parameters should update
			// which attribute.
			this.updateMap = {
				maxAge: 'params',
				position: 'position',
				velocity: 'velocity',
				acceleration: 'acceleration',
				drag: 'acceleration',
				wiggle: 'params',
				rotation: 'rotation',
				size: 'size',
				color: 'color',
				opacity: 'opacity',
				angle: 'angle'
			};
			for (const i in this.updateMap) {
				if (this.updateMap.hasOwnProperty(i)) {
					this.updateCounts[this.updateMap[i]] = 0.0;
					this.updateFlags[this.updateMap[i]] = false;
					this._createGetterSetters(this[i], i);
				}
			}

			// Ensure that the value-over-lifetime property objects above
			// have value and spread properties that are of the same length.
			//
			// Also, for now, make sure they have a length of 4 (min/max arguments here).

			Utils.ensureValueOverLifetimeCompliance(this.color, lifetimeLength, lifetimeLength);
			Utils.ensureValueOverLifetimeCompliance(this.opacity, lifetimeLength, lifetimeLength);
			Utils.ensureValueOverLifetimeCompliance(this.size, lifetimeLength, lifetimeLength);
			Utils.ensureValueOverLifetimeCompliance(this.angle, lifetimeLength, lifetimeLength);

			// Assign renaining option values.

			this.particleCount = Utils.ensureTypedArg(options.particleCount, types.NUMBER, 100);
			this.duration = Utils.ensureTypedArg(options.duration, types.NUMBER, null);
			this.isStatic = Utils.ensureTypedArg(options.isStatic, types.BOOLEAN, false);
			this.activeMultiplier = Utils.ensureTypedArg(options.activeMultiplier, types.NUMBER, 1);
			this.direction = Utils.ensureTypedArg(options.direction, types.NUMBER, 1);

			// For mesh particles

			this.isLookAtCamera = Utils.ensureTypedArg(options.isLookAtCamera, types.BOOLEAN, false);
			this.isLookAtCameraOnlyY = Utils.ensureTypedArg(options.isLookAtCameraOnlyY, types.BOOLEAN, false);

			// Whether this emitter is alive or not.
			this.alive = Utils.ensureTypedArg(options.alive, types.BOOLEAN, true);

			// The following properties are set internally and are not
			// user-controllable.

			this.particlesPerSecond = 0;
			this.calculatePPSValue();

			// Holds the time the emitter has been alive for.
			this.age = 0.0;

			// Holds a reference to this emitter's group once
			// it's added to one.
			this.group = null;
		}
		_createGetterSetters(propObj, propName) {
			const self = this;
			for (const i in propObj) {
				if (propObj.hasOwnProperty(i)) {
					const name = i.replace('_', '');
					Object.defineProperty(propObj, name, {
						get: function (prop) {
							return function () {
								return this[prop];
							};
						}(i),
						set: function (prop) {
							return function (value) {
								const mapName = self.updateMap[propName],
									prevValue = this[prop],
									length = ParticleProperties.valueOverLifetimeLength;
								if (prop === '_randomise') {
									self.resetFlags[mapName] = value;
								} else {
									if (prop === '_distribution') {
										self._setDistributeFunctions(mapName, value);
									}
									self.updateFlags[mapName] = true;
									self.updateCounts[mapName] = 0.0;
								}
								this[prop] = value;
								self.group.$updateDefines(self);

								// If the previous value was an array, then make
								// sure the provided value is interpolated correctly.
								if (Array.isArray(prevValue)) {
									Utils.ensureValueOverLifetimeCompliance(self[propName], length, length);
								}
							};
						}(i)
					});
				}
			}
		}

		/**
		 * Calculate the `particlesPerSecond` value for this emitter. It's used
		 * when determining which particles should die and which should live to
		 * see another day. Or be born, for that matter. The "God" property.
		 */
		calculatePPSValue() {
			const particleCount = this.particleCount;
			const maxAge = this.maxAge._value + Math.abs(this.maxAge._spread * 0.5);
			if (this.duration !== null) {
				this.particlesPerSecond = particleCount / Math.min(maxAge, this.duration);
			} else {
				this.particlesPerSecond = particleCount / maxAge;
			}
			return this;
		}

		/**
		 * Enables the emitter. If not already enabled, the emitter
		 * will start emitting particles.
		 *
		 * @return {Emitter} This emitter instance.
		 */
		enable() {
			this.alive = true;
			return this;
		}

		/**
		 * Disables th emitter, but does not instantly remove it's
		 * particles fromt the scene. When called, the emitter will be
		 * 'switched off' and just stop emitting. Any particle's alive will
		 * be allowed to finish their lifecycle.
		 *
		 * @return {Emitter} This emitter instance.
		 */
		disable() {
			this.alive = false;
			return this;
		}

		/**
		 * Remove this emitter from it's parent group (if it has been added to one).
		 * Delgates to ParticleGroup.prototype.removeEmitter().
		 *
		 * When called, all particle's belonging to this emitter will be instantly
		 * removed from the scene.
		 *
		 * @return {Emitter} This emitter instance.
		 *
		 * @see ParticleGroup.prototype.removeEmitter
		 */
		remove() {
			if (this.group !== null) {
				this.group.removeEmitter(this);
			} else {
				console.error('Emitter does not belong to a group, cannot remove.');
			}
			return this;
		}
		reset(force) {}
		_assignValue() {}
		_assignPositionValue(array, offset) {
			const prop = this.position,
				value = prop._value,
				spread = prop._spread,
				spreadClamp = prop._spreadClamp;
			prop._getDistributionFunction(array, offset, value, spread, spreadClamp, prop._radius, prop._radiusScale);
			return array;
		}
		_assignForceValue(array, offset, attrName, particlePos) {
			const prop = this[attrName],
				value = prop._value,
				spread = prop._spread;
			prop._getDistributionFunction(array, offset, value, spread, particlePos[0], particlePos[1], particlePos[2], this.position._value);
			if (attrName === 'acceleration') {
				const drag = Utils.clamp(Utils.randomFloat(this.drag._value, this.drag._spread), 0, 1);
				array[offset + 3] = drag;
			}
			return array;
		}
		_assignAbsLifetimeValue(array, offset, attrName) {
			const prop = this[attrName];
			if (Utils.arrayValuesAreEqual(prop._value) && Utils.arrayValuesAreEqual(prop._spread)) {
				const value = Math.abs(Utils.randomFloat(prop._value[0], prop._spread[0]));
				array[offset + 0] = value;
				array[offset + 1] = value;
				array[offset + 2] = value;
				array[offset + 3] = value;
			} else {
				array[offset + 0] = Math.abs(Utils.randomFloat(prop._value[0], prop._spread[0]));
				array[offset + 1] = Math.abs(Utils.randomFloat(prop._value[1], prop._spread[1]));
				array[offset + 2] = Math.abs(Utils.randomFloat(prop._value[2], prop._spread[2]));
				array[offset + 3] = Math.abs(Utils.randomFloat(prop._value[3], prop._spread[3]));
			}
			return array;
		}
		_assignAngleValue(array, offset) {
			const prop = this.angle;
			if (Utils.arrayValuesAreEqual(prop._value) && Utils.arrayValuesAreEqual(prop._spread)) {
				const value = Utils.randomFloat(prop._value[0], prop._spread[0]);
				array[offset + 0] = value;
				array[offset + 1] = value;
				array[offset + 2] = value;
				array[offset + 3] = value;
			} else {
				array[offset + 0] = Utils.randomFloat(prop._value[0], prop._spread[0]);
				array[offset + 1] = Utils.randomFloat(prop._value[1], prop._spread[1]);
				array[offset + 2] = Utils.randomFloat(prop._value[2], prop._spread[2]);
				array[offset + 3] = Utils.randomFloat(prop._value[3], prop._spread[3]);
			}
			return array;
		}
		_assignParamsValue(array, offset, init) {
			if (init) {
				array[offset + 0] = this.isStatic ? 1 : 0;
			} else {
				array[offset + 0] = 1;
			}
			array[offset + 1] = 0;
			array[offset + 2] = Utils.randomFloat(this.maxAge._value, this.maxAge._spread);
			array[offset + 3] = Utils.randomFloat(this.wiggle._value, this.wiggle._spread);
			return array;
		}
		_assignRotationValue(array, offset, array2, offset2, pack) {
			const rotationAxis = Utils.getRotationAxis(_vec3_1$1, this.rotation._axis, this.rotation._axisSpread);
			if (pack) {
				rotationAxis.x += 1;
				rotationAxis.y += 1;
				rotationAxis.z += 1;
				rotationAxis.multiplyScalar(0.5);
				_col3_1.setRGB(rotationAxis.x, rotationAxis.y, rotationAxis.z);
				array[offset + 0] = _col3_1.getHex();
				array[offset + 1] = Utils.randomFloat(this.rotation._angle, this.rotation._angleSpread);
				array[offset + 2] = this.rotation._static ? 0 : 1;
			} else {
				array[offset + 0] = rotationAxis.x;
				array[offset + 1] = rotationAxis.y;
				array[offset + 2] = rotationAxis.z;
				array[offset + 3] = Utils.randomFloat(this.rotation._angle, this.rotation._angleSpread);
				array[offset + 4] = this.rotation._static ? 0 : 1;
			}
			this.rotation._center.toArray(array2, offset2);
		}
		_assignColorValue(array, offset, pack) {
			const base = this.color._value;
			const spread = this.color._spread;
			const numItems = base.length;
			for (let i = 0; i < numItems; ++i) {
				const spreadVector = spread[i];
				_col3_1.copy(base[i]);
				_col3_1.r += Math.random() * spreadVector.x - spreadVector.x * 0.5;
				_col3_1.g += Math.random() * spreadVector.y - spreadVector.y * 0.5;
				_col3_1.b += Math.random() * spreadVector.z - spreadVector.z * 0.5;
				_col3_1.r = Utils.clamp(_col3_1.r, 0, 1);
				_col3_1.g = Utils.clamp(_col3_1.g, 0, 1);
				_col3_1.b = Utils.clamp(_col3_1.b, 0, 1);
				if (pack) {
					array[offset + i] = _col3_1.getHex();
				} else {
					_col3_1.toArray(array, offset + i * 3);
				}
			}
		}
		_setDistributeFunctions(attributeName, type) {
			if (typeof type === 'function') {
				this[attributeName]._getDistributionFunction = type;
			} else {
				this[attributeName]._getDistributionFunction = getRandomFunctions[attributeName][type];
			}
		}
	}
	const _vec3_1$1 = new t3d__namespace.Vector3();
	const _col3_1 = new t3d__namespace.Color3();
	const getRandomFunctions = {
		'position': {
			1: Utils.getRandomVector3,
			2: Utils.getRandomVector3OnSphere,
			3: Utils.getRandomVector3OnDisc,
			4: Utils.getRandomVector3OnLine
		},
		'velocity': {
			1: Utils.getRandomVector3,
			2: Utils.getRandomDirectionVector3OnSphere,
			3: Utils.getRandomDirectionVector3OnDisc,
			4: Utils.getRandomVector3OnLine
		},
		'acceleration': {
			1: Utils.getRandomVector3,
			2: Utils.getRandomDirectionVector3OnSphere,
			3: Utils.getRandomDirectionVector3OnDisc,
			4: Utils.getRandomVector3OnLine
		}
	};

	class ParticleEmitter extends AbstractParticleEmitter {
		constructor(options) {
			super(options);

			// The following properties are set internally and are not
			// user-controllable.

			// The current particle index for which particles should
			// be marked as active on the next update cycle.
			this.activationIndex = 0;

			// The offset in the typed arrays this emitter's
			// particle's values will start at
			this.attributeOffset = 0;

			// The end of the range in the attribute buffers
			this.attributeEnd = 0;

			// Holds the number of currently-alive particles
			this.activeParticleCount = 0.0;

			// Holds a reference to this emitter's group's attributes object
			// for easier access.
			this.attributes = null;
			this.bufferUpdateRanges = {};
			this.attributeKeys = null;
			this.attributeCount = 0;
		}

		/**
		 * Simulates one frame's worth of particles, updating particles
		 * that are already alive, and marking ones that are currently dead
		 * but should be alive as alive.
		 *
		 * If the emitter is marked as static, then this function will do nothing.
		 *
		 * @param	{Number} dt The number of seconds to simulate (deltaTime)
		 */
		tick(dt) {
			if (this.isStatic) {
				return;
			}
			const start = this.attributeOffset,
				end = start + this.particleCount,
				params = this.attributes.params.buffer.array,
				// vec3( alive, age, maxAge, wiggle )
				ppsDt = this.particlesPerSecond * this.activeMultiplier * dt,
				activationIndex = this.activationIndex;

			// Reset the buffer update indices.
			this._resetBufferRanges();

			// Increment age for those particles that are alive,
			// and kill off any particles whose age is over the limit.
			this._checkParticleAges(start, end, params, dt);

			// If the emitter is dead, reset the age of the emitter to zero,
			// ready to go again if required
			if (this.alive === false) {
				this.age = 0.0;
				return;
			}

			// If the emitter has a specified lifetime and we've exceeded it,
			// mark the emitter as dead.
			if (this.duration !== null && this.age > this.duration) {
				this.alive = false;
				this.age = 0.0;
				return;
			}
			const activationStart = this.particleCount === 1 ? activationIndex : activationIndex | 0,
				activationEnd = Math.min(activationStart + ppsDt, this.activationEnd),
				activationCount = activationEnd - this.activationIndex | 0,
				dtPerParticle = activationCount > 0 ? dt / activationCount : 0;
			this._activateParticles(activationStart, activationEnd, params, dtPerParticle);

			// Move the activation window forward, soldier.
			this.activationIndex += ppsDt;
			if (this.activationIndex > end) {
				this.activationIndex = start;
			}

			// Increment the age of the emitter.
			this.age += dt;
		}

		/**
		 * Resets all the emitter's particles to their start positions
		 * and marks the particles as dead if the `force` argument is
		 * true.
		 *
		 * @param	{Boolean} [force=undefined] If true, all particles will be marked as dead instantly.
		 * @return {ParticleEmitter}			 This emitter instance.
		 */
		reset(force) {
			this.age = 0.0;
			this.alive = false;
			if (force === true) {
				const start = this.attributeOffset,
					end = start + this.particleCount,
					array = this.attributes.params.buffer.array,
					attr = this.attributes.params;
				for (let i = end - 1, index; i >= start; --i) {
					index = i * 4;
					array[index] = 0.0;
					array[index + 1] = 0.0;
				}
				attr.updateRange.offset = 0;
				attr.updateRange.count = -1;
				attr.needsUpdate = true;
			}
			return this;
		}
		_assignValue(prop, index, init = false) {
			let typedArray, typedArray2, positionX, positionY, positionZ;
			switch (prop) {
				case 'position':
					typedArray = this.attributes.position.buffer.array;
					this._assignPositionValue(typedArray, this.attributes.position.size * index);
					break;
				case 'velocity':
				case 'acceleration':
					typedArray = this.attributes.position.buffer.array;

					// Ensure position values aren't zero? otherwise no force will be applied.
					positionX = typedArray[index * 3 + 0];
					positionY = typedArray[index * 3 + 1];
					positionZ = typedArray[index * 3 + 2];
					typedArray = this.attributes[prop].buffer.array;
					this._assignForceValue(typedArray, this.attributes[prop].size * index, prop, [positionX, positionY, positionZ]);
					break;
				case 'size':
				case 'opacity':
					typedArray = this.attributes[prop].buffer.array;
					this._assignAbsLifetimeValue(typedArray, this.attributes[prop].size * index, prop);
					break;
				case 'angle':
					typedArray = this.attributes.angle.buffer.array;
					this._assignAngleValue(typedArray, this.attributes.angle.size * index);
					break;
				case 'params':
					typedArray = this.attributes.params.buffer.array;
					this._assignParamsValue(typedArray, this.attributes.params.size * index, init);
					break;
				case 'rotation':
					typedArray = this.attributes.rotation.buffer.array;
					typedArray2 = this.attributes.rotationCenter.buffer.array;
					this._assignRotationValue(typedArray, this.attributes.rotation.size * index, typedArray2, this.attributes.rotationCenter.size * index, true);
					break;
				case 'color':
					typedArray = this.attributes.color.buffer.array;
					this._assignColorValue(typedArray, this.attributes.color.size * index, true);
					break;
			}
		}
		_resetParticle(index) {
			const resetFlags = this.resetFlags,
				updateFlags = this.updateFlags,
				updateCounts = this.updateCounts,
				keys = this.attributeKeys;
			let key, updateFlag;
			for (let i = this.attributeCount - 1; i >= 0; --i) {
				key = keys[i];
				updateFlag = updateFlags[key];
				if (resetFlags[key] === true || updateFlag === true) {
					this._assignValue(key, index);
					this._updateAttributeUpdateRange(key, index);
					if (updateFlag === true && updateCounts[key] === this.particleCount) {
						updateFlags[key] = false;
						updateCounts[key] = 0.0;
					} else if (updateFlag == true) {
						++updateCounts[key];
					}
				}
			}
		}
		_setBufferUpdateRanges(keys) {
			this.attributeKeys = keys;
			this.attributeCount = keys.length;
			for (let i = this.attributeCount - 1; i >= 0; --i) {
				this.bufferUpdateRanges[keys[i]] = {
					min: Number.POSITIVE_INFINITY,
					max: Number.NEGATIVE_INFINITY
				};
			}
		}
		_setAttributeOffset(startIndex) {
			this.attributeOffset = startIndex;
			this.activationIndex = startIndex;
			this.activationEnd = startIndex + this.particleCount;
		}
		_updateAttributeUpdateRange(attr, i) {
			const ranges = this.bufferUpdateRanges[attr];
			ranges.min = Math.min(i, ranges.min);
			ranges.max = Math.max(i, ranges.max);
			if (attr === 'rotation') {
				this._updateAttributeUpdateRange('rotationCenter', i);
			}
		}
		_resetBufferRanges() {
			const ranges = this.bufferUpdateRanges,
				keys = this.bufferUpdateKeys;
			let i = this.bufferUpdateCount - 1,
				key;
			for (i; i >= 0; --i) {
				key = keys[i];
				ranges[key].min = Number.POSITIVE_INFINITY;
				ranges[key].max = Number.NEGATIVE_INFINITY;
			}
		}
		_onRemove() {
			// Reset any properties of the emitter that were set by
			// a group when it was added.
			this.particlesPerSecond = 0;
			this.attributeOffset = 0;
			this.activationIndex = 0;
			this.activeParticleCount = 0;
			this.group = null;
			this.attributes = null;
			this.age = 0.0;
		}
		_decrementParticleCount() {
			--this.activeParticleCount;

			// TODO:
			//	- Trigger event if count === 0.
		}
		_incrementParticleCount() {
			++this.activeParticleCount;

			// TODO:
			//	- Trigger event if count === this.particleCount.
		}
		_checkParticleAges(start, end, params, dt) {
			for (let i = end - 1, index, maxAge, age, alive; i >= start; --i) {
				index = i * 4;
				alive = params[index];
				if (alive === 0.0) {
					continue;
				}

				// Increment age
				age = params[index + 1];
				maxAge = params[index + 2];
				if (this.direction === 1) {
					age += dt;
					if (age >= maxAge) {
						age = 0.0;
						alive = 0.0;
						this._decrementParticleCount();
					}
				} else {
					age -= dt;
					if (age <= 0.0) {
						age = maxAge;
						alive = 0.0;
						this._decrementParticleCount();
					}
				}
				params[index] = alive;
				params[index + 1] = age;
				this._updateAttributeUpdateRange('params', i);
			}
		}
		_activateParticles(activationStart, activationEnd, params, dtPerParticle) {
			const direction = this.direction;
			for (let i = activationStart, index, dtValue; i < activationEnd; ++i) {
				index = i * 4;

				// Don't re-activate particles that aren't dead yet.
				if (params[index] != 0.0 && this.particleCount !== 1) {
					continue;
				}

				// Increment the active particle count.
				this._incrementParticleCount();

				// Mark the particle as alive.
				params[index] = 1.0;

				// Reset the particle
				this._resetParticle(i);

				// Move each particle being activated to
				// it's actual position in time.
				//
				// This stops particles being 'clumped' together
				// when frame rates are on the lower side of 60fps
				// or not constant (a very real possibility!)
				dtValue = dtPerParticle * (i - activationStart);
				params[index + 1] = direction === -1 ? params[index + 2] - dtValue : dtValue;
				this._updateAttributeUpdateRange('params', i);
			}
		}
	}

	/**
	 * A map of options to configure an ParticleGroup instance.
	 * @typedef {Object} GroupOptions
	 *
	 * @property {Object} texture An object describing the texture used by the group.
	 *
	 * @property {Object} texture.value An instance of t3d.Texture.
	 *
	 * @property {Object=} texture.frames A t3d.Vector2 instance describing the number
	 *																		of frames on the x- and y-axis of the given texture.
	 *																		If not provided, the texture will NOT be treated as
	 *																		a sprite-sheet and as such will NOT be animated.
	 *
	 * @property {Number} [texture.frameCount=texture.frames.x * texture.frames.y] The total number of frames in the sprite-sheet.
	 *																																	 Allows for sprite-sheets that don't fill the entire
	 *																																	 texture.
	 *
	 * @property {Number} texture.loop The number of loops through the sprite-sheet that should
	 *																 be performed over the course of a single particle's lifetime.
	 *
	 * @property {Number} fixedTimeStep If no `dt` (or `deltaTime`) value is passed to this group's
	 *																	`tick()` function, this number will be used to move the particle
	 *																	simulation forward. Value in SECONDS.
	 *
	 * @property {Boolean} hasPerspective Whether the distance a particle is from the camera should affect
	 *																		the particle's size.
	 *
	 * @property {Boolean} colorize Whether the particles in this group should be rendered with color, or
	 *															whether the only color of particles will come from the provided texture.
	 *
	 * @property {Number} blending One of t3d.js's blending modes to apply to this group's `ShaderMaterial`.
	 *
	 * @property {Boolean} transparent Whether these particle's should be rendered with transparency.
	 *
	 * @property {Number} alphaTest Sets the alpha value to be used when running an alpha test on the `texture.value` property. Value between 0 and 1.
	 *
	 * @property {Boolean} depthWrite Whether rendering the group has any effect on the depth buffer.
	 *
	 * @property {Boolean} depthTest Whether to have depth test enabled when rendering this group.
	 *
	 * @property {Boolean} fog Whether this group's particles should be affected by their scene's fog.
	 *
	 * @property {Number} scale The scale factor to apply to this group's particle sizes. Useful for
	 *													setting particle sizes to be relative to renderer size.
	 */

	class AbstractParticleGroup {
		constructor(options, shader) {
			this.uuid = t3d__namespace.generateUUID();
			const types = Utils.types;
			options.texture = Utils.ensureTypedArg(options.texture, types.OBJECT, {});

			// If no `deltaTime` value is passed to the `ParticleGroup.tick` function,
			// the value of this property will be used to advance the simulation.
			this.fixedTimeStep = Utils.ensureTypedArg(options.fixedTimeStep, types.NUMBER, 0.016);
			this.hasPerspective = Utils.ensureTypedArg(options.hasPerspective, types.BOOLEAN, true);
			this.colorize = Utils.ensureTypedArg(options.colorize, types.BOOLEAN, true);

			// Set material
			this.material = new t3d__namespace.ShaderMaterial(shader);
			this.uniforms = this.material.uniforms;
			this.defines = this.material.defines;
			this._setMaterial(options);

			// Where emitter's go to curl up in a warm blanket and live
			// out their days.
			this._emitters = [];
		}
		addEmitter(emitter) {}
		removeEmitter(emitter) {}
		tick(dt) {}
		dispose() {}
		_setMaterial(options) {
			const types = Utils.types;
			const material = this.material;
			const uniforms = this.uniforms;
			uniforms.tex = Utils.ensureInstanceOf(options.texture.value, t3d__namespace.Texture2D, defaultTexture);
			material.blending = Utils.ensureTypedArg(options.blending, types.STRING, t3d__namespace.BLEND_TYPE.ADD);
			material.transparent = Utils.ensureTypedArg(options.transparent, types.BOOLEAN, true);
			material.alphaTest = Utils.ensureTypedArg(options.alphaTest, types.NUMBER, 0.0);
			material.depthWrite = Utils.ensureTypedArg(options.depthWrite, types.BOOLEAN, false);
			material.depthTest = Utils.ensureTypedArg(options.depthTest, types.BOOLEAN, true);
			material.fog = Utils.ensureTypedArg(options.fog, types.BOOLEAN, true);
		}
	}
	const defaultTexture = new t3d__namespace.Texture2D();
	defaultTexture.image = {
		data: new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]),
		width: 2,
		height: 2
	};
	defaultTexture.magFilter = t3d__namespace.TEXTURE_FILTER.NEAREST;
	defaultTexture.minFilter = t3d__namespace.TEXTURE_FILTER.NEAREST;
	defaultTexture.generateMipmaps = false;

	const componentSizeMap = {
		position: 3,
		acceleration: 4,
		// w component is drag
		velocity: 3,
		rotation: 4,
		rotationCenter: 3,
		params: 4,
		// Holds (alive, age, delay, wiggle)
		size: 4,
		angle: 4,
		color: 4,
		opacity: 4
	};
	class ParticleGroup extends AbstractParticleGroup {
		constructor(options) {
			const utils = Utils,
				types = utils.types;

			// Ensure we have a map of options to play with
			options = Utils.ensureTypedArg(options, types.OBJECT, {});
			super(options, ParticleShader);

			// Set max particle count

			this.maxParticleCount = utils.ensureTypedArg(options.maxParticleCount, types.NUMBER, null);
			if (this.maxParticleCount === null) {
				console.warn('ParticleGroup: No maxParticleCount specified. Adding emitters after rendering will probably cause errors.');
			}

			// Set properties used in the uniforms map

			this.textureFrames = Utils.ensureInstanceOf(options.texture.frames, t3d__namespace.Vector2, new t3d__namespace.Vector2(1, 1));
			this.textureFrames.max(new t3d__namespace.Vector2(1, 1));
			this.textureFrameCount = Utils.ensureTypedArg(options.texture.frameCount, types.NUMBER, this.textureFrames.x * this.textureFrames.y);
			this.textureLoop = Utils.ensureTypedArg(options.texture.loop, types.NUMBER, 1);
			this.defines.HAS_PERSPECTIVE = this.hasPerspective;
			this.defines.COLORIZE = this.colorize;
			this.defines.VALUE_OVER_LIFETIME_LENGTH = ParticleProperties.valueOverLifetimeLength;
			this.defines.SHOULD_CALCULATE_SPRITE = this.textureFrames.x > 1 || this.textureFrames.y > 1;
			this.uniforms.textureAnimation = [this.textureFrames.x, this.textureFrames.y, this.textureFrameCount, Math.max(Math.abs(this.textureLoop), 1.0)];
			this.uniforms.scale = utils.ensureTypedArg(options.scale, types.NUMBER, 300);
			this.material.drawMode = t3d__namespace.DRAW_MODE.POINTS;

			// Create geometry

			this.geometry = new t3d__namespace.Geometry();
			this.geometry.addGroup(0, this.particleCount, 0);

			// Map of all attributes to be applied to the particles.
			this.attributes = {
				position: null,
				acceleration: null,
				velocity: null,
				rotation: null,
				rotationCenter: null,
				params: null,
				size: null,
				angle: null,
				color: null,
				opacity: null
			};
			this.attributeKeys = Object.keys(this.attributes);
			this.attributeCount = this.attributeKeys.length;

			// Whether all attributes should be forced to updated
			// their entire buffer contents on the next tick.
			//
			// Used when an emitter is removed.
			this._attributesNeedRefresh = false;
			this._attributesNeedDynamicReset = false;

			// Create mesh

			this.mesh = new t3d__namespace.Mesh(this.geometry, [this.material]);
			this.mesh.frustumCulled = false;

			//

			this.particleCount = 0;
		}

		/**
		 * Adds an ParticleEmitter instance to this group, creating particle values and
		 * assigning them to this group's attributes.
		 *
		 * @param {ParticleEmitter} emitter The emitter to add to this group.
		 */
		addEmitter(emitter) {
			// Ensure an actual emitter instance is passed here.
			//
			// Decided not to throw here, just in case a scene's
			// rendering would be paused. Logging an error instead
			// of stopping execution if exceptions aren't caught.
			if (emitter instanceof ParticleEmitter === false) {
				console.error('`emitter` argument must be instance of ParticleEmitter. Was provided with:', emitter);
				return;
			} else if (this._emitters.indexOf(emitter) > -1) {
				// If the emitter already exists as a member of this group, then
				// stop here, we don't want to add it again.
				console.error('ParticleEmitter already exists in this group. Will not add again.');
				return;
			} else if (emitter.group !== null) {
				// And finally, if the emitter is a member of another group,
				// don't add it to this group.
				console.error('ParticleEmitter already belongs to another group. Will not add to requested group.');
				return;
			}
			const attributes = this.attributes,
				start = this.particleCount,
				end = start + emitter.particleCount;

			// Update this group's particle count.
			this.particleCount = end;

			// Emit a warning if the emitter being added will exceed the buffer sizes specified.
			if (this.maxParticleCount !== null && this.particleCount > this.maxParticleCount) {
				console.warn('ParticleGroup: maxParticleCount exceeded. Requesting', this.particleCount, 'particles, can support only', this.maxParticleCount);
			}

			// Set the `particlesPerSecond` value (PPS) on the emitter.
			// It's used to determine how many particles to release
			// on a per-frame basis.
			// emitter.calculatePPSValue();
			emitter._setBufferUpdateRanges(this.attributeKeys);

			// Store the offset value in the TypedArray attributes for this emitter.
			emitter._setAttributeOffset(start);

			// Save a reference to this group on the emitter so it knows
			// where it belongs.
			emitter.group = this;

			// Store reference to the attributes on the emitter for
			// easier access during the emitter's tick function.
			emitter.attributes = this.attributes;

			// Ensure the attributes and their attribute exist, and their
			// buffer arrays are of the correct size.
			for (const attr in attributes) {
				if (attributes.hasOwnProperty(attr)) {
					// When creating a buffer, pass through the maxParticle count
					// if one is specified.
					const attribute = attributes[attr];
					const size = this.maxParticleCount !== null ? this.maxParticleCount : this.particleCount;
					if (attribute !== null && attribute.buffer.array !== null) {
						// Make sure the buffer array is present and correct.
						if (attribute.buffer.array.length !== size * attribute.size) {
							const currentArraySize = attribute.buffer.array.length;
							const bufferSize = size * attribute.size;
							if (bufferSize < currentArraySize) {
								attribute.buffer.array = attribute.buffer.array.subarray(0, bufferSize);
							} else {
								const existingArray = attribute.buffer.array,
									newArray = new Float32Array(bufferSize);
								newArray.set(existingArray);
								attribute.buffer.array = newArray;
							}
							attribute.buffer.count = size;
							attribute.buffer.version++;
						}
					} else {
						attributes[attr] = new t3d__namespace.Attribute(new t3d__namespace.Buffer(new Float32Array(size * componentSizeMap[attr]), componentSizeMap[attr]));
						attributes[attr].buffer.usage = t3d__namespace.BUFFER_USAGE.DYNAMIC_DRAW;
					}
				}
			}

			// Loop through each particle this emitter wants to have, and create the attributes values,
			// storing them in the buffer array that each attribute holds.
			for (let i = start; i < end; ++i) {
				emitter._assignValue('position', i, true);
				emitter._assignValue('velocity', i, true);
				emitter._assignValue('acceleration', i, true);
				emitter._assignValue('size', i, true);
				emitter._assignValue('opacity', i, true);
				emitter._assignValue('angle', i, true);
				emitter._assignValue('params', i, true);
				emitter._assignValue('rotation', i, true);
				emitter._assignValue('color', i, true);
			}

			// Update the geometry and make sure the attributes are referencing
			// the typed arrays properly.
			this._applyAttributesToGeometry();

			// Store this emitter in this group's emitter's store.
			this._emitters.push(emitter);

			// Update certain flags to enable shader calculations only if they're necessary.
			this.$updateDefines(emitter);
			this._attributesNeedRefresh = true;

			// Return the group to enable chaining.
			return this;
		}

		/**
		 * Removes an ParticleEmitter instance from this group. When called,
		 * all particle's belonging to the given emitter will be instantly
		 * removed from the scene.
		 *
		 * @param {ParticleEmitter} emitter The emitter to add to this group.
		 */
		removeEmitter(emitter) {
			const emitterIndex = this._emitters.indexOf(emitter);

			// Ensure an actual emitter instance is passed here.
			//
			// Decided not to throw here, just in case a scene's
			// rendering would be paused. Logging an error instead
			// of stopping execution if exceptions aren't caught.
			if (emitter instanceof ParticleEmitter === false) {
				console.error('`emitter` argument must be instance of ParticleEmitter. Was provided with:', emitter);
				return;
			} else if (emitterIndex === -1) {
				// Issue an error if the emitter isn't a member of this group.
				console.error('ParticleEmitter does not exist in this group. Will not remove.');
				return;
			}

			// Kill all particles by marking them as dead
			// and their age as 0.
			const start = emitter.attributeOffset,
				end = start + emitter.particleCount,
				params = this.attributes.params.buffer.array;

			// Set alive and age to zero.
			for (let i = start; i < end; ++i) {
				params[i * 4] = 0.0;
				params[i * 4 + 1] = 0.0;
			}

			// Remove the emitter from this group's "store".
			this._emitters.splice(emitterIndex, 1);

			// Remove this emitter's attribute values from all attributes.
			// Also marks each attribute's buffer
			// as needing to update it's entire contents.
			for (const attr in this.attributes) {
				if (this.attributes.hasOwnProperty(attr)) {
					const attribute = this.attributes[attr];
					const startSize = start * attribute.size;
					const endSize = end * attribute.size;
					let array = attribute.buffer.array;
					const data = [];
					for (let i = 0; i < array.length; ++i) {
						if (i < startSize || i >= endSize) {
							data.push(array[i]);
						}
					}
					array = array.subarray(0, data.length);
					array.set(data);
					this.attributes[attr].buffer.array = array;
				}
			}
			for (let j = this._emitters.length - 1; j >= emitterIndex; j--) {
				const attributeOffset = this._emitters[j].attributeOffset - emitter.particleCount;
				this._emitters[j]._setAttributeOffset(attributeOffset);
			}

			// Ensure this group's particle count is correct.
			this.particleCount -= emitter.particleCount;
			this.geometry.groups[0].count = this.particleCount;

			// Call the emitter's remove method.
			emitter._onRemove();

			// Set a flag to indicate that the attribute buffers should
			// be updated in their entirety on the next frame.
			this._attributesNeedRefresh = true;
		}

		/**
		 * Simulate all the emitter's belonging to this group, updating
		 * attribute values along the way.
		 * @param	{Number} [dt=Group's `fixedTimeStep` value] The number of seconds to simulate the group's emitters for (deltaTime)
		 */
		tick(dt) {
			const emitters = this._emitters,
				numEmitters = emitters.length,
				deltaTime = dt || this.fixedTimeStep,
				keys = this.attributeKeys,
				attrs = this.attributes;
			let i, j;

			// Update uniform values.

			this.uniforms.runTime += deltaTime;
			this.uniforms.deltaTime = deltaTime;

			// If nothing needs updating, then stop here.

			if (numEmitters === 0 && this._attributesNeedRefresh === false && this._attributesNeedDynamicReset === false) {
				return;
			}

			// Loop through each emitter in this group and
			// simulate it, then update the attribute
			// buffers.

			for (j = 0; j < numEmitters; ++j) {
				// Run tick
				emitters[j].tick(deltaTime);
			}
			for (i = this.attributeCount - 1; i >= 0; --i) {
				const key = keys[i];
				let particleUpdateMin = Infinity;
				let particleUpdateMax = -Infinity;
				for (j = 0; j < numEmitters; ++j) {
					// Mark update range
					const emitterRanges = emitters[j].bufferUpdateRanges;
					const emitterAttr = emitterRanges[key];
					particleUpdateMin = Math.min(emitterAttr.min, particleUpdateMin);
					particleUpdateMax = Math.max(emitterAttr.max, particleUpdateMax);
				}
				if (particleUpdateMax - particleUpdateMin > 0) {
					// Reset buffer update ranges.
					const attr = attrs[key];
					attr.buffer.updateRange.offset = particleUpdateMin * attr.size;
					attr.buffer.updateRange.count = Math.min((particleUpdateMax - particleUpdateMin + 1) * attr.size, attr.buffer.array.length);
					attr.buffer.version++;
				}
			}

			// If the attributes have been refreshed,
			// then the dynamic properties of each buffer
			// attribute will need to be reset back to
			// what they should be.

			if (this._attributesNeedDynamicReset === true) {
				i = this.attributeCount - 1;
				for (i; i >= 0; --i) {
					attrs[keys[i]].buffer.usage = t3d__namespace.BUFFER_USAGE.DYNAMIC_DRAW;
				}
				this._attributesNeedDynamicReset = false;
			}

			// If this group's attributes need a full refresh
			// then mark each attribute's buffer attribute as
			// needing so.

			if (this._attributesNeedRefresh === true) {
				i = this.attributeCount - 1;
				for (i; i >= 0; --i) {
					attrs[keys[i]].buffer.updateRange.offset = 0;
					attrs[keys[i]].buffer.updateRange.count = -1;
					attrs[keys[i]].buffer.usage = t3d__namespace.BUFFER_USAGE.STATIC_DRAW;
					attrs[keys[i]].buffer.version++;
				}
				this._attributesNeedRefresh = false;
				this._attributesNeedDynamicReset = true;
			}
		}

		/**
		 * Dipose the geometry and material for the group.
		 *
		 * @return {ParticleGroup} ParticleGroup instance.
		 */
		dispose() {
			this.mesh.geometry.dispose();
			this.mesh.material[0].dispose();

			// TODO remove all emitters?

			return this;
		}
		$updateDefines() {
			const emitters = this._emitters,
				defines = this.defines;
			let i = emitters.length - 1,
				emitter;
			for (i; i >= 0; --i) {
				emitter = emitters[i];
				defines.SHOULD_ROTATE_TEXTURE = defines.SHOULD_ROTATE_TEXTURE || Utils.hasNonZeroElement(emitter.angle.value) || Utils.hasNonZeroElement(emitter.angle.spread);
				defines.SHOULD_ROTATE_PARTICLES = defines.SHOULD_ROTATE_PARTICLES || emitter.rotation.angle !== 0.0 || emitter.rotation.angleSpread !== 0.0;
				defines.SHOULD_WIGGLE_PARTICLES = defines.SHOULD_WIGGLE_PARTICLES || emitter.wiggle.value !== 0.0 || emitter.wiggle.spread !== 0.0;
			}

			// Update the material since defines might have changed
			this.material.needsUpdate = true;
		}
		_applyAttributesToGeometry() {
			const attributes = this.attributes,
				geometry = this.geometry,
				geometryAttributes = geometry.attributes;
			let attribute, geometryAttribute;

			// Loop through all the attributes and assign (or re-assign)
			// typed array buffers to each one.
			for (const attr in attributes) {
				if (attributes.hasOwnProperty(attr)) {
					attribute = attributes[attr];
					geometryAttribute = geometryAttributes[attr === 'position' ? 'a_Position' : attr];

					// Update the array if this attribute exists on the geometry.
					//
					// This needs to be done because the attribute's typed array might have
					// been resized and reinstantiated, and might now be looking at a
					// different ArrayBuffer, so reference needs updating.
					if (geometryAttribute) ; else {
						// Add the attribute to the geometry if it doesn't already exist.
						geometry.addAttribute(attr === 'position' ? 'a_Position' : attr, attribute);
					}
				}
			}
			this.geometry.version++;

			// Mark the draw range on the geometry. This will ensure
			// only the values in the attribute buffers that are
			// associated with a particle will be used in t3d's
			// render cycle.
			this.geometry.groups[0].count = this.particleCount;
		}
	}

	const MeshParticleShader = {
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

	class MeshParticle {
		constructor() {
			this._matrix = new t3d__namespace.Matrix4();
			this._color = new t3d__namespace.Color3(1, 1, 1);
			this._opacity = 1;
			this._originPosition = [0, 0, 0];
			this._originVelocity = [0, 0, 0];
			this._originAcceleration = [0, 0, 0, 0]; // Acceleration, Drag
			this._originOpacityArray = [];
			this._originSizeArray = [];
			this._originAngleArray = [];
			this._originColorArray = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
			this._originParams = [0, 0, 0, 0]; // Alive, Age, MaxAge, Wiggle
			this._originRotation = [0, 1, 0, 0, 0]; // Axis, Angle, Dynamic ( not static )
			this._originRotationCenter = [0, 0, 0];
		}
		isAlive() {
			return !!this._originParams[0];
		}
		tick(dt, camera, emitter) {
			this._originParams[1] += dt;

			// if (emitter.duration !== null && this._originParams[1] > emitter.duration) {
			// 	this._originParams[0] = 0;
			// }

			if (this._originParams[1] > this._originParams[2]) {
				this._originParams[0] = 0;
			}
			if (this._originParams[0] === 0) {
				this._originParams[1] = 0.0;
				return;
			}
			this._update(camera, emitter);
		}
		submit(array, index) {
			const arrayIndex = index * 16;
			const matrixElements = this._matrix.elements;
			array[arrayIndex] = matrixElements[0];
			array[arrayIndex + 1] = matrixElements[1];
			array[arrayIndex + 2] = matrixElements[2];
			array[arrayIndex + 3] = matrixElements[4];
			array[arrayIndex + 4] = matrixElements[5];
			array[arrayIndex + 5] = matrixElements[6];
			array[arrayIndex + 6] = matrixElements[8];
			array[arrayIndex + 7] = matrixElements[9];
			array[arrayIndex + 8] = matrixElements[10];
			array[arrayIndex + 9] = matrixElements[12];
			array[arrayIndex + 10] = matrixElements[13];
			array[arrayIndex + 11] = matrixElements[14];
			array[arrayIndex + 12] = this._color.r;
			array[arrayIndex + 13] = this._color.g;
			array[arrayIndex + 14] = this._color.b;
			array[arrayIndex + 15] = this._opacity;
		}
		_update(camera, emitter) {
			const age = this._originParams[1];
			const positionInTime = age / this._originParams[2];

			// position

			const vA = _vec3_1.fromArray(this._originAcceleration);
			if (emitter.SHOULD_DRAG_PARTICLES) {
				const fDrag = 1.0 - positionInTime * 0.5 * this._originAcceleration[3];
				vA.multiplyScalar(fDrag);
			}
			_position.fromArray(this._originVelocity).multiplyScalar(age);
			const halfAt2 = vA.multiplyScalar(age * age * 0.5);
			_position.add(_vec3_2.fromArray(this._originPosition)).add(halfAt2);
			if (emitter.SHOULD_WIGGLE_PARTICLES) {
				const fWiggle = positionInTime * this._originParams[3] * Math.PI;
				const fWiggleSin = Math.sin(fWiggle);
				const fWiggleCos = Math.cos(fWiggle);
				_position.x += fWiggleSin;
				_position.y += fWiggleCos;
				_position.z += fWiggleSin;
			}
			if (emitter.SHOULD_ROTATE_PARTICLES) {
				const rotationAngle = this._originRotation[3];
				if (rotationAngle !== 0) {
					let angle = 0.0;
					if (this._originRotation[4] === 0) {
						angle = rotationAngle;
					} else {
						angle = Utils.lerp(0.0, rotationAngle, positionInTime);
					}
					const axis = _vec3_1.fromArray(this._originRotation);
					const rotationMatrix = _mat4_1.makeRotationAxis(axis, angle);
					const translated = _vec3_1.fromArray(this._originRotationCenter).sub(_position);
					translated.applyMatrix4(rotationMatrix);
					_position.fromArray(this._originRotationCenter).sub(translated);
				}
			}

			// scale

			_scale.set(1, 1, 1);
			if (emitter.SHOULD_SIZE_PARTICLES) {
				const s = getFloatOverLifetime(positionInTime, this._originSizeArray);
				_scale.set(s, s, s);
			}

			// rotation

			if (emitter.isLookAtCamera || emitter.isLookAtCameraOnlyY) {
				if (emitter.isLookAtCamera) {
					_rotation.copy(camera.quaternion);
				} else if (emitter.isLookAtCameraOnlyY) {
					_mat4_1.getInverse(emitter.group.mesh.worldMatrix);
					_mat4_1.multiply(camera.worldMatrix);
					_vec3_1.setFromMatrixPosition(_mat4_1);
					_vec3_2.copy(_position).sub(_vec3_1);
					_vec3_2.y = 0;
					_rotation.setFromUnitVectors(_vec3_1.set(0, 0, -1), _vec3_2.normalize());
				}
			} else if (emitter.SHOULD_ANGLE_PARTICLES) {
				const r = getFloatOverLifetime(positionInTime, this._originAngleArray); // rotate all x, y, z ?
				_euler_1.set(r, r, r);
				_rotation.setFromEuler(_euler_1, false);
			}

			// combine to matrix

			this._matrix.transform(_position, _scale, _rotation);

			// color & opacity

			if (emitter.SHOULD_COLORIZE_PARTICLES) {
				getColorOverLifetime(positionInTime, this._originColorArray, this._color);
				this._opacity = getFloatOverLifetime(positionInTime, this._originOpacityArray);
			} else {
				this._color.setRGB(1, 1, 1);
				this._opacity = 1;
			}
		}
	}
	const _vec3_1 = new t3d__namespace.Vector3();
	const _vec3_2 = new t3d__namespace.Vector3();
	const _euler_1 = new t3d__namespace.Euler();
	const _mat4_1 = new t3d__namespace.Matrix4();
	const _position = new t3d__namespace.Vector3();
	const _rotation = new t3d__namespace.Quaternion();
	const _scale = new t3d__namespace.Vector3();
	function getFloatOverLifetime(positionInTime, attr) {
		const maxAge = ParticleProperties.valueOverLifetimeLength - 1;
		let value = 0;
		if (positionInTime <= 0.0) {
			value = 0;
		} else if (positionInTime >= 1.0) {
			value = attr[maxAge];
		} else {
			const deltaAge = positionInTime * maxAge;
			for (let i = 0; i < maxAge; i++) {
				if (deltaAge > i && deltaAge < i + 1.0) {
					value += Utils.lerp(attr[i], attr[i + 1], deltaAge - i);
					break;
				}
			}
		}
		return value;
	}
	function getColorOverLifetime(positionInTime, attr, out) {
		const maxAge = ParticleProperties.valueOverLifetimeLength - 1;
		if (positionInTime <= 0.0) {
			out.fromArray(attr, 0);
		} else if (positionInTime >= 1.0) {
			out.fromArray(attr, maxAge * 3);
		} else {
			const deltaAge = positionInTime * maxAge;
			let ratio, index, nextIndex;
			for (let i = 0; i < maxAge; i++) {
				if (deltaAge > i && deltaAge < i + 1.0) {
					ratio = deltaAge - i;
					index = i * 3;
					nextIndex = index + 3;
					out.r = ratio * (attr[nextIndex + 0] - attr[index + 0]) + attr[index + 0];
					out.g = ratio * (attr[nextIndex + 1] - attr[index + 1]) + attr[index + 1];
					out.b = ratio * (attr[nextIndex + 2] - attr[index + 2]) + attr[index + 2];
					break;
				}
			}
		}
		return out;
	}

	class MeshParticleEmitter extends AbstractParticleEmitter {
		constructor(options) {
			super(options);
			this._activeParticles = new Array();
			this._particlePool = new Array();
		}
		tick(dt, camera) {
			if (this.isStatic) {
				for (let i = 0, len = this._activeParticles.length; i < len; i++) {
					if (this._activeParticles[i].isAlive()) {
						const group = this.group;
						this._activeParticles[i].submit(group.$instanceBuffer.array, group.$allocBufferIndex());
					}
				}
				return;
			}
			if (this.alive === false) {
				this.age = 0.0;
				return;
			}
			const outDuration = this.duration !== null && this.age > this.duration;

			// spawn particles

			if (!outDuration) {
				const activationCount = this._activeParticles.length;
				const ppsDt = this.particlesPerSecond * this.activeMultiplier * dt;
				const spawnCount = Math.min(activationCount + ppsDt, this.particleCount) - activationCount;
				for (let i = 0; i < spawnCount; i++) {
					const particle = this._particlePool.length <= 0 ? new MeshParticle() : this._particlePool.shift();
					this._resetParticle(particle);
					this._activeParticles.push(particle);
				}
			}

			// tick particles

			for (let i = 0, len = this._activeParticles.length; i < len; i++) {
				this._activeParticles[i].tick(dt, camera, this);
				if (this._activeParticles[i].isAlive()) {
					const group = this.group;
					this._activeParticles[i].submit(group.$instanceBuffer.array, group.$allocBufferIndex());
				} else {
					this._particlePool.push(this._activeParticles[i]);
					this._activeParticles.splice(i, 1);
					len--;
					i--;
				}
			}

			// trun alive to false if out of duration & has no active particles

			if (outDuration && this._activeParticles.length <= 0) {
				this.alive = false;
				this.age = 0.0;
			}

			// update age

			if (this.alive) {
				this.age += dt;
			}
		}
		reset(force) {
			this.alive = false;
			this.age = 0.0;
			if (force) {
				this._activeParticles = [];
				this._particlePool = [];
			}
		}
		$updateFlags(group) {
			this.SHOULD_DRAG_PARTICLES = !!Math.max(this.drag._value, this.drag._spread);
			this.SHOULD_WIGGLE_PARTICLES = !!Math.max(this.wiggle._value, this.wiggle._spread);
			this.SHOULD_ROTATE_PARTICLES = !!Math.max(this.rotation._angle, this.rotation._angleSpread);
			this.SHOULD_COLORIZE_PARTICLES = group.colorize;
			this.SHOULD_SIZE_PARTICLES = true;
			this.SHOULD_ANGLE_PARTICLES = true;
		}
		_assignValue(prop, out, particlePos, out2) {
			switch (prop) {
				case 'position':
					this._assignPositionValue(out, 0);
					break;
				case 'velocity':
				case 'acceleration':
					this._assignForceValue(out, 0, prop, particlePos);
					break;
				case 'size':
				case 'opacity':
					this._assignAbsLifetimeValue(out, 0, prop);
					break;
				case 'angle':
					this._assignAngleValue(out, 0);
					break;
				case 'params':
					this._assignParamsValue(out, 0);
					break;
				case 'rotation':
					this._assignRotationValue(out, 0, out2, 0);
					break;
				case 'color':
					this._assignColorValue(out, 0);
					break;
			}
		}
		_resetParticle(particle) {
			this._assignValue('position', particle._originPosition);
			this._assignValue('velocity', particle._originVelocity, particle._originPosition);
			this._assignValue('acceleration', particle._originAcceleration, particle._originPosition);
			this._assignValue('opacity', particle._originOpacityArray);
			this._assignValue('size', particle._originSizeArray);
			this._assignValue('angle', particle._originAngleArray);
			this._assignValue('color', particle._originColorArray);
			this._assignValue('params', particle._originParams);
			this._assignValue('rotation', particle._originRotation, undefined, particle._originRotationCenter);
		}
	}

	class MeshParticleGroup extends AbstractParticleGroup {
		constructor(options) {
			const types = Utils.types;

			// Ensure we have a map of options to play with
			options = Utils.ensureTypedArg(options, types.OBJECT, {});
			super(options, MeshParticleShader);

			// Set max particle count

			if (options.maxParticleCount === undefined) {
				console.warn('MeshParticleGroup: options.maxParticleCount is not provided, set to 1000 by default.');
				options.maxParticleCount = 1000;
			}
			this.maxParticleCount = options.maxParticleCount;

			// Create geometry

			if (!options.geometry || !(options.geometry instanceof t3d__namespace.Geometry)) {
				console.warn('MeshParticleGroup: options.geometry is not provided, set a box geometry by default.');
				options.geometry = new t3d__namespace.BoxGeometry(1, 1, 1);
			}
			const geometry = generateInstancedGeometry(options.geometry, this.maxParticleCount);
			this.$instanceBuffer = geometry.attributes.mcol0.buffer;
			this._geometry = geometry;

			// Create mesh

			this.mesh = new t3d__namespace.Mesh(geometry, this.material);
			this.mesh.frustumCulled = false;

			//

			this._particleCount = 0;
			this._aliveParticleCount = 0;
		}
		addEmitter(emitter) {
			if (emitter instanceof MeshParticleEmitter === false) {
				console.error('`emitter` argument must be instance of MeshParticleEmitter. Was provided with:', emitter);
				return;
			} else if (this._emitters.indexOf(emitter) > -1) {
				console.error('MeshParticleEmitter already exists in this group. Will not add again.');
				return;
			} else if (emitter.group !== null) {
				console.error('MeshParticleEmitter already belongs to another group. Will not add to requested group.');
				return;
			}
			this._particleCount += emitter.particleCount;
			if (this._particleCount > this.maxParticleCount) {
				console.warn('MeshParticleGroup: maxParticleCount exceeded. Requesting', this._particleCount, 'particles, can support only', this.maxParticleCount);
			}
			emitter.group = this;
			this._emitters.push(emitter);
			this.$updateDefines(emitter);
			return this;
		}
		removeEmitter(emitter) {
			const emitterIndex = this._emitters.indexOf(emitter);
			if (emitter instanceof MeshParticleEmitter === false) {
				console.error('`emitter` argument must be instance of MeshParticleEmitter. Was provided with:', emitter);
				return;
			} else if (emitterIndex === -1) {
				console.error('MeshParticleEmitter does not exist in this group. Will not remove.');
				return;
			}
			this._particleCount -= emitter.particleCount;
			emitter.group = null;
			this._emitters.splice(emitterIndex, 1);
			return this;
		}
		tick(dt, camera) {
			const emitters = this._emitters,
				numEmitters = emitters.length,
				deltaTime = dt || this.fixedTimeStep;
			if (numEmitters === 0) {
				return;
			}
			this._aliveParticleCount = 0;
			for (let i = 0; i < numEmitters; i++) {
				emitters[i].tick(deltaTime, camera);
			}
			this.$instanceBuffer.version++;
			this._geometry.instanceCount = this._aliveParticleCount;
		}
		dispose() {
			this.mesh.geometry.dispose();
			this.mesh.material.dispose();
			for (let i = 0, l = this._emitters.length; i < l; i++) {
				this._emitters[i].group = null;
			}
			this._emitters = [];
			this._particleCount = 0;
			this._aliveParticleCount = 0;
			return this;
		}
		get particleCount() {
			return this._particleCount;
		}
		get aliveParticleCount() {
			return this._aliveParticleCount;
		}
		$updateDefines(emitter) {
			emitter.$updateFlags(this);
		}
		$allocBufferIndex() {
			return this._aliveParticleCount++;
		}
	}
	function generateInstancedGeometry(geometry, count) {
		const instancedGeometry = geometry.clone();
		const buffer = new t3d__namespace.Buffer(new Float32Array(count * 16), 16);
		buffer.usage = t3d__namespace.BUFFER_USAGE.DYNAMIC_DRAW;
		const mcol0 = new t3d__namespace.Attribute(buffer, 3, 0);
		const mcol1 = new t3d__namespace.Attribute(buffer, 3, 3);
		const mcol2 = new t3d__namespace.Attribute(buffer, 3, 6);
		const mcol3 = new t3d__namespace.Attribute(buffer, 3, 9);
		const colors = new t3d__namespace.Attribute(buffer, 4, 12);
		mcol0.divisor = 1;
		mcol1.divisor = 1;
		mcol2.divisor = 1;
		mcol3.divisor = 1;
		colors.divisor = 1;
		instancedGeometry.addAttribute('mcol0', mcol0);
		instancedGeometry.addAttribute('mcol1', mcol1);
		instancedGeometry.addAttribute('mcol2', mcol2);
		instancedGeometry.addAttribute('mcol3', mcol3);
		instancedGeometry.addAttribute('color', colors);
		return instancedGeometry;
	}

	exports.MeshParticleEmitter = MeshParticleEmitter;
	exports.MeshParticleGroup = MeshParticleGroup;
	exports.ParticleEmitter = ParticleEmitter;
	exports.ParticleGroup = ParticleGroup;
	exports.ParticleProperties = ParticleProperties;

}));
