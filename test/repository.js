"use strict";
const gitStream = require("..");
const path = require("path");
const fs = require("fs-extra");
const fixtures = path.join.bind(path, __dirname, "fixtures");
const expect = require("chai").expect;

describe("repository", () => {
	const clear = async () => {
		await Promise.all([
			fs.remove(fixtures("init")),
			fs.remove(fixtures("clone")),
		]);
	};
	after(clear);
	beforeEach(clear);

	it("init", async () => {
		const git = gitStream({
			gitWorkTree: fixtures("init"),
			gitDir: ".gitMock",
			// debug: true,
		});
		await git.init();
		expect(await fs.exists(path.resolve(git.gitWorkTree, git.gitDir, "HEAD"))).to.be.true;
	});

	if (process.env.CI) {
		it("clone", async () => {
			const git = gitStream({
				gitWorkTree: fixtures("clone"),
				gitDir: ".gitMock",
				// debug: true,
			});
			await git.clone("https://github.com/gucong3000/gulp-git2.git");
			expect(await fs.exists(path.resolve(git.gitWorkTree, git.gitDir, "HEAD"))).to.be.true;
		});
	}
});
