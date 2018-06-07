"use strict";
const through = require("through2");

function updateIndex (options) {
	const _hashObject = this._hashObject.bind(this);
	const _updateIndex = this._updateIndex.bind(this);
	const files = [];
	async function transform (file, encoding, done) {
		if (!file.dstFile) {
			if (!file.isDirectory()) {
				let blob;
				try {
					blob = await _hashObject(file, {
						...options,
						write: true,
					});
				} catch (ex) {
					done(ex);
					return;
				}
				file.blob = blob;
				files.push(file);
			}
			this.push(file);
		}
		done();
	}
	async function flush (done) {
		try {
			await _updateIndex(files);
		} catch (ex) {
			done(ex);
			return;
		}
		done();
	}
	return through.obj(transform, flush);
}

module.exports = updateIndex;
