"use strict";
const gitStream = require("..");
const expect = require("chai").expect;
const fs = require("fs");
const File = require("../lib/file");
const spawn = require("child_process").spawn;

function execAsync (command, options = {}) {
	function encodeBuf (buf) {
		buf = Buffer.concat(buf);
		if (options.encoding && options.encoding !== "buffer") {
			buf = buf.toString(options.encoding);
		}
		return buf;
	}
	return new Promise((resolve, reject) => {
		const bash = spawn("bash", [
			"-c",
			command,
		]);
		const stdout = [];
		const stderr = [];
		bash.stdout.on("data", (buf) => {
			stdout.push(buf);
		});
		bash.stderr.on("data", (buf) => {
			stderr.push(buf);
		});
		bash.on("error", reject);
		bash.on("close", (code) => {
			// code === null when child_process is killed
			if (code) {
				reject(encodeBuf(stderr) || code);
			} else {
				resolve(encodeBuf(stdout));
			}
		});
		if (options.input) {
			bash.stdin.end(options.input);
		}
	});
}

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
		file.contents = fs.readFileSync(file.path);
		const blob = await git.hashObject(file);
		const result = await execAsync("git hash-object --stdin", {
			input: file.contents,
			encoding: "utf8",
		});
		expect(blob.toString()).to.equal(result.trim());
	});

	it("ls-files", async () => {
		const files = await git.lsFiles();
		const result = await execAsync("git ls-files", {
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
			let blob = await execAsync("git hash-object -- README.md", {
				encoding: "utf8",
			});
			blob = blob.trim();
			const file = new File({
				blob,
				cwd: git.gitWorkTree,
				relative: "README.md",
			});
			const contents = await git.catFile(file);

			expect(contents.equals(fs.readFileSync(file.path))).to.be.true;
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

	describe("updateIndex", () => {
		it("add a new file", async () => {
			const stream = git.updateIndex();
			stream.end(new File({
				cwd: git.gitWorkTree,
				contents: Buffer.from("staged"),
				relative: "test/fixtures/staged.txt",
			}));
			await stream;
			const status = await execAsync("git status --porcelain=v2", {
				encoding: "utf8",
			});
			expect(status).to.match(/\s+test\/fixtures\/staged.txt$/m);
		});

		it("update a file", async () => {
			const stream = git.updateIndex();
			stream.end(new File({
				cwd: git.gitWorkTree,
				contents: Buffer.from("updated"),
				relative: "test/fixtures/in-head.txt",
			}));
			await stream;

			const status = await execAsync("git status --porcelain=v2", {
				encoding: "utf8",
			});
			expect(status).to.match(/^1 MM N... \d+ \d+ \d+ \w+ \w+\s+test\/fixtures\/in-head.txt$/m);
		});

		it("remove a file", async () => {
			const stream = git.updateIndex();
			stream.end(new File({
				cwd: git.gitWorkTree,
				contents: null,
				relative: "test/fixtures/staged.txt",
			}));

			await stream;
			const status = await execAsync("git status --porcelain=v2", {
				encoding: "utf8",
			});
			expect(status).not.match(/\s+test\/fixtures\/staged.txt$/m);
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
				expect(file.contents.toString()).to.equals(fs.readFileSync(file.path).toString());
			}
			if (file.inIndex) {
				expect(file).to.haveOwnProperty("blob");
				const contents = await execAsync("git cat-file blob " + file.blob, {
					encoding: "utf8",
				});
				expect(file.contents.toString()).to.equals(contents);
			}
		}));
	});
});

// process.on("unhandledRejection", (reason, p) => {
// 	console.error(reason);
// 	process.exitCode = 1;
// });
