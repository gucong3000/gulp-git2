"use strict";
const isBinaryPath = require("is-binary-path");
const readStream = require("../read-stream");
const gitSpawn = require("./spawn");
const fs = require("fs");

async function catFile (file, options = {}) {
	options = {
		skipBin: 4100,
		...options,
	};

	if (options.skipBin && isBinaryPath(file.path)) {
		return null;
	}

	const blob = file.blob;
	let stream;

	if (file.inWorkingTree) {
		stream = fs.createReadStream(file.history[0]);
	} else {
		stream = gitSpawn({
			cwd: file.cwd,
			encoding: "buffer",
			...options,
			args: [
				"cat-file",
				// Typically this matches the real type of <object> but asking for a type that can trivially be dereferenced from the given <object> is also permitted. An example is to ask for a "tree" with <object> being a commit object that contains it, or to ask for a "blob" with <object> being a tag object that points at it.
				"blob",
				blob,
			].concat(options.args),
		});
	}

	return readStream(stream, options);
}

module.exports = catFile;
