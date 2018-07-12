"use strict";
const fs = require("fs-extra");
const expect = require("chai").expect;
const readStream = require("../lib/read-stream");

describe("exclude binary file", () => {
	const binaryFile = require.resolve("nyc/node_modules/istanbul-reports/lib/html/assets/sort-arrow-sprite.png");
	it("has binary file", async () => {
		const stats = await fs.stat(binaryFile);
		expect(stats.isFile()).to.be.true;
		expect(stats.size).to.greaterThan(80);
	});
	it("should exclude binary file", async () => {
		const contents = await readStream(fs.createReadStream(binaryFile), {
			skipBin: 4100,
		});
		expect(contents).to.be.null;
	});
	it("should not exclude binary file", () => {
		return Promise.all([
			readStream(fs.createReadStream(binaryFile)),
			fs.readFile(binaryFile),
		]).then(contents => {
			expect(contents[0].equals(contents[1])).to.be.true;
		});
	});
});
