"use strict";
const through = require("through2");

function blame (getBlame) {
	async function transform (file, encoding, done) {
		if (!file.isDirectory()) {
			try {
				file.blame = await getBlame(file);
			} catch (ex) {
				done(ex);
				return;
			}
		}
		this.push(file);
		done();
	}
	return through.obj(transform);
}

module.exports = blame;
