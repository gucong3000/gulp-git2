"use strict";
const spawn = require("child_process").spawn;

function spawnAsync (command, options = {}) {
	function encodeBuf (buf) {
		buf = Buffer.concat(buf);
		if (options.encoding && options.encoding !== "buffer") {
			buf = buf.toString(options.encoding);
		}
		return buf;
	}
	return new Promise((resolve, reject) => {
		const bash = spawn("bash", [
			"-c",
			command,
		], options);
		const stdout = [];
		const stderr = [];
		bash.stdout.on("data", (buf) => {
			stdout.push(buf);
		});
		bash.stderr.on("data", (buf) => {
			stderr.push(buf);
		});
		bash.on("error", reject);
		bash.on("close", (code) => {
			// code === null when child_process is killed
			if (code) {
				reject(encodeBuf(stderr) || code);
			} else {
				resolve(encodeBuf(stdout));
			}
		});
		if (options.input) {
			bash.stdin.end(options.input);
		}
	});
}
module.exports = spawnAsync;
