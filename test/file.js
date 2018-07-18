"use strict";
const gitStream = require("..");
const expect = require("chai").expect;
const fs = require("fs-extra");
const util = require("util");
const File = require("../lib/file");
const spawnAsync = require("./spawn-async");

describe("file", () => {
	let git;
	before(() => {
		git = gitStream({
			gitWorkTree: process.cwd(),
			gitDir: ".git",
		});
	});
	it("hash-object", async () => {
		const file = new File({
			cwd: git.gitWorkTree,
			relative: "README.md",
		});
		file.contents = await fs.readFile(file.path);
		const blob = await git.hashObject(file);
		const result = await spawnAsync("git hash-object --stdin", {
			input: file.contents,
			encoding: "utf8",
		});
		expect(blob.toString()).to.equal(result.trim());
	});

	it("ls-files", async () => {
		const files = await git.lsFiles();
		const result = await spawnAsync("git ls-files", {
			encoding: "utf8",
		});
		expect(files.map(file => file.relative).sort()).to.deep.equals(result.toString().split(/\r?\n/g).filter(Boolean));
		files.forEach(file => {
			expect(file).to.haveOwnProperty("inIndex", true);
			expect(file).to.haveOwnProperty("blob");
		});
	});

	describe("catFile", () => {
		it("cat-file", async () => {
			let blob = await spawnAsync("git hash-object -- README.md", {
				encoding: "utf8",
			});
			blob = blob.trim();
			const file = new File({
				blob,
				cwd: git.gitWorkTree,
				relative: "README.md",
			});
			const contents = await git.catFile(file);

			expect(contents.equals(await fs.readFile(file.path))).to.be.true;
		});

		it("cat a directory", async () => {
			const fakeStat = {
				isDirectory: function () {
					return true;
				},
			};
			const stream = git.catFile();
			stream.end(new File({
				cwd: git.gitWorkTree,
				contents: null,
				stat: fakeStat,
				relative: "test",
			}));

			const files = await stream;

			expect(files).to.lengthOf(1);
			expect(files[0].isNull()).to.ok;
		});

		it("lsFile | catFile", async () => {
			const files = await git.lsFiles()
				.pipe(
					git.catFile()
				);

			files.forEach(file => {
				expect(file.isNull()).to.be.false;
			});
		});
	});

	it("status | catFile", async () => {
		const files = await git.status()
			.pipe(
				git.catFile()
			);

		await Promise.all(files.map(async (file) => {
			expect(file.isNull()).to.be.false;
			if (file.inWorkingTree) {
				const contents = await fs.readFile(file.path);
				expect(file.contents.toString()).to.equals(contents.toString());
			}
			if (file.inIndex) {
				expect(file).to.haveOwnProperty("blob");
				const contents = await spawnAsync("git cat-file blob " + file.blob, {
					encoding: "utf8",
				});
				expect(file.contents.toString()).to.equals(contents);
			}
		}));
	});
	describe("blame", () => {
		function isSignature (signature) {
			expect(signature.name).to.match(/^.+$/);
			expect(signature.email).to.match(/^[\w.]+@[\w.]+$/);
			expect(signature.time).to.greaterThan(1528300000);
			if (signature.email === "gucong@gmail.com") {
				expect(signature.offset).to.equal(480);
			}
			const inspect = util.inspect(signature, {
				customInspect: true,
				colors: false,
				depth: null,
			});
			expect(inspect).to.match(/\bname:/);
			expect(inspect).to.match(/\bemail:/);
			expect(inspect).to.match(/\btime:/);
			expect(inspect).to.match(/\boffset:/);
		}
		function isBlame (blame, fileNme, contents) {
			expect(blame.length).greaterThan(0);
			let finalStartLineNumber = 1;
			Array.from(blame).forEach((hunk, index) => {
				expect(hunk.origPath).to.match(fileNme);
				isSignature(hunk.origSignature);
				isSignature(hunk.finalSignature);
				expect(hunk.origCommitId.toString()).to.match(/^\w{40,}$/);
				if (hunk.finalCommitId) {
					expect(hunk.finalCommitId.toString()).to.match(/^\w{40,}$/);
				}
				expect(hunk.finalStartLineNumber).to.equal(finalStartLineNumber);
				finalStartLineNumber += hunk.linesInHunk;
				expect(hunk.linesInHunk).to.greaterThan(0);
				const inspect = util.inspect(hunk, {
					customInspect: true,
					colors: false,
					depth: null,
				});
				expect(inspect).to.match(/\borigPath:/);
				expect(inspect).to.match(/\borigSignature:/);
				expect(inspect).to.match(/\bfinalSignature:/);
				expect(inspect).to.match(/\borigCommitId:/);
				expect(inspect).to.match(/\bfinalCommitId:/);
				expect(inspect).to.match(/\borigStartLineNumber:/);
				expect(inspect).to.match(/\bfinalStartLineNumber:/);
				expect(inspect).to.match(/\blinesInHunk:/);
			});
			expect(finalStartLineNumber).to.equal(contents.toString().match(/^.*$/gm).length);
			for (let lineNumber = 1; lineNumber < finalStartLineNumber; lineNumber++) {
				const hunk = blame.getHunkByLine(lineNumber);
				expect(hunk).to.be.ok;
				expect(lineNumber >= hunk.finalStartLineNumber).to.be.ok;
				expect(lineNumber <= (hunk.finalStartLineNumber + hunk.linesInHunk)).to.be.ok;
			}
			expect(blame[blame.length]).to.not.ok;
		}

		it("blame test/stream.js", async () => {
			const file = new File({
				cwd: git.gitWorkTree,
				relative: "test/stream.js",
			});
			file.contents = await fs.readFile(file.path);

			const stream = git.blame();
			stream.end(file);
			const files = await stream;
			isBlame(files[0].blame, /^test\/.*\.js$/, file.contents);
		});

		it("blame README.md", async () => {
			const file = new File({
				cwd: git.gitWorkTree,
				relative: "README.md",
			});
			const blame = await git.blame(file);
			isBlame(blame, /.+\.md$/, await fs.readFile(file.path));
		});
	});
});
