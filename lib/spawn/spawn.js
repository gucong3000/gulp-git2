"use strict";
const through = require("through2");
const cp = require("child_process");
const StringDecoder = require("string_decoder").StringDecoder;

function splitStream (options, decoder) {
	const matcher = options.matcher;
	const mapper = options.mapper;
	let lastStr = "";

	function transform (data) {
		data = decoder.write(data);
		if (lastStr) {
			data = lastStr + data;
		}

		let match;
		let lastMatch;
		matcher.lastIndex = 0;

		while ((match = matcher.exec(data))) {
			if (options.debug) {
				console.info(match[0].replace(/\n+$/, ""));
			}
			let matched = Array.prototype.slice.call(match, 1);
			if (mapper) {
				matched = mapper.apply(this, matched);
			}
			if (matched) {
				this.push(matched);
			}

			lastMatch = match;
		}
		if (lastMatch) {
			lastStr = data.slice(lastMatch.index + lastMatch[0].length);
		} else {
			lastStr = data;
		}
	}

	return transform;
}

function readStreamIfy (createProcess, options) {
	let err = "";
	let encoding = options.encoding;
	if (encoding) {
		if (options.encoding === "buffer") {
			encoding = null;
		}
	} else {
		encoding = "utf-8";
	}
	const matcher = options.matcher;
	const decoder = (matcher || encoding) && new StringDecoder(encoding);
	const stream = decoder ? through.obj() : through();

	// this was needed after switching to through2
	stream.pause();

	Promise.resolve(options.before && options.before(stream)).then(createProcess).then(process => {
		if (matcher) {
			process.stdout.on("data", splitStream(options, decoder).bind(stream));
		} else if (decoder) {
			process.stdout.on("data", data => {
				data = decoder.write(data, decoder.encoding);
				if (options.debug) {
					console.info(data);
				}
				stream.push(data);
			});
		} else {
			process.stdout.on("data", data => {
				stream.push(data);
			});
		}

		process.stderr.on("data", (buf) => {
			err += buf;
		});

		process.on("close", (code) => {
			// code === null when child_process is killed
			if (code) {
				stream.emit(
					"error",
					new Error((options.cwd || process.cwd()) + "$ " + process.spawnargs.join(" ") + "\n" + err)
				);
			} else {
				stream.end();
			}
		});

		process.on("error", (err) => {
			stream.emit("error", err);
		});

		const destroy = stream.destroy;
		stream.destroy = function () {
			if (!process.killed) {
				process.kill();
			}
			if (destroy) {
				destroy.apply(this, arguments);
			}
		};
		stream.resume();
	});

	return stream;
}

function gitSpawn (options = {}) {
	let args = ["--no-pager"];
	if (options.config) {
		Object.keys(options.config).forEach((key) => {
			args.push(
				"-c",
				key + "=" + String(options.config[key])
			);
		});
	}

	if (options.gitWorkTree) {
		args.push("--work-tree=" + options.gitWorkTree);
		if (!options.cwd) {
			options.cwd = options.gitWorkTree;
		}
	}

	if (options.gitDir) {
		args.push("--git-dir=" + options.gitDir);
	}

	options.args = options.args.filter(Boolean);
	args = args.concat(options.args);

	function createProcess () {
		const ps = cp.spawn("git", args, options);
		if (options.debug) {
			console.info((options.cwd || process.cwd()) + "$ git " + args.join(" "));
		}

		if (options.input) {
			if (typeof options.input.pipe === "function") {
				options.input.pipe(ps.stdin);
			} else {
				ps.stdin.end(options.input);
			}
		}
		return ps;
	}

	return readStreamIfy(createProcess, options);
}

module.exports = gitSpawn;
