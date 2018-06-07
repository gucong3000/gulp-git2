"use strict";
const isBinaryPath = require("is-binary-path");
const readStream = require("../read-stream");
const File = require("../file");
const Base = require("../base");
const path = require("path");
const fs = require("fs");

const {
	Repository,
	IndexEntry,
	Reference,
	Blame,
	Diff,
	Merge,
	Oid,
} = require("nodegit");

class Git extends Base {
	async repository () {
		const repository = await Repository.open(path.resolve(this.gitWorkTree, this.gitDir));
		repository.setWorkdir(this.gitWorkTree, 0);
		this.repository = () => repository;
		return repository;
	}
	async index () {
		const repository = await this.repository();
		const index = await repository.index();
		this.index = () => index;
		return index;
	}
	async status () {
		const repository = await this.repository();
		const arrayStatusFile = await repository.getStatus();
		let patchHeadToIndex;
		const diffHeadToIndex = () => {
			if (!patchHeadToIndex) {
				patchHeadToIndex = this.diffWithIndex("HEAD", false).then(patches);
			}
			return patchHeadToIndex;
		};

		function patches (arrayConvenientHunk) {
			const rst = {};
			arrayConvenientHunk.forEach(convenientPatch => {
				const newFile = convenientPatch.newFile();
				const path = newFile.path();
				if (convenientPatch.isDeleted()) {
					rst[path] = {};
					return;
				}
				rst[path] = {
					newFile,
					oldFile: convenientPatch.isAdded() ? null : convenientPatch.oldFile(),
				};
			});
			return rst;
		}

		const rst = [];

		await Promise.all(
			arrayStatusFile.map(async file => {
				const path = file.path();
				if (file.isIgnored()) {
					return;
				}
				let oldFile;
				let indexFile;
				let workFile;
				if (file.inIndex()) {
					const patch = (await diffHeadToIndex())[path];

					oldFile = patch.oldFile;
					if (oldFile) {
						oldFile = new File({
							cwd: this.gitWorkTree,
							mode: oldFile.mode(),
							blob: oldFile.id(),
							relative: oldFile.path(),
							inWorkingTree: false,
							inIndex: false,
						});
						rst.push(oldFile);
					}
					indexFile = patch.newFile;

					if (indexFile) {
						indexFile = new File({
							cwd: this.gitWorkTree,
							mode: indexFile.mode(),
							blob: indexFile.id(),
							relative: indexFile.path(),
							inWorkingTree: !file.inWorkingTree(),
							inIndex: true,
							oldFile,
						});
						rst.push(indexFile);
					}
				}
				if (file.inWorkingTree()) {
					if (file.isDeleted()) {
						return;
					}

					if (!indexFile) {
						const index = await this.index();
						indexFile = index.getByPath(path);
						if (indexFile) {
							indexFile = new File({
								cwd: this.gitWorkTree,
								mode: indexFile.mode,
								blob: indexFile.id,
								relative: indexFile.path,
								inWorkingTree: false,
								inIndex: false,
								oldFile,
							});
							rst.push(indexFile);
						}
					}
					workFile = new File({
						cwd: this.gitWorkTree,
						relative: path,
						inWorkingTree: true,
						inIndex: false,
						oldFile: indexFile,
					});
					rst.push(workFile);
				}
			})
		);

		return rst;
	}
	async lsFiles () {
		const index = await this.index();
		return index.entries().map(indexEntry => {
			return new File({
				cwd: this.gitWorkTree,
				mode: indexEntry.mode,
				blob: indexEntry.id,
				// stage,
				inIndex: true,
				relative: indexEntry.path,
			});
		});
	}
	async _catFile (file, options = {}) {
		options = {
			skipBin: true,
			...options,
		};

		if (options.skipBin && isBinaryPath(file.path)) {
			return null;
		}
		const readFile = () => {
			return readStream(fs.createReadStream(file.history[0]), options);
		};
		if (file.inWorkingTree) {
			return readFile();
		} else {
			let blob = file.blob;

			const repository = await this.repository();
			try {
				blob = await repository.getBlob(blob);
			} catch (ex) {
				file.inWorkingTree = true;
				file.blob = Oid.fromString("0");
				return readFile();
			}
			if (options.skipBin && blob.isBinary()) {
				return null;
			}
			return blob.content();
		}
	}
	async diff2Files (diff, srcProps = {}, dstProps = {}) {
		diff = await diff;
		const patches = await diff.patches();
		const files = [];
		patches.forEach(convenientPatch => {
			if (convenientPatch.isDeleted()) {
				return;
			}
			const newFile = convenientPatch.newFile();

			const dstFile = new File({
				cwd: this.gitWorkTree,
				mode: newFile.mode(),
				blob: newFile.id(),
				relative: newFile.path(),
				...dstProps,
			});

			if (!convenientPatch.isAdded()) {
				const oldFile = convenientPatch.oldFile();
				const srcFile = new File({
					cwd: this.gitWorkTree,
					mode: oldFile.mode(),
					blob: oldFile.id(),
					relative: oldFile.path(),
					dstFile,
					...srcProps,
				});
				dstFile.srcFile = srcFile;
				files.push(srcFile, dstFile);
				return;
			}

			files.push(dstFile);
		});
		return files;
	}
	async getTree (reference, mergeBase) {
		const repository = await this.repository();
		if (typeof reference === "string") {
			reference = await Reference.nameToId(repository, reference);
		}

		if (mergeBase) {
			reference = await this.mergeBase(reference, (await this.getHeadCommit()).id());
		}

		if (reference.constructor.name === "Oid") {
			reference = await repository.getCommit(reference);
		}

		return reference.getTree();
	}
	async diffWithIndex (commit = "refs/remotes/origin/master", mergeBase = true) {
		const repository = await this.repository();

		const diff = await Diff.treeToIndex(repository, await this.getTree(commit), await this.index());
		return diff.patches();
	}
	async mergeBase (...options) {
		return Merge.base(await this.repository(), ...options);
	}
	async getHeadCommit () {
		const repository = await this.repository();
		const commit = await repository.getHeadCommit();
		this.getHeadCommit = () => commit;
		return commit;
	}
	async blame (file, options = {}) {
		const relative = this.relative(file.history[0]);
		const repository = await this.repository();
		let blame = await Blame.file(repository, relative);
		if (file.isBuffer()) {
			const contents = file.contents;
			blame = await blame.buffer(contents.toString(), contents.length);
		}
		return new Proxy(blame, {
			get: (target, property) => {
				if (!/^\d+$/.test(property)) {
					return;
				}
				const blameHunk = blame.getHunkByLine(Number.parseInt(property));
				return Object.assign(
					blameHunk,
					{
						finalCommit: async () => (
							repository.getCommit(await blameHunk.finalCommitId())
						),
						origCommit: async () => (
							repository.getCommit(await blameHunk.origCommitId())
						),
					}
				);
			},
		});
	}
	async _hashObject (file, options = {}) {
		const isNull = file.isNull();
		let blob;
		if (isNull) {
			blob = file.blob && file.blob.iszero() ? file.blob : Oid.fromString("0");
		} else if (file.blob && file.rawContents && file.contents.equals(file.rawContents)) {
			blob = file.blob;
		} else {
			const repository = await this.repository();
			blob = await repository.createBlobFromBuffer(file.contents);
		}
		if (options.write) {
			const index = await this.index();
			const relative = this.relative(file.history[0]);
			if (isNull) {
				index.removeByPath(relative);
			} else {
				const oldIndexEntry = index.getByPath(relative);
				const indexEntry = oldIndexEntry || new IndexEntry();
				indexEntry.fileSize = file.contents.length;
				indexEntry.path = this.relative(file.path);
				indexEntry.id = blob;
				indexEntry.mode = file.mode || (oldIndexEntry ? oldIndexEntry.mode : 0o100644);
				file.blob = blob;
				if (oldIndexEntry) {
					index.remove(relative);
				}
				index.add(indexEntry);
			}
		}
		return blob;
	}
	async _updateIndex () {
		const index = await this.index();
		await index.write();
	}
}

module.exports = Git;
