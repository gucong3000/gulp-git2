"use strict";
const through = require("through2");

function catFile (readContents) {
	async function transform (file, encoding, done) {
		if (!file.isDirectory() && file.blob !== null) {
			let rawContents;
			try {
				rawContents = await readContents(file);
			} catch (ex) {
				done(ex);
				return;
			}
			if (rawContents == null) {
				// exclude binary file
				done();
				return;
			} else {
				file.contents = file.rawContents = rawContents;
			}
		}
		this.push(file);
		done();
	}
	return through.obj(transform);
}

module.exports = catFile;
