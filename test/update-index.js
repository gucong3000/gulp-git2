"use strict";
const gitStream = require("..");
const spawnAsync = require("./spawn-async");
const File = require("../lib/file");
const fs = require("fs-extra");
const path = require("path");
const fixtures = path.join.bind(path, __dirname, "fixtures");
const expect = require("chai").expect;

describe("updateIndex", () => {
	const cwd = fixtures("update-index");

	let git;

	before(async () => {
		await fs.remove(cwd);
		git = gitStream({
			gitWorkTree: cwd,
			gitDir: ".gitMock",
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
			message: "init for update-index test case",
		});
	});

	after(() => {
		return fs.remove(cwd);
	});

	it("add a new file", async () => {
		const stream = git.updateIndex();
		stream.end(new File({
			cwd: git.options.gitWorkTree,
			contents: Buffer.from("staged"),
			relative: "test/fixtures/staged.txt",
		}));

		await stream;
		const status = await spawnAsync("git --work-tree=$PWD --git-dir=.gitMock status --porcelain=v2", {
			encoding: "utf8",
			cwd,
		});
		expect(status).to.match(/1 A\w N... \d+ \d+ \d+ \w+ \w+ test\/fixtures\/staged\.txt$/m);
	});

	it("update a file", async () => {
		const stream = git.updateIndex();
		stream.end(new File({
			cwd: git.options.gitWorkTree,
			contents: Buffer.from("updated"),
			relative: "test/fixtures/in-head.txt",
		}));
		await stream;

		const status = await spawnAsync("git --work-tree=$PWD --git-dir=.gitMock status --porcelain=v2", {
			encoding: "utf8",
			cwd,
		});
		expect(status).to.match(/^1 M\w N... \d+ \d+ \d+ \w+ \w+ test\/fixtures\/in-head\.txt$/m);
	});

	it("remove a file", async () => {
		const stream = git.updateIndex();
		stream.end(new File({
			cwd: git.options.gitWorkTree,
			contents: null,
			relative: "test/fixtures/staged.txt",
		}));

		await stream;
		const status = await spawnAsync("git --work-tree=$PWD --git-dir=.gitMock status --porcelain=v2", {
			encoding: "utf8",
			cwd,
		});
		expect(status).not.match(/\s+test\/fixtures\/staged\.txt$/m);
	});
});
