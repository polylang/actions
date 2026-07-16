'use strict';

/**
 * Resolves the installed @playwright/test version for CI caching.
 *
 * Used by polylang/actions/e2e to build the Playwright browser cache key. Must be
 * run from the consumer repository root (where npm ci has installed dependencies).
 *
 * Resolution order:
 * 1. node_modules/@playwright/test/package.json (preferred — matches installed binaries)
 * 2. package-lock.json (npm lockfile v2/v3 packages path, or legacy dependencies)
 *
 * @example
 * PLAYWRIGHT_VERSION=$(node "${{ github.action_path }}/../bin/get-playwright-version.js")
 *
 * Output:
 * - Prints the semver string to stdout on success.
 * - Exits with code 1 and writes an error message to stderr when the version cannot be determined.
 */

const fs = require( 'fs' );
const path = require( 'path' );

/**
 * @param {string} filePath
 * @return {Object|null}
 */
const tryReadJson = ( filePath ) => {
	try {
		return JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
	} catch {
		return null;
	}
};

const root = process.cwd();
const fromPackage = tryReadJson(
	path.join( root, 'node_modules', '@playwright', 'test', 'package.json' )
);

if ( fromPackage?.version ) {
	process.stdout.write( fromPackage.version );
	process.exit( 0 );
}

const lock = tryReadJson( path.join( root, 'package-lock.json' ) );
const fromLock = lock?.packages?.['node_modules/@playwright/test']?.version
	|| lock?.dependencies?.['@playwright/test']?.version
	|| '';

if ( ! fromLock ) {
	process.stderr.write( 'Could not determine @playwright/test version.' );
	process.exit( 1 );
}

process.stdout.write( fromLock );
