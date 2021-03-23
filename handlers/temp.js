const fs = require('fs');
const path = require('path');

exports.getTempDir = function() {
	return path.join(__dirname, "..", "temp");
}

exports.checkCreateTemp = function() {
	if (!fs.existsSync(this.getTempDir())) {
		console.warn("Temporary folder does not exist! Creating...");
		fs.mkdirSync(this.getTempDir());
		console.log("Temporary folder created.");
	}
}

exports.clear = function() {
	console.log("Clearing temp folder...");
	fs.readdir(exports.getTempDir(), function(err, files) {
		if (err) {
			console.warn("Could not retrieve list of files in temp folder!");
			return;
		}
		for (const f of files) {
			fs.unlink(path.join(exports.getTempDir(), f), function(err) {
				if (err) {
					console.warn("Could not remove temp file " + f + ": " + err);
				}
			});
		}
	});
}