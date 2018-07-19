"use strict";
const SignatureWrap = require("./SignatureWrap");
const util = require("util");

class TimeWrap {
	constructor (commit) {
		this.commit = commit;
	}
	get id () {
		if (!this._id) {
			this._id = this.commit.id();
		}
		return this._id;
	}
	get parents () {
		if (!this._parents) {
			this._parents = this.commit.parents();
		}
		return this._parents;
	}
	get author () {
		if (!this._author) {
			this._author = new SignatureWrap(this.commit.author());
		}
		return this._author;
	}
	get committer () {
		if (!this._committer) {
			this._committer = new SignatureWrap(this.commit.committer());
		}
		return this._committer;
	}
	get message () {
		if (!this._message) {
			this._message = this.commit.message();
		}
		return this._message;
	}
	[util.inspect.custom] () {
		return {
			id: this.id,
			parents: this.parents,
			author: this.author,
			committer: this.committer,
			message: this.message,
		};
	}
}

module.exports = TimeWrap;
