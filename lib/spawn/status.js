/*
$ git status --porcelain=2 --branch
# branch.oid 6fb38b8894de04b9eea09fcca53aaa207748841e
# branch.head master
# branch.upstream origin/master
# branch.ab +1 -1
1 .D N... 100644 100644 000000 a39d9066973c87519eda803032300787bebe41fd a39d9066973c87519eda803032300787bebe41fd lib/spawn/blame.js
1 D. N... 100644 000000 000000 31f00099052294ce660bbcca849a1e80e5c6b3a4 0000000000000000000000000000000000000000 lib/spawn/hash-object.js
1 .M N... 100644 100644 100644 c6b4fd0e600bb2c9990e711fce95528697cf5db7 c6b4fd0e600bb2c9990e711fce95528697cf5db7 lib/spawn/index.js
2 R. N... 100644 100644 100644 17d085a4890f6a4e207d7791e033974cb276ed00 17d085a4890f6a4e207d7791e033974cb276ed00 R100 lib/spawn/log.bak lib/spawn/log.js
1 M. N... 100644 100644 100644 6c66315e8546311f73e61c17e33d6c4ee856ae70 4dcc69ab7abed7490d22427e406f65c0c56311fd lib/spawn/status.js
1 A. N... 000000 100644 100644 0000000000000000000000000000000000000000 f3a38e78de7fff937c5089326dcfcbefec204da5 test/fixtures/staged.txt
? test/fixtures/unstaged.txt
*/

"use strict";
const gitSpawn = require("./spawn");
const File = require("../file");

function isZero (str) {
	return /^0+$/.test(str);
}

function status (options = {}) {
	return gitSpawn({
		...options,
		args: [
			"status",
			// Give the output in an easy-to-parse format for scripts. This is similar to the short output, but will remain stable across Git versions and regardless of user configuration. See below for details.
			"--porcelain=v2",
			// Show untracked files.
			"--untracked-files=all",
			// Terminate entries with NUL, instead of LF.
			"-z",
			// "--branch",
		].concat(options.args),
		/* eslint-disable-next-line no-control-regex */
		matcher: /(?:([?#])+\s+([^\u0000]+)|(\d+)\s+([.\w]+)\s+([.\w]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\w+)\s+(\w+)\s+(?:(\w+)\s+([^\u0000]+)\u0000)?([^\u0000]+))\u0000/gm,
		mapper: function (
			type,
			value,
			tag,
			status,
			unknow,
			oldMode,
			indexMode,
			workMode,
			oldBlob,
			indexBlob,
			nameStatus,
			newName,
			name
		) {
			if (type) {
				if (type[0] === "?") {
					return new File({
						cwd: options.gitWorkTree,
						relative: value,
						inWorkingTree: true,
						inIndex: false,
					});
				}
				return;
			}
			let oldFile;
			let indexFile;
			let workFile;

			if (!isZero(oldMode)) {
				oldFile = new File({
					cwd: options.gitWorkTree,
					mode: oldMode,
					blob: oldBlob,
					relative: name,
					inWorkingTree: false,
					inIndex: false,
				});
				this.push(oldFile);
			}

			if (!isZero(indexMode)) {
				indexFile = new File({
					cwd: options.gitWorkTree,
					mode: indexMode,
					blob: indexBlob,
					relative: newName || name,
					inWorkingTree: /\.$/.test(status),
					inIndex: true,
					oldFile,
				});
				this.push(indexFile);
			}

			if (!/\.$/.test(status) && !isZero(workMode)) {
				workFile = new File({
					cwd: options.gitWorkTree,
					mode: workMode,
					relative: newName || name,
					inWorkingTree: true,
					inIndex: false,
					oldFile: indexFile,
				});
				this.push(workFile);
			}
			// if (name === "test/fixtures/staged.txt") {
			// 	console.log(
			// 		status,
			// 		unknow,
			// 		oldMode,
			// 		indexMode,
			// 		workMode,
			// 		oldBlob,
			// 		indexBlob,
			// 		nameStatus,
			// 		newName,
			// 		name
			// 	);
			// }
		},
	});
}

module.exports = status;
