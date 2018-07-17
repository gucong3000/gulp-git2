"use strict";

class TimeWrap {
	constructor (time) {
		this.__time = time;
	}
	get offset () {
		if (!this._offset) {
			this._offset = this.__time.offset();
		}
		return this._offset;
	}
	get time () {
		if (!this._time) {
			this._time = this.__time.time();
		}
		return this._time;
	}
}

module.exports = TimeWrap;
