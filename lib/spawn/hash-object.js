"use strict";
const gitSpawn = require("./spawn");

const emptyHash = "0".repeat(40);

async function hashObject (file, options = {}) {
	if (file.isNull()) {
		return emptyHash;
	} else if (file.blob && file.rawContents && file.contents.equals(file.rawContents)) {
		return file.blob;
	}
	return gitSpawn({
		cwd: file.cwd,
		...options,
		input: file.contents,
		args: [
			"hash-object",
			"--stdin",
			options.write && "-w",
		].concat(options.args),
	});
}

module.exports = hashObject;
