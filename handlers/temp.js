const fs = require('fs');
const path = require('path');

exports.getTempDir = function() {
	return path.join(__dirname, "..", "temp");
}

exports.checkCreateTemp = function() {
	if (!fs.existsSync(module.exports.getTempDir())) {
		console.warn("Temporary folder does not exist! Creating...");
		fs.mkdirSync(module.exports.getTempDir());
		console.log("Temporary folder created.");
	}
}

exports.clear = function() {
	console.log("Clearing temp folder...");
	fs.readdir(module.exports.getTempDir(), function(err, files) {
		if (err) {
			console.warn("Could not retrieve list of files in temp folder!");
			return;
		}
		for (const f of files) {
			fs.unlink(path.join(module.exports.getTempDir(), f), function(err) {
				if (err) {
					console.warn("Could not remove temp file " + f + ": " + err);
				}
			});
		}
	});
}

module.exports.checkCreateTemp();