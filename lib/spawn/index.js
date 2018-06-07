"use strict";
const updateIndex = require("./update-index");
const hashObject = require("./hash-object");
const catFile = require("./cat-file");
const lsFiles = require("./ls-files");
const status = require("./status");
const Base = require("../base");
const diff = require("./diff");

class GitSpawn extends Base {
	constructor (...options) {
		super(...options);
		this.spawnOpts = {
			gitDir: this.gitDir,
			cwd: this.gitWorkTree,
			debug: this.debug,
		};
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
	_catFile (file, options) {
		return catFile(file, {
			...options,
			...this.spawnOpts,
		});
	}
	_hashObject (file, options) {
		return hashObject(file, {
			...options,
			...this.spawnOpts,
		});
	}
	_updateIndex (files, options) {
		return updateIndex.apply(this, [
			files,
			{
				...options,
				...this.spawnOpts,
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
