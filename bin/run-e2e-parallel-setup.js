"use strict";

/**
 * Starts wp-env, npm run build --if-present, and optionally Playwright browsers in parallel.
 *
 * Used by polylang/actions/e2e in a single composite step so child processes can be
 * awaited in one shell. Run from the consumer repository root.
 *
 * @example
 * node run-e2e-parallel-setup.js --config=.wp-env.test.json --with-playwright-browsers
 *
 * Options:
 * --config=<path>           wp-env config file (default: .wp-env.json)
 * --with-playwright-browsers  Install Chromium via `playwright install --with-deps`
 */

const { spawn } = require("child_process");

/**
 * Parses command line arguments for the run-e2e-parallel-setup script.
 *
 * @return {{ wpEnvConfig: string, installPlaywright: boolean }}
 */
function parseArgs() {
	const options = {
		wpEnvConfig: ".wp-env.json",
		installPlaywright: false,
	};

	for (let i = 2; i < process.argv.length; i++) {
		const arg = process.argv[i];

		if (arg === "--with-playwright-browsers") {
			options.installPlaywright = true;
			continue;
		}

		if (arg.startsWith("--config=")) {
			options.wpEnvConfig = arg.slice("--config=".length);
		}
	}

	return options;
}

const { wpEnvConfig, installPlaywright } = parseArgs();

/**
 * Runs a command in a child process.
 *
 * @param {string}   name    Label for error messages.
 * @param {string}   command Executable.
 * @param {string[]} args    Arguments.
 * @return {Promise<{ name: string, code: number }>}
 */
function run(name, command, args) {
	return new Promise((resolve) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			env: process.env,
			shell: false,
		});
		child.on("error", () => resolve({ name, code: 1 }));
		child.on("close", (code) => resolve({ name, code: code ?? 1 }));
	});
}

const tasks = [
	run("wp-env", "npx", ["wp-env", "start", `--config=${wpEnvConfig}`]),
	run("npm run build", "npm", ["run", "build", "--if-present"]),
];

if (installPlaywright) {
	// Only Chromium is required in consumer projects at the moment.
	tasks.push(
		run("playwright install", "npx", [
			"playwright",
			"install",
			"chromium",
			"--with-deps",
		]),
	);
}

Promise.all(tasks).then((results) => {
	const failed = results.filter(({ code }) => code !== 0);
	if (failed.length === 0) {
		process.exit(0);
	}
	for (const { name, code } of failed) {
		process.stderr.write(`${name} failed with exit code ${code}.\n`);
	}
	process.exit(1);
});
