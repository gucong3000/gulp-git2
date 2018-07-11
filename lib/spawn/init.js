"use strict";
const gitSpawn = require("./spawn");
const fs = require("fs-extra");

function init (options = {}) {
	return gitSpawn({
		...options,
		args: [
			"init",
		].concat(options.args),
		cwd: options.gitWorkTree,
		before: options.gitWorkTree && (async () => {
			await fs.ensureDir(options.gitWorkTree);
		}),
	});
}

module.exports = init;
