"use strict";
const updateIndex = require("./update-index");
const hashObject = require("./hash-object");
const catFile = require("./cat-file");
const lsFiles = require("./ls-files");
const status = require("./status");
const commit = require("./commit");
const blame = require("./blame");
const clone = require("./clone");
const init = require("./init");
const Base = require("../base");
const diff = require("./diff");

class GitSpawn extends Base {
	clone (cloneURL, options) {
		return clone(cloneURL, {
			...this.options,
			...options,
		});
	}
	init (options) {
		return init({
			...this.options,
			...options,
		});
	}
	commit (options) {
		return commit({
			...this.options,
			...options,
		});
	}
	status (options) {
		return status({
			...this.options,
			...options,
		});
	}
	lsFiles (options) {
		return lsFiles({
			...this.options,
			...options,
		});
	}
	staged () {
		return diff({
			...this.options,
			args: "--staged",
		});
	}
	unstaged () {
		return diff({
			...this.options,
		});
	}
	_blame (file, options) {
		return blame(file, {
			...this.options,
			...options,
		});
	}
	_catFile (file, options) {
		return catFile(file, {
			...this.options,
			...options,
		});
	}
	_hashObject (file, options) {
		return hashObject(file, {
			...this.options,
			...options,
		});
	}
	_updateIndex (files, options) {
		return updateIndex.apply(this, [
			files,
			{
				...this.options,
				...options,
			},
		]);
	}
	diffWithIndex (diffComp = "refs/remotes/origin/HEAD..") {
		return diff({
			...this.options,
			args: diffComp.replace(/([.\s]+).*$/, ".."),
		});
	}
}

module.exports = GitSpawn;
