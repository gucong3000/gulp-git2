"use strict";
const gitSpawn = require("./spawn");
const getHunkByLine = require("../getHunkByLine");

function parseSignature (data, result) {
	data.replace(/^\w+-(\w+) (.*)$/gm, (s, key, value) => {
		if (/^e?mail$/i.test(key)) {
			key = "email";
			value = value.replace(/^<(.*)>$/, "$1");
		} else if (key === "time") {
			value = +value;
		} else if (key === "tz") {
			key = "offset";
			const matched = value.match(/^(\D*)(\d*)(\d{2})$/);
			value = (matched[2] * 60) + (+matched[3]);
			if (/^-+$/.test(matched[1])) {
				value = -value;
			}
		}
		result[key] = value;
		return "";
	});
	return result;
}

function parseHunk (props, result = {}) {
	props.replace(/^(\w+) (.*)(\n(?:\1-\w+ .*\n)+)/gm, (s, role, name, props) => {
		result[role] = parseSignature(props, {
			name,
		});
		return "";
	}).replace(/^summary (.*)$/igm, (s, summary) => {
		result.summary = summary;
		return "";
	}).replace(/^previous (\w+) ([^\n]+)$/igm, (s, hash, filename) => {
		result.previous = {
			hash,
			filename,
		};
		return "";
	}).replace(/^(\S+)(?: ([^\n]+))?$/gm, (s, key, value) => {
		if (value == null) {
			value = true;
		}
		result[key] = value;
		return "";
	});
	return result;
}

function parse (
	revCache,
	hash,
	origLine,
	finalLine,
	lines,
	props
) {
	if (props) {
		revCache[hash] = parseHunk(props, {
			hash,
		});
	}

	if (lines) {
		const hunkInfo = revCache[hash];
		const origInfo = hunkInfo.previous || hunkInfo;
		const hunk = {
			origCommitId: origInfo.hash,
			origPath: origInfo.filename,
			finalCommitId: hunkInfo.hash,
			origStartLineNumber: +origLine,
			finalStartLineNumber: +finalLine,
			linesInHunk: +lines,
			origSignature: revCache[origInfo.hash] && revCache[origInfo.hash].author,
			finalSignature: origInfo.author,
		};
		return hunk;
	}
}

function blame (file, options = {}) {
	const revCache = {};
	const args = [
		"blame",
		// Ignore whitespace when comparing the parent’s version and the child’s to find where the lines came from.
		"-w",
		// In addition to -M, detect lines moved or copied from other files that were modified in the same commit. This is useful when you reorganize your program and move code around across files. When this option is given twice, the command additionally looks for copies from other files in the commit that creates the file. When this option is given three times, the command additionally looks for copies from other files in any commit.
		// <num> is optional but it is the lower bound on the number of alphanumeric characters that Git must detect as moving/copying between files for it to associate those lines with the parent commit. And the default value is 40. If there are more than one -C options given, the <num> argument of the last -C will take effect.
		"-C",
		"-C",
		// Detect moved or copied lines within a file. When a commit moves or copies a block of lines (e.g. the orig file has A and then B, and the commit changes it to B and then A), the traditional blame algorithm notices only half of the movement and typically blames the lines that were moved up (i.e. B) to the parent and assigns blame to the lines that were moved down (i.e. A) to the child commit. With this option, both groups of lines are blamed on the parent by running extra passes of inspection.
		// <num> is optional but it is the lower bound on the number of alphanumeric characters that Git must detect as moving/copying within a file for it to associate those lines with the parent commit. The default value is 20.
		"-M",
		// Show in a format designed for machine consumption.
		"--porcelain",
	];

	if (!file.isNull()) {
		args.push(
			"--contents",
			"-"
		);
	}

	args.push(
		"--",
		file.history[0]
	);

	return gitSpawn({
		cwd: file.cwd,
		...options,
		args: args,
		input: file.contents,
		matcher: /(\w{40,})\s+(\d+)\s+(\d+)(?:\s+(\d+)((?:\n\S+[^\n]*)*))?\n\t[^\n]*\n/g,
		mapper: function (...matched) {
			return parse.apply(this, [revCache, ...matched]);
		},
	}).then((blame) => {
		blame.getHunkByLine = getHunkByLine(lineNumber => (blame[lineNumber]));
		return blame;
	});
}

module.exports = blame;
