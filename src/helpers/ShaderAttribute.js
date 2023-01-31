import * as t3d from "t3d";
import { TypedArrayHelper } from "./TypedArrayHelper.js";

/**
 * A helper to handle creating and updating a t3d.BufferAttribute instance.
 *
 * @author  Luke Moody
 * @constructor
 * @param {String} type          The buffer attribute type. See ShaderAttribute.typeSizeMap for valid values.
 * @param {Boolean=} dynamicBuffer Whether this buffer attribute should be marked as dynamic or not.
 * @param {Function=} arrayType     A reference to a TypedArray constructor. Defaults to Float32Array if none provided.
 */
/**
 * A map of uniform types to their component size.
 * @enum {Number}
 */
const _typeSizeMap = {
	/**
	 * Float
	 * @type {Number}
	 */
	f: 1,

	/**
	 * Vec2
	 * @type {Number}
	 */
	v2: 2,

	/**
	 * Vec3
	 * @type {Number}
	 */
	v3: 3,

	/**
	 * Vec4
	 * @type {Number}
	 */
	v4: 4,

	/**
	 * Color
	 * @type {Number}
	 */
	c: 3,

	/**
	 * Mat3
	 * @type {Number}
	 */
	m3: 9,

	/**
	 * Mat4
	 * @type {Number}
	 */
	m4: 16
};

class ShaderAttribute {

	constructor(type, dynamicBuffer, arrayType) {
		let typeMap = _typeSizeMap;

		this.type = typeof type === 'string' && typeMap.hasOwnProperty(type) ? type : 'f';
		this.componentSize = typeMap[this.type];
		this.arrayType = arrayType || Float32Array;
		this.typedArray = null;
		this.bufferAttribute = null;
		this.dynamicBuffer = !!dynamicBuffer;

		this.updateMin = 0;
		this.updateMax = 0;
	}

	/**
	 * Calculate the minimum and maximum update range for this buffer attribute using
	 * component size independant min and max values.
	 *
	 * @param {Number} min The start of the range to mark as needing an update.
	 * @param {Number} max The end of the range to mark as needing an update.
	 */
	setUpdateRange(min, max) {
		this.updateMin = Math.min(min * this.componentSize, this.updateMin * this.componentSize);
		this.updateMax = Math.max(max * this.componentSize, this.updateMax * this.componentSize);
	}

	/**
	 * Calculate the number of indices that this attribute should mark as needing
	 * updating. Also marks the attribute as needing an update.
	 */
	flagUpdate() {
		let attr = this.bufferAttribute,
			range = attr.buffer.updateRange;

		range.offset = this.updateMin;
		range.count = Math.min((this.updateMax - this.updateMin) + this.componentSize, this.typedArray.array.length);
		attr.buffer.version++;
	}



	/**
	 * Reset the index update counts for this attribute
	 */
	resetUpdateRange() {
		this.updateMin = 0;
		this.updateMax = 0;
	}

	resetDynamic() {
		this.bufferAttribute.buffer.usage = this.dynamicBuffer ?
			t3d.BUFFER_USAGE.DYNAMIC_DRAW :
			t3d.BUFFER_USAGE.STREAM_DRAW;
	}

	/**
	 * Perform a splice operation on this attribute's buffer.
	 * @param  {Number} start The start index of the splice. Will be multiplied by the number of components for this attribute.
	 * @param  {Number} end The end index of the splice. Will be multiplied by the number of components for this attribute.
	 */
	splice(start, end) {
		this.typedArray.splice(start, end);

		// Reset the reference to the attribute's typed array
		// since it has probably changed.
		this.forceUpdateAll();
	}

	forceUpdateAll() {
		this.bufferAttribute.buffer.array = this.typedArray.array;
		this.bufferAttribute.buffer.updateRange.offset = 0;
		this.bufferAttribute.buffer.updateRange.count = -1;

		this.bufferAttribute.buffer.usage = t3d.BUFFER_USAGE.STATIC_DRAW;
		this.bufferAttribute.buffer.version++;
	}

	/**
	 * Make sure this attribute has a typed array associated with it.
	 *
	 * If it does, then it will ensure the typed array is of the correct size.
	 *
	 * If not, a new TypedArrayHelper instance will be created.
	 *
	 * @param  {Number} size The size of the typed array to create or update to.
	 */
	_ensureTypedArray(size) {
		// Condition that's most likely to be true at the top: no change.
		if (this.typedArray !== null && this.typedArray.size === size * this.componentSize) {
			return;
		} else if (this.typedArray !== null && this.typedArray.size !== size) {
			// Resize the array if we need to, telling the TypedArrayHelper to
			// ignore it's component size when evaluating size.
			this.typedArray.setSize(size);
		} else if (this.typedArray === null) {
			// This condition should only occur once in an attribute's lifecycle.
			this.typedArray = new TypedArrayHelper(this.arrayType, size, this.componentSize);
		}
	}


	/**
	 * Creates a t3d.BufferAttribute instance if one doesn't exist already.
	 *
	 * Ensures a typed array is present by calling _ensureTypedArray() first.
	 *
	 * If a buffer attribute exists already, then it will be marked as needing an update.
	 *
	 * @param  {Number} size The size of the typed array to create if one doesn't exist, or resize existing array to.
	 */
	_createBufferAttribute(size) {
		// Make sure the typedArray is present and correct.
		this._ensureTypedArray(size);

		// Don't create it if it already exists, but do
		// flag that it needs updating on the next render
		// cycle.
		if (this.bufferAttribute !== null) {
			this.bufferAttribute.buffer.array = this.typedArray.array;

			this.bufferAttribute.buffer.count = this.bufferAttribute.buffer.array.length / this.bufferAttribute.buffer.stride;
			this.bufferAttribute.buffer.version++;
			return;
		}

		this.bufferAttribute = new t3d.Attribute(new t3d.Buffer(this.typedArray.array, this.componentSize));

		this.bufferAttribute.usage = this.dynamicBuffer ?
			t3d.BUFFER_USAGE.DYNAMIC_DRAW :
			t3d.BUFFER_USAGE.STATIC_DRAW;
	}

	/**
	 * Returns the length of the typed array associated with this attribute.
	 * @return {Number} The length of the typed array. Will be 0 if no typed array has been created yet.
	 */
	getLength() {
		if (this.typedArray === null) {
			return 0;
		}

		return this.typedArray.array.length;
	}

}

export { ShaderAttribute };
