import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const schemaPath = path.join(cwd, 'schemas', 'particle.schema.json');
const particleDir = path.join(cwd, 'examples', 'resources', 'particles');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

function isObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function typeMatches(value, typeName) {
	switch (typeName) {
		case 'null':
			return value === null;
		case 'array':
			return Array.isArray(value);
		case 'object':
			return isObject(value);
		case 'number':
			return typeof value === 'number' && Number.isFinite(value);
		case 'integer':
			return Number.isInteger(value);
		case 'string':
			return typeof value === 'string';
		case 'boolean':
			return typeof value === 'boolean';
		default:
			return false;
	}
}

function resolveRef(rootSchema, ref) {
	if (!ref.startsWith('#/')) {
		throw new Error(`Unsupported $ref: ${ref}`);
	}
	const parts = ref.slice(2).split('/');
	let cur = rootSchema;
	for (const p of parts) {
		cur = cur[p];
		if (cur === undefined) {
			throw new Error(`Unresolved $ref: ${ref}`);
		}
	}
	return cur;
}

function validateWithSchema(rootSchema, schemaNode, value, dataPath, errors) {
	let node = schemaNode;
	if (node.$ref) {
		node = resolveRef(rootSchema, node.$ref);
	}

	if (node.const !== undefined && value !== node.const) {
		errors.push(`${dataPath}: expected const ${JSON.stringify(node.const)}, got ${JSON.stringify(value)}`);
		return;
	}

	if (node.enum && !node.enum.includes(value)) {
		errors.push(`${dataPath}: value ${JSON.stringify(value)} not in enum ${JSON.stringify(node.enum)}`);
	}

	if (node.type !== undefined) {
		const typeOk = Array.isArray(node.type)
			? node.type.some(t => typeMatches(value, t))
			: typeMatches(value, node.type);
		if (!typeOk) {
			errors.push(`${dataPath}: expected type ${JSON.stringify(node.type)}, got ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}`);
			return;
		}
	}

	if (typeof value === 'number') {
		if (node.minimum !== undefined && value < node.minimum) {
			errors.push(`${dataPath}: number ${value} < minimum ${node.minimum}`);
		}
		if (node.maximum !== undefined && value > node.maximum) {
			errors.push(`${dataPath}: number ${value} > maximum ${node.maximum}`);
		}
	}

	if (typeof value === 'string' && node.pattern) {
		const re = new RegExp(node.pattern);
		if (!re.test(value)) {
			errors.push(`${dataPath}: string ${JSON.stringify(value)} does not match pattern ${JSON.stringify(node.pattern)}`);
		}
	}

	if (Array.isArray(value)) {
		if (node.minItems !== undefined && value.length < node.minItems) {
			errors.push(`${dataPath}: array length ${value.length} < minItems ${node.minItems}`);
		}
		if (node.maxItems !== undefined && value.length > node.maxItems) {
			errors.push(`${dataPath}: array length ${value.length} > maxItems ${node.maxItems}`);
		}
		if (node.items) {
			value.forEach((item, index) => {
				validateWithSchema(rootSchema, node.items, item, `${dataPath}[${index}]`, errors);
			});
		}
	}

	if (isObject(value)) {
		const props = node.properties || {};
		const required = node.required || [];

		for (const key of required) {
			if (!(key in value)) {
				errors.push(`${dataPath}: missing required property ${key}`);
			}
		}

		for (const [key, propValue] of Object.entries(value)) {
			if (props[key]) {
				validateWithSchema(rootSchema, props[key], propValue, `${dataPath}.${key}`, errors);
			} else if (node.additionalProperties === false) {
				errors.push(`${dataPath}: unexpected property ${key}`);
			}
		}
	}
}

function validateFile(filePath) {
	const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	const errors = [];
	validateWithSchema(schema, schema, json, '$', errors);
	return errors;
}

function collectJsonFilesFromPath(targetPath) {
	const resolved = path.resolve(cwd, targetPath);
	if (!fs.existsSync(resolved)) {
		throw new Error(`Target not found: ${targetPath}`);
	}

	const stat = fs.statSync(resolved);
	if (stat.isDirectory()) {
		return fs
			.readdirSync(resolved)
			.filter(name => name.endsWith('.json'))
			.sort()
			.map(name => path.join(resolved, name));
	}

	if (stat.isFile() && resolved.endsWith('.json')) {
		return [resolved];
	}

	throw new Error(`Unsupported target (must be .json file or directory): ${targetPath}`);
}

function collectTargets(argvTargets) {
	if (argvTargets.length === 0) {
		return fs
			.readdirSync(particleDir)
			.filter(name => name.endsWith('.json'))
			.sort()
			.map(name => path.join(particleDir, name));
	}

	const targetFiles = [];
	for (const target of argvTargets) {
		targetFiles.push(...collectJsonFilesFromPath(target));
	}

	return [...new Set(targetFiles)].sort();
}

const files = collectTargets(process.argv.slice(2));

let invalidCount = 0;
for (const fullPath of files) {
	const relPath = path.relative(cwd, fullPath).replace(/\\/g, '/');
	const errors = validateFile(fullPath);
	if (errors.length === 0) {
		console.log(`PASS ${relPath}`);
	} else {
		invalidCount++;
		console.log(`FAIL ${relPath}`);
		for (const err of errors.slice(0, 20)) {
			console.log(`  - ${err}`);
		}
		if (errors.length > 20) {
			console.log(`  - ... ${errors.length - 20} more errors`);
		}
	}
}

if (invalidCount > 0) {
	console.error(`\nValidation finished: ${invalidCount}/${files.length} files failed.`);
	process.exitCode = 1;
} else {
	console.log(`\nValidation finished: all ${files.length} files passed.`);
}

console.log(`Schema: ${pathToFileURL(schemaPath).href}`);
