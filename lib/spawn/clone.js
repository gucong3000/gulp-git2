"use strict";
const gitSpawn = require("./spawn");
const path = require("path");

function clone (cloneURL, options = {}) {
	return gitSpawn({
		...options,
		args: [
			"clone",
			"--",
			cloneURL,
			path.resolve(options.gitWorkTree, options.gitDir),
		].concat(options.args),
		cwd: process.cwd(),
	});
}

module.exports = clone;
