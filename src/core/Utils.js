import * as t3d from "t3d";

/**
 * A bunch of utility functions used throughout the library.
 * @namespace
 * @type {Object}
 */
export const Utils = {
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
	 * @param  {(boolean|string|number|object)} arg          The value to perform a type-check on.
	 * @param  {String} type         The type the `arg` argument should adhere to.
	 * @param  {(boolean|string|number|object)} defaultValue A default value to fallback on if the type check fails.
	 * @return {(boolean|string|number|object)}              The given value if type check passes, or the default value if it fails.
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
	 * @param  {Array|boolean|string|number|object} arg          The array of values to check type of.
	 * @param  {String} type         The type that should be adhered to.
	 * @param  {(boolean|string|number|object)} defaultValue A default fallback value.
	 * @return {(boolean|string|number|object)}              The given value if type check passes, or the default value if it fails.
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
	 * @param  {Object} arg          The value to check instance of.
	 * @param  {Function} instance     The constructor of the instance to check against.
	 * @param  {Object} defaultValue A default fallback value if instance check fails
	 * @return {Object}              The given value if type check passes, or the default value if it fails.
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
	 * @param  {Array|Object} arg          The value to perform the instanceof check on.
	 * @param  {Function} instance     The constructor of the instance to check against.
	 * @param  {Object} defaultValue A default fallback value if instance check fails
	 * @return {Object}              The given value if type check passes, or the default value if it fails.
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
	 * @param  {Object} property  The property of an Emitter instance to check compliance of.
	 * @param  {Number} minLength The minimum length of the array to create.
	 * @param  {Number} maxLength The maximum length of the array to create.
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

		let valueLength = this.clamp(property._value.length, minLength, maxLength),
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
	 *
	 * For example, lerping [1, 10], with a `newLength` of 10 will produce [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].
	 *
	 * Delegates to `Utils.lerpTypeAgnostic` to perform the actual
	 * interpolation.
	 *
	 * @param  {Array} srcArray  The array to lerp.
	 * @param  {Number} newLength The length the array should be interpolated to.
	 * @return {Array}           The interpolated array.
	 */
	interpolateArray: function (srcArray, newLength) {
		let sourceLength = srcArray.length,
			newArray = [typeof srcArray[0].clone === 'function' ? srcArray[0].clone() : srcArray[0]],
			factor = (sourceLength - 1) / (newLength - 1);


		for (let i = 1; i < newLength - 1; ++i) {
			let f = i * factor,
				before = Math.floor(f),
				after = Math.ceil(f),
				delta = f - before;

			newArray[i] = this.lerpTypeAgnostic(srcArray[before], srcArray[after], delta);
		}

		newArray.push(
			typeof srcArray[sourceLength - 1].clone === 'function' ?
				srcArray[sourceLength - 1].clone() :
				srcArray[sourceLength - 1]
		);

		return newArray;
	},

	/**
	 * Clamp a number to between the given min and max values.
	 * @param  {Number} value The number to clamp.
	 * @param  {Number} min   The minimum value.
	 * @param  {Number} max   The maximum value.
	 * @return {Number}       The clamped number.
	 */
	clamp: function (value, min, max) {
		return Math.max(min, Math.min(value, max));
	},

	/**
	 * If the given value is less than the epsilon value, then return
	 * a randomised epsilon value if specified, or just the epsilon value if not.
	 * Works for negative numbers as well as positive.
	 *
	 * @param  {Number} value     The value to perform the operation on.
	 * @param  {Boolean} randomise Whether the value should be randomised.
	 * @return {Number}           The result of the operation.
	 */
	zeroToEpsilon: function (value, randomise) {
		let epsilon = 0.00001,
			result = value;

		result = randomise ? Math.random() * epsilon * 10 : epsilon;

		if (value < 0 && value > -epsilon) {
			result = -result;
		}

		// if ( value === 0 ) {
		//     result = randomise ? Math.random() * epsilon * 10 : epsilon;
		// }
		// else if ( value > 0 && value < epsilon ) {
		//     result = randomise ? Math.random() * epsilon * 10 : epsilon;
		// }
		// else if ( value < 0 && value > -epsilon ) {
		//     result = -( randomise ? Math.random() * epsilon * 10 : epsilon );
		// }

		return result;
	},

	/**
	 * Linearly interpolates two values of letious types. The given values
	 * must be of the same type for the interpolation to work.
	 * @param  {(number|Object)} start The start value of the lerp.
	 * @param  {(number|object)} end   The end value of the lerp.
	 * @param  {Number} delta The delta posiiton of the lerp operation. Ideally between 0 and 1 (inclusive).
	 * @return {(number|object|undefined)}       The result of the operation. Result will be undefined if
	 *                                               the start and end arguments aren't a supported type, or
	 *                                               if their types do not match.
	 */
	lerpTypeAgnostic: function (start, end, delta) {
		let types = this.types,
			out;

		if (typeof start === types.NUMBER && typeof end === types.NUMBER) {
			return start + ((end - start) * delta);
		} else if (
			(start instanceof t3d.Vector2 && end instanceof t3d.Vector2)
			|| (typeof start.x == types.NUMBER && typeof start.y == types.NUMBER && (start.z == null && start.z == undefined)
			&& typeof end.x == types.NUMBER && typeof end.y == types.NUMBER && (end.z == null && end.z == undefined))
		) {
			if (start instanceof t3d.Vector2) {
				out = new t3d.Vector2().copy(start);
			} else {
				out = {};
				out.x = start.x;
				out.y = start.y;
			}
			out.x = this.lerp(start.x, end.x, delta);
			out.y = this.lerp(start.y, end.y, delta);
			return out;
		} else if (
			(start instanceof t3d.Vector3 && end instanceof t3d.Vector3)
			|| (typeof start.x == types.NUMBER && typeof start.y == types.NUMBER && typeof start.z == types.NUMBER && (start.w == null && start.w == undefined)
			&& typeof end.x == types.NUMBER && typeof end.y == types.NUMBER && typeof end.z == types.NUMBER && (end.w == null && end.w == undefined))
		) {
			if (start instanceof t3d.Vector3) {
				out = new t3d.Vector3().copy(start);
			} else {
				out = {};
				out.x = start.x;
				out.y = start.y;
				out.z = start.z;
			}
			out.x = this.lerp(start.x, end.x, delta);
			out.y = this.lerp(start.y, end.y, delta);
			out.z = this.lerp(start.z, end.z, delta);
			return out;
		} else if (
			(start instanceof t3d.Vector4 && end instanceof t3d.Vector4)
			|| (typeof start.x == types.NUMBER && typeof start.y == types.NUMBER && typeof start.z == types.NUMBER && typeof start.w == types.NUMBER
                && typeof end.x == types.NUMBER && typeof end.y == types.NUMBER && typeof end.z == types.NUMBER && typeof end.w == types.NUMBER)
		) {
			if (start instanceof t3d.Vector3) {
				out = new t3d.Vector4().copy(start);
			} else {
				out = {};
				out.x = start.x;
				out.y = start.y;
				out.z = start.z;
				out.w = start.w;
			}
			out.x = this.lerp(start.x, end.x, delta);
			out.y = this.lerp(start.y, end.y, delta);
			out.z = this.lerp(start.z, end.z, delta);
			out.w = this.lerp(start.w, end.w, delta);
			return out;
		} else if (
			(start instanceof t3d.Color3 && end instanceof t3d.Color3)
			|| (typeof start.r == types.NUMBER && typeof start.g == types.NUMBER && typeof start.b == types.NUMBER
                && typeof end.r == types.NUMBER && typeof end.g == types.NUMBER && typeof end.b == types.NUMBER)
		) {
			if (start instanceof t3d.Vector3) {
				out = new t3d.Color3().copy(start);
			} else {
				out = {};
				out.r = start.r;
				out.g = start.g;
				out.b = start.b;
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
	 * @param  {Number} start The start value.
	 * @param  {Number} end   The end value.
	 * @param  {Number} delta The position to interpolate to.
	 * @return {Number}       The result of the lerp operation.
	 */
	lerp: function (start, end, delta) {
		return start + ((end - start) * delta);
	},

	/**
	 * Rounds a number to a nearest multiple.
	 *
	 * @param  {Number} n        The number to round.
	 * @param  {Number} multiple The multiple to round to.
	 * @return {Number}          The result of the round operation.
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
	 * @param  {Array} array The array of values to check equality of.
	 * @return {Boolean}       Whether the array's values are all equal or not.
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
	 * @param  {Number} base   The start value.
	 * @param  {Number} spread The size of the random variance to apply.
	 * @return {Number}        A randomised number.
	 */
	randomFloat: function (base, spread) {
		return base + spread * (Math.random() - 0.5);
	},

	getRandomVector3: function (array, offset, base, spread, spreadClamp) {
		let x = base.x + (Math.random() * spread.x - (spread.x * 0.5)),
			y = base.y + (Math.random() * spread.y - (spread.y * 0.5)),
			z = base.z + (Math.random() * spread.z - (spread.z * 0.5));

		if (spreadClamp) {
			x = -spreadClamp.x * 0.5 + this.roundToNearestMultiple(x, spreadClamp.x);
			y = -spreadClamp.y * 0.5 + this.roundToNearestMultiple(y, spreadClamp.y);
			z = -spreadClamp.z * 0.5 + this.roundToNearestMultiple(z, spreadClamp.z);
		}

		array[offset + 0] = x;
		array[offset + 1] = y;
		array[offset + 2] = z;

		return array;
	},

	getRandomVector3OnSphere: function(array, offset, base, radius, radiusSpread, radiusScale, radiusSpreadClamp) {
		let depth = 2 * Math.random() - 1,
			t = 6.2832 * Math.random(),
			r = Math.sqrt(1 - depth * depth),
			rand = this.randomFloat(radius, radiusSpread),
			x = 0,
			y = 0,
			z = 0;

		if (radiusSpreadClamp) {
			rand = Math.round(rand / radiusSpreadClamp) * radiusSpreadClamp;
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

	getRandomVector3OnDisc: function(array, offset, base, radius, radiusSpread, radiusScale, radiusSpreadClamp) {
		let t = 6.2832 * Math.random(),
			rand = Math.abs(this.randomFloat(radius, radiusSpread)),
			x = 0,
			y = 0,
			z = 0;

		if (radiusSpreadClamp) {
			rand = Math.round(rand / radiusSpreadClamp) * radiusSpreadClamp;
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

	getRandomVector3OnLine: (function() {
		const pos = new t3d.Vector3();

		return function(array, offset, start, end) {
			pos.lerpVectors(start, end, Math.random());
			pos.toArray(array, offset);
			return array;
		};
	}()),

	getRandomDirectionVector3OnSphere: (function() {
		const v = new t3d.Vector3();

		return function (array, offset, posX, posY, posZ, emitterPosition, speed, speedSpread) {
			v.copy(emitterPosition);

			v.x -= posX;
			v.y -= posY;
			v.z -= posZ;

			v.normalize().multiplyScalar(-this.randomFloat(speed, speedSpread));

			v.toArray(array, offset);

			return array;
		}
	}()),

	getRandomDirectionVector3OnDisc: (function() {
		const v = new t3d.Vector3();

		return function (array, offset, posX, posY, posZ, emitterPosition, speed, speedSpread) {
			v.copy(emitterPosition);

			v.x -= posX;
			v.y -= posY;
			v.z -= posZ;

			v.normalize().multiplyScalar(-this.randomFloat(speed, speedSpread));

			v.toArray(array, offset);

			array[offset + 2] = 0;

			return array;
		}
	}()),

	getRotationAxis: (function() {
		const vSpread = new t3d.Vector3();

		/**
		 * Given a rotation axis, and a rotation axis spread vector,
		 * calculate a randomised rotation axis, and pack it into
		 * a hexadecimal value represented in decimal form.
		 * @param  {Vector3} out       The instance of t3d.Vector3 to save the result to.
		 * @param  {Object} axis       t3d.Vector3 instance describing the rotation axis.
		 * @param  {Object} axisSpread t3d.Vector3 instance describing the amount of randomness to apply to the rotation axis.
		 * @return {Number}            The packed rotation axis, with randomness.
		 */
		return function(out, axis, axisSpread) {
			out.copy(axis).normalize();
			vSpread.copy(axisSpread).normalize();

			out.x += (-axisSpread.x * 0.5) + (Math.random() * axisSpread.x);
			out.y += (-axisSpread.y * 0.5) + (Math.random() * axisSpread.y);
			out.z += (-axisSpread.z * 0.5) + (Math.random() * axisSpread.z);

			// v.x = Math.abs( v.x );
			// v.y = Math.abs( v.y );
			// v.z = Math.abs( v.z );

			out.normalize();

			return out;
		};
	}()),

};