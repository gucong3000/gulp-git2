"use strict";
const getHunkByLine = require("../getHunkByLine");
const SignatureWrap = require("./SignatureWrap");
const util = require("util");

class BlameHunkWrap {
	constructor (blameHunk, repository) {
		this.blameHunk = blameHunk;
		this.repository = repository;
	}
	get origPath () {
		if (!this._origPath) {
			this._origPath = this.blameHunk.origPath();
		}
		return this._origPath;
	}
	get origSignature () {
		if (!this._origSignature) {
			this._origSignature = new SignatureWrap(this.blameHunk.origSignature());
		}
		return this._origSignature;
	}
	get finalSignature () {
		if (!this._finalSignature) {
			this._finalSignature = new SignatureWrap(this.blameHunk.origSignature());
		}
		return this._finalSignature;
	}
	get origCommitId () {
		if (!this._origCommitId) {
			this._origCommitId = this.blameHunk.origCommitId();
		}
		return this._origCommitId;
	}
	get finalCommitId () {
		if (!this._finalCommitId) {
			this._finalCommitId = this.blameHunk.finalCommitId();
		}
		return this._finalCommit;
	}
	get origStartLineNumber () {
		if (!this._origStartLineNumber) {
			this._origStartLineNumber = this.blameHunk.origStartLineNumber();
		}
		return this._origStartLineNumber;
	}
	get finalStartLineNumber () {
		if (!this._finalStartLineNumber) {
			this._finalStartLineNumber = this.blameHunk.finalStartLineNumber();
		}
		return this._finalStartLineNumber;
	}
	get linesInHunk () {
		if (!this._linesInHunk) {
			this._linesInHunk = this.blameHunk.linesInHunk();
		}
		return this._linesInHunk;
	}
	[util.inspect.custom] () {
		return {
			origPath: this.origPath,
			origSignature: this.origSignature,
			finalSignature: this.finalSignature,
			origCommitId: this.origCommitId,
			finalCommitId: this.finalCommitId,
			origStartLineNumber: this.origStartLineNumber,
			finalStartLineNumber: this.finalStartLineNumber,
			linesInHunk: this.linesInHunk,
		};
	}
}

class BlameWrap {
	constructor (blame, repository) {
		this.blame = blame;
		this.hunk = [];
		this.length = blame.getHunkCount();
		this.repository = repository;
	}
	getHunkByIndex (index) {
		if (index >= this.length) {
			return;
		}
		if (!this.hunk[index]) {
			this.hunk[index] = new BlameHunkWrap(this.blame.getHunkByIndex(index), this.repository);
		}
		return this.hunk[index];
	}
	get getHunkByLine () {
		if (!this._getHunkByLine) {
			this._getHunkByLine = getHunkByLine(this.getHunkByIndex.bind(this));
		}
		return this._getHunkByLine;
	}
}
module.exports = BlameWrap;
