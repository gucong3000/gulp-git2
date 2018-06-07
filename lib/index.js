"use strict";
let GitStream;
try {
	GitStream = require("./nodegit");
} catch (ex) {
	if (/\bnodegit\b/.test(ex.message)) {
		GitStream = require("./spawn");
	} else {
		throw ex;
	}
}

module.exports = (...options) => {
	require("./thenable");
	return new GitStream(...options);
};
