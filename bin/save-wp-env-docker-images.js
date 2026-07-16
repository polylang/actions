'use strict';

/**
 * Save wp-env Docker images to a tarball for GitHub Actions caching.
 *
 * Used by polylang/actions/e2e after `wp-env start`. Resolves the wp-env work
 * directory via `wp-env status --json` (@wordpress/env 11+), falling back to
 * `wp-env install-path` on older versions, then saves images from its
 * docker-compose.yml.
 *
 * @example
 * node "${{ github.action_path }}/../bin/save-wp-env-docker-images.js"
 * node "${{ github.action_path }}/../bin/save-wp-env-docker-images.js" --config=.wp-env.json
 * node "${{ github.action_path }}/../bin/save-wp-env-docker-images.js" wp-env-image.tar
 *
 * Options:
 * - --config=<path>  Custom wp-env config file (same as wp-env --config).
 * - First non-flag argument: output tarball path (default: wp-env-image.tar).
 *
 * Output:
 * - Writes the tarball to the output path.
 * - Exits with code 1 when the install path or images cannot be resolved.
 */

const { execFileSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

const DEFAULT_OUTPUT = 'wp-env-image.tar';
const COMPOSE_FILENAME = 'docker-compose.yml';

/**
 * @param {string} configPath
 * @return {string}
 */
const getInstallPath = ( configPath ) => {
	const configArgs = configPath ? [ `--config=${ configPath }` ] : [];

	try {
		const output = execFileSync(
			'npm',
			[ 'run', 'wp-env', '--', 'status', '--json', ...configArgs ],
			{ encoding: 'utf8' }
		);
		const jsonStart = output.indexOf( '{' );
		const jsonEnd = output.lastIndexOf( '}' );

		if ( jsonStart !== -1 && jsonEnd > jsonStart ) {
			const status = JSON.parse( output.slice( jsonStart, jsonEnd + 1 ) );

			if ( status?.installPath ) {
				return status.installPath;
			}
		}
	} catch {
		// Fall through: `status --json` is only available in @wordpress/env 11+.
	}

	try {
		const output = execFileSync(
			'npm',
			[ 'run', 'wp-env', '--', 'install-path', ...configArgs ],
			{ encoding: 'utf8' }
		);
		// May include npm run banners; keep the first absolute path line.
		const installPath = output
			.split( '\n' )
			.map( ( entry ) => entry.trim() )
			.find( ( entry ) => entry.startsWith( '/' ) || /^[A-Za-z]:[\\/]/.test( entry ) );

		if ( installPath ) {
			return installPath;
		}
	} catch {
		// Handled below.
	}

	process.stderr.write( 'Could not resolve wp-env install path.\n' );
	process.exit( 1 );
};

/**
 * @param {string} composeFile
 * @return {string[]}
 */
const getComposeImageIds = ( composeFile ) => {
	try {
		const output = execFileSync(
			'docker',
			[ 'compose', '-f', composeFile, 'images', '-q' ],
			{ encoding: 'utf8' }
		);

		return output
			.split( '\n' )
			.map( ( line ) => line.trim() )
			.filter( Boolean );
	} catch {
		return [];
	}
};

/**
 * @param {string[]} argv
 * @return {{ configPath: string, outputTar: string }}
 */
const parseArgs = ( argv ) => {
	let configPath = process.env.WP_ENV_CONFIG_PATH || '';
	let outputTar = DEFAULT_OUTPUT;

	for ( const arg of argv ) {
		if ( arg.startsWith( '--config=' ) ) {
			configPath = arg.slice( '--config='.length );
			continue;
		}

		if ( ! arg.startsWith( '--' ) ) {
			outputTar = arg;
		}
	}

	return { configPath, outputTar };
};

const { configPath, outputTar } = parseArgs( process.argv.slice( 2 ) );
const installPath = getInstallPath( configPath );
const composeFile = path.join( installPath, COMPOSE_FILENAME );

if ( ! fs.existsSync( composeFile ) ) {
	process.stderr.write( `No docker-compose.yml found at ${ composeFile }.\n` );
	process.exit( 1 );
}

const imageIds = [ ...new Set( getComposeImageIds( composeFile ) ) ];

if ( imageIds.length === 0 ) {
	process.stderr.write( 'No wp-env Docker images found to cache.\n' );
	process.exit( 1 );
}

execFileSync(
	'docker',
	[ 'save', ...imageIds, '-o', outputTar ],
	{ stdio: 'inherit' }
 );
