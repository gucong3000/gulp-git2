"use strict";
const through = require("through2");

function hashObject (getBlob) {
	async function transform (file, encoding, done) {
		if (!file.isDirectory()) {
			let blob;
			try {
				blob = await getBlob(file);
			} catch (ex) {
				done(ex);
				return;
			}
			file.blob = blob;
		}
		this.push(file);
		done();
	}
	return through.obj(transform);
}

module.exports = hashObject;
