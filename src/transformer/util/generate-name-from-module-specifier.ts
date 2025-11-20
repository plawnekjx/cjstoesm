import path from "@plawnekjx/crosspath";

/**
 * Generates a proper name based on the given module specifier
 */
export function generateNameFromModuleSpecifier(moduleSpecifier: string): string {
	const {name} = path.parse(moduleSpecifier);
	return camelCase(name);
}

/**
 * camelCases the given string.
 * @param {string} str
 * @returns {string}
 */
function camelCase(str: string): string {
	return lowerCaseFirst(str
	// Replaces any - or _ characters with a space
		.replace(/[-_+]+/g, " ").replace(/[ ]{2,}/g, " ")
		// Removes any non alphanumeric characters
		.replace(/[^\w\sa-zæøåàáäâëêéèïîíìöòóôüúùû&]/gi, "").replace(/[A-Z]{2,}/g, $1 => $1.toLowerCase())
		// Uppercases the first character in each group immediately following a space
		// (delimited by spaces)
		.replace(/ (.)/g, $1 => $1.toUpperCase())
		// Removes spaces
		.replace(/ /g, ""));
}

/**
 * Lowercases the first character of the string.
 * @param {string} str
 * @returns {string}
 */
function lowerCaseFirst(str: string): string {
	if (str.length < 2) return str.toLowerCase();
	const head = str.slice(0, 1);
	const tail = str.slice(1);
	return `${head.toLowerCase()}${tail}`;
}
