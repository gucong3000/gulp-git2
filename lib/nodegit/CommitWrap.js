"use strict";
const SignatureWrap = require("./SignatureWrap");

class TimeWrap {
	constructor (commit) {
		this.commit = commit;
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
}

module.exports = TimeWrap;
