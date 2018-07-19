"use strict";
const gitSpawn = require("./spawn");

function commit (options = {}) {
	return gitSpawn({
		...options,
		args: [
			"commit",
			// options.amend ? "--amend" : "--no-amend",
			options.verify ? "--verify" : "--no-verify",
			options.message ? "--file=-" : "--allow-empty-message",
		].concat(options.args),
		input: options.message,
	});
}

module.exports = commit;
