"use strict";
const gitSpawn = require("./spawn");

function updateIndex (files, options = {}) {
	files = files.filter(
		file => file.blob
	);

	if (!files.length) {
		return;
	}

	const relativePath = this.relative.bind(this);

	files = files.map(
		file => (/^0+$/.test(file.blob) ? [
			"0",
			file.blob,
			"0",
		] : [
			(file.mode ? file.mode.toString(8) : "100644"),
			file.blob,
			file.stage || "0",
		]).join(" ") + "\t" + relativePath(file.path)
	);

	return gitSpawn({
		...options,
		input: files.join("\u0000"),
		args: [
			"update-index",
			"-z",
		].concat(options.args).concat(
			"--index-info"
		),
	});
}

module.exports = updateIndex;
