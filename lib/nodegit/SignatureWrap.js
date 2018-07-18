"use strict";
const TimeWrap = require("./TimeWrap");
const util = require("util");

class SignatureWrap {
	constructor (signature) {
		this.signature = signature;
	}
	get name () {
		if (!this._name) {
			this._name = this.signature.name();
		}
		return this._name;
	}
	get email () {
		if (!this._email) {
			this._email = this.signature.email();
		}
		return this._email;
	}
	get when () {
		if (!this._when) {
			this._when = new TimeWrap(this.signature.when());
		}
		return this._when;
	}
	get time () {
		return this.when.time;
	}
	get offset () {
		return this.when.offset;
	}
	[util.inspect.custom] () {
		return {
			name: this.name,
			email: this.email,
			time: this.time,
			offset: this.offset,
		};
	}
}

module.exports = SignatureWrap;
