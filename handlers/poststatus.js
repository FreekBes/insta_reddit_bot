const fs = require('fs');
const path = require('path');
const postsFile = path.join(__dirname, "..", "posts.json");
let postsDone = [];

exports.init = function() {
	if (!fs.existsSync(postsFile)) {
		console.warn("posts.json missing! Creating...");
		module.exports.clearDoneList();
	}
	else {
		module.exports.reloadDoneList();
	}
	console.log("PostsStatus initialized");
};

exports.reloadDoneList = function() {
	postsDone = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
};

exports.markPostAsDone = function(postId) {
	postsDone.push(postId);
	fs.writeFileSync(postsFile, JSON.stringify(postsDone), 'utf8');
	console.log("Post added to done-list");
	module.exports.reloadDoneList();
};

exports.unmarkPostAsDone = function(postId) {
	let index = postsDone.indexOf(postId);
	if (index > -1) {
		postsDone.slice(index, 1);
	}
	fs.writeFileSync(postsFile, JSON.stringify(postsDone), 'utf8');
	console.log("Post removed from done-list");
	module.exports.reloadDoneList();
};

exports.postNotDone = function(postId) {
	return postsDone.indexOf(postId) == -1;
};

exports.clearDoneList = function() {
	fs.writeFileSync(postsFile, "[]", 'utf8');
	console.log("posts.json cleared");
	module.exports.reloadDoneList();
};

module.exports.init();