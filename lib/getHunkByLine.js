"use strict";
module.exports = (getHunkByIndex) => {
	const lines = [];
	return function getHunkByLine (lineNumber) {
		if (lines[lineNumber]) {
			return lines[lineNumber];
		}
		let index = lines.length;
		let blameHunk;
		while ((blameHunk = getHunkByIndex(index++))) {
			const firstLine = blameHunk.finalStartLineNumber;
			const lastLine = firstLine + blameHunk.linesInHunk;
			lines.fill(blameHunk, firstLine, lastLine);
			if (lineNumber >= firstLine && lineNumber <= lastLine) {
				return blameHunk;
			}
		}
	};
};
