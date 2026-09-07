'use strict';

/**
 * Resolves the PHP version from .wp-env.json for CI.
 *
 * Used by polylang/actions/e2e for setup-php and wp-env. Must be run from the
 * consumer repository root.
 *
 * @example
 * PHP_VERSION=$(node "${{ github.action_path }}/../bin/get-wp-env-php-version.js")
 *
 * Output:
 * - Prints the phpVersion string to stdout on success.
 * - Exits with code 1 and writes an error message to stderr when phpVersion is missing or null.
 */

const fs = require( 'fs' );
const path = require( 'path' );

const configPath = path.join( process.cwd(), '.wp-env.json' );

let config;

try {
	config = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );
} catch {
	process.stderr.write(
		'Could not read .wp-env.json. Set an explicit phpVersion for CI (see @wordpress/env docs).'
	);
	process.exit( 1 );
}

const phpVersion = config.phpVersion;

if ( typeof phpVersion === 'string' && phpVersion.length > 0 ) {
	process.stdout.write( phpVersion );
	process.exit( 0 );
}

process.stderr.write(
	'.wp-env.json must set a non-null phpVersion for CI. When null, wp-env uses the default wordpress Docker image PHP version; set an explicit version (e.g. "8.4") instead.'
);
process.exit( 1 );
