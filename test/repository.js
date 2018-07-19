"use strict";
const gitStream = require("..");
const path = require("path");
const fs = require("fs-extra");
const fixtures = path.join.bind(path, __dirname, "fixtures");
const expect = require("chai").expect;
const File = require("../lib/file");

describe("repository", () => {
	before(async () => {
		await Promise.all([
			fs.remove(fixtures("init")),
			fs.remove(fixtures("commit")),
			fs.remove(fixtures("clone")),
		]);
	});

	it("init", async () => {
		const git = gitStream({
			gitWorkTree: fixtures("init"),
			gitDir: ".gitMock",
			// debug: true,
		});
		await git.init();
		expect(await fs.readFile(path.resolve(git.options.gitWorkTree, git.options.gitDir, "HEAD"), "utf8")).to.be.match(/\w+/);
		await fs.remove(git.options.gitWorkTree);
	});

	it("commit", async () => {
		const git = gitStream({
			gitWorkTree: fixtures("commit"),
			gitDir: ".gitMock",
			// debug: true,
		});
		await git.init();
		const stream = git.updateIndex();
		stream.end(new File({
			cwd: git.options.gitWorkTree,
			contents: Buffer.from("in-head"),
			relative: "test/fixtures/in-head.txt",
		}));
		await stream;
		await git.commit({
			verify: false,
			message: "commit test case",
		});
		const files = await git.lsFiles().pipe(git.catFile());
		const file = files.find(file => file.relative === "test/fixtures/in-head.txt");
		expect(file).to.be.ok;
		expect(file.contents.toString()).to.equal("in-head");
		expect(file.blob.toString()).to.match(/^\w+$/);
		await fs.remove(git.options.gitWorkTree);
	});

	if (process.env.CI) {
		it("clone", async () => {
			const git = gitStream({
				gitWorkTree: fixtures("clone"),
				gitDir: ".gitMock",
				// debug: true,
			});
			await git.clone("https://github.com/gucong3000/gulp-git2.git");
			expect(await fs.exists(path.resolve(git.options.gitWorkTree, git.options.gitDir, "HEAD"))).to.be.true;
			await fs.remove(git.options.gitWorkTree);
		});
	}
});
