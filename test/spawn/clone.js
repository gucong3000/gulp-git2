"use strict";
const path = require("path");
const gitStream = require("../..");
const fixtures = path.join.bind(path, __dirname, "..", "..fixtures");
const expect = require("chai").expect;
const fs = require("fs-extra");

describe("clone", () => {
	const clear = async () => {
		await Promise.all([
			fs.remove(fixtures("clone")),
		]);
	};
	after(clear);
	beforeEach(clear);
	if (process.env.CI) {
		it("is clone success", async () => {
			const git = gitStream({
				gitWorkTree: fixtures("clone"),
				gitDir: ".gitMock",
			});
			await git.clone("https://github.com/gucong3000/gulp-git2");
			expect(await fs.exists(path.resolve(git.gitWorkTree, git.gitDir, "HEAD"))).to.be.true;
		});
	}
});
