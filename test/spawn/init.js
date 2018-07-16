"use strict";
const path = require("path");
const gitStream = require("../..");
const fixtures = path.join.bind(path, __dirname, "..", "fixtures");
const expect = require("chai").expect;
const fs = require("fs-extra");

describe("init", () => {
	const clear = async () => {
		await Promise.all([
			fs.remove(fixtures("clone")),
		]);
	};
	after(clear);
	beforeEach(clear);
	it("init", async () => {
		const git = gitStream({
			gitWorkTree: fixtures("init"),
			gitDir: ".gitMock",
		});
		await git.init();
		expect(await fs.exists(path.resolve(git.gitWorkTree, git.gitDir, "HEAD"))).to.be.true;
	});
});
