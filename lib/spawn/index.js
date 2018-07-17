"use strict";
const updateIndex = require("./update-index");
const hashObject = require("./hash-object");
const catFile = require("./cat-file");
const lsFiles = require("./ls-files");
const status = require("./status");
const blame = require("./blame");
const clone = require("./clone");
const init = require("./init");
const Base = require("../base");
const diff = require("./diff");

class GitSpawn extends Base {
	constructor (...options) {
		super(...options);
		this.spawnOpts = {
			gitWorkTree: this.gitWorkTree,
			gitDir: this.gitDir,
			debug: this.debug,
		};
	}
	clone (cloneURL) {
		return clone(cloneURL, {
			...this.spawnOpts,
		});
	}
	init () {
		return init({
			...this.spawnOpts,
		});
	}
	status () {
		return status({
			...this.spawnOpts,
		});
	}
	lsFiles () {
		return lsFiles({
			...this.spawnOpts,
		});
	}
	staged () {
		return diff({
			...this.spawnOpts,
			args: "--staged",
		});
	}
	unstaged () {
		return diff({
			...this.spawnOpts,
		});
	}
	_blame (file, options) {
		return blame(file, {
			...this.spawnOpts,
			...options,
		});
	}
	_catFile (file, options) {
		return catFile(file, {
			...this.spawnOpts,
			...options,
		});
	}
	_hashObject (file, options) {
		return hashObject(file, {
			...this.spawnOpts,
			...options,
		});
	}
	_updateIndex (files, options) {
		return updateIndex.apply(this, [
			files,
			{
				...this.spawnOpts,
				...options,
			},
		]);
	}
	diffWithIndex (diffComp = "refs/remotes/origin/HEAD..") {
		return diff({
			...this.spawnOpts,
			args: diffComp.replace(/([.\s]+).*$/, ".."),
		});
	}
}

module.exports = GitSpawn;
