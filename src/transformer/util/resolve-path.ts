/* eslint-disable @typescript-eslint/no-explicit-any */
import {SafeReadonlyFileSystem} from "../../shared/file-system/file-system.js";
import path from "@plawnekjx/crosspath";
import {isExternalLibrary} from "./path-util.js";

export interface ResolveOptions {
	id: string;
	parent: string | null | undefined;
	moduleDirectory?: string;
	prioritizedExtensions?: string[];
	resolveModule?: (id: string, parent: string | null) => string;
	resolveCache: Map<string, string | null>;
	fileSystem: SafeReadonlyFileSystem;
}

/**
 * Computes a cache key based on the combination of id and parent
 */
function computeCacheKey(id: string, parent: string | null | undefined): string {
	return isExternalLibrary(id) ? id : `${parent == null ? "" : `${parent}->`}${id}`;
}

/**
 * A function that can resolve an import path
 */
export function resolvePath({
	id,
	parent,
	prioritizedExtensions = ["", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".mts", ".cts", ".tsx", ".json"],
	fileSystem,
	resolveModule,
	resolveCache
}: ResolveOptions): string | undefined {
	id = path.normalize(id);
	if (parent != null) {
		parent = path.normalize(parent);
	}

	const cacheKey = computeCacheKey(id, parent);

	// Attempt to take the resolve result from the cache
	const cacheResult = resolveCache.get(cacheKey);

	// If it is a proper path, return it
	if (cacheResult != null) return cacheResult;

	// Otherwise, if the cache result isn't strictly equal to 'undefined', it has previously been resolved to a non-existing file
	if (cacheResult === null) return;

	if (!isExternalLibrary(id)) {
		const absolute = path.isAbsolute(id) ? path.normalize(id) : path.join(parent == null ? "" : path.dirname(parent), id);
		const variants = [absolute, path.join(absolute, "index")];

		for (const variant of variants) {
			for (const ext of prioritizedExtensions) {
				const withExtension = `${variant}${ext}`;
				if (fileSystem.safeStatSync(withExtension)?.isFile() ?? false) {
					// Add it to the cache
					resolveCache.set(cacheKey, withExtension);
					return withExtension;
				}
			}
		}

		// Add it to the cache and mark it as unresolvable
		resolveCache.set(cacheKey, null);
		return undefined;
	}

	// Otherwise, try to resolve it via node module resolution and put it in the cache
	if (resolveModule == null) {
		resolveCache.set(cacheKey, null);
		return undefined;
	}
	try {
		const resolveResult = resolveModule(id, parent ?? null);

		// Add it to the cache
		resolveCache.set(cacheKey, resolveResult);

		// Return it
		return resolveResult;
	} catch (ex) {
		// No file could be resolved. Set it in the cache as unresolvable and return void
		resolveCache.set(cacheKey, null);

		// Return undefined¬
		return undefined;
	}
}
