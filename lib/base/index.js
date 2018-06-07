"use strict";
const path = require("path");
const catFile = require("./cat-file");
const hashObject = require("./hash-object");
const updateIndex = require("./update-index");

const Vinyl = require("vinyl");

function isVinyl (options) {
	return options && options.length && options[0] && Vinyl.isVinyl(options[0]);
}

class Git {
	constructor (options = {}) {
		const gitWorkTree = options.gitWorkTree || process.env.GIT_WORK_TREE;
		this.gitWorkTree = gitWorkTree ? path.resolve(gitWorkTree) : process.cwd();
		this.gitDir = options.gitDir || process.env.GIT_DIR || ".git";
		this.debug = options.debug;
	}
	catFile (...options) {
		if (isVinyl(options)) {
			return this._catFile(...options);
		}
		return catFile((file) => (
			this._catFile(file, ...options)
		));
	}
	hashObject (...options) {
		if (isVinyl(options)) {
			return this._hashObject(...options);
		}
		return hashObject((file) => (
			this._hashObject(file, ...options)
		));
	}
	updateIndex (...options) {
		return updateIndex.apply(this, options);
	}
	relative (file) {
		let relative = path.relative(this.gitWorkTree, file);
		if (path.sep === "\\") {
			relative = relative.split(path.sep).join("/");
		}
		return relative;
	}
}

module.exports = Git;
