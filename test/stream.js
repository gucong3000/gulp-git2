"use strict";
const readStream = require("../lib/read-stream");
const through = require("through2");
const fs = require("fs-extra");
const expect = require("chai").expect;

require("../lib/thenable");
const binaryFile = require.resolve("nyc/node_modules/istanbul-reports/lib/html/assets/sort-arrow-sprite.png");

describe("exclude binary file", () => {
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
		const stream = fs.createReadStream(binaryFile);
		return Promise.all([
			readStream(stream),
			stream,
		]).then(contents => {
			expect(contents[0].equals(contents[1])).to.be.true;
		});
	});
});

describe("thenable stream", () => {
	before(() => {
		delete require.cache[require.resolve("../lib/thenable")];
		require("../lib/thenable");
	});
	it("stream should rejected as promise", async () => {
		const stream = through();
		process.nextTick(() => {
			stream.destroy(new Error("mock stream reject error"));
		});

		let error;
		await stream.catch(err => {
			error = err;
		});
		expect(error).to.haveOwnProperty("message", "mock stream reject error");
	});
	it("should get promise from cache", async () => {
		const stream = through.obj();
		process.nextTick(() => {
			stream.end();
		});

		// other variants of Chai's `throw` assertion work too.
		await stream.then();
		await stream.then();
	});
});
