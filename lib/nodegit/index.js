"use strict";
const Git = require("./git");
const through = require("through2");
const Vinyl = require("vinyl");

function array2stream (files) {
	const stream = through.obj();
	Promise.resolve(files).then(files => {
		files.forEach(file => {
			stream.push(file);
		});
		stream.pause();
		process.nextTick(() => {
			stream.resume();
			stream.end();
		});
	}, stream.emit.bind(stream, "error"));
	return stream;
}

class GitStream extends Git {
	status (...options) {
		return array2stream(super.status(...options));
	}
	lsFiles (...options) {
		return array2stream(super.lsFiles(...options));
	}
	diffWithIndex (diff) {
		diff = Array.prototype.slice.call(diff.match(/^(.*?)((?:\.+[^.]*)?)$/), 1);
		return array2stream(super.diffWithIndex(...diff));
	}
	staged (...options) {
		return array2stream(super.staged(...options));
	}
	unstaged (...options) {
		return array2stream(super.unstaged(...options));
	}
	blame (...options) {
		if (options && options[0] && Vinyl.isVinyl(options[0])) {
			return super.blame(...options);
		}
		const blame = super.blame.bind(this);
		async function transform (file, encoding, done) {
			if (!file.isDirectory()) {
				try {
					file.blame = await blame(file, ...options);
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
}

module.exports = GitStream;
