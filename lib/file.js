"use strict";
const Vinyl = require("vinyl");
const path = require("path");

function inWorkingTree (blob) {
	if (blob) {
		return blob.iszero ? blob.iszero() : /^0+$/.test(blob);
	} else {
		return !blob;
	}
}

class File extends Vinyl {
	constructor (options) {
		if (options.mode && typeof options.mode === "string") {
			options.mode = Number.parseInt(options.mode, 8);
		}
		if (!options.path) {
			options.path = path.resolve(options.cwd, options.relative);
		}
		delete options.relative;
		if ((options.inIndex || options.inIndex == null) && inWorkingTree(options.blob)) {
			options.inWorkingTree = true;
		}

		super(options);
	}
	get relative () {
		let relative = super.relative;
		if (path.sep === "\\") {
			relative = relative.split(path.sep).join("/");
		}
		return relative;
	}
}

module.exports = File;
