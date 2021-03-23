const path = require('path');
const fs = require('fs');
const igPrivateApi = require('instagram-private-api');
const igClient = new igPrivateApi.IgApiClient();
const temp = require("./temp.js");
const mediaDownloader = require("./mediadownloader.js");

function getCookiesPath() {
	return path.join(__dirname, "cookies.json");
}

function cookiesExist() {
	return fs.existsSync(getCookiesPath());
}

let doCommentCredits = false;
exports.commentCredits = function(redditHandler, instagramPostId, originalUploader, redditPostId) {
	return new Promise(function(resolve, reject) {
		igClient.media.comment({
			mediaId: instagramPostId,
			text: "Mirrored from a post on " + redditHandler.getSubreddit() + " by /u/" + originalUploader + ": https://redd.it/" + redditPostId
		}).then(function(commentResponse) {
			resolve(commentResponse);
		}).catch(function(err) {
			reject(err);
		});
	});
};

exports.init = function(igSettings) {
	igClient.state.generateDevice(igSettings.userName + "_" + igSettings.seed);

	igClient.request.end$.subscribe(async function() {
		const serialized = await igClient.state.serializeCookieJar();
		delete serialized.version;
		fs.writeFileSync(getCookiesPath(), JSON.stringify(serialized));
	});

	if (!igSettings.credits_in_caption) {
		doCommentCredits = true;
	}
};

exports.signIn = function(username, password, fromSession) {
	return new Promise(function(resolve, reject) {
		if (fromSession !== true && cookiesExist()) {
			igClient.state.deserializeCookieJar(fs.readFileSync(getCookiesPath(), "utf8")).then(function() {
				exports.signIn(username, password, true).then(function(loggedInUser) {
					resolve(loggedInUser);
				}).catch(function(err) {
					reject(err);
				});
			});
		}
		else {
			// execute all requests prior to authorization in the real Android application
			igClient.simulate.preLoginFlow().then(function() {
				igClient.account.login(username, password).then(function(loggedInUser) {
					// execute all requests after authorization in the real Android application
					// we're doing this on a next tick, as per the example given in instagram-private-api's tutorial...
					process.nextTick(async function() {
						await igClient.simulate.postLoginFlow();
					});
					resolve(loggedInUser);
				})
				.catch(function(err) {
					reject(err);
				});
			})
			.catch(function(err) {
				reject(err);
			});
		}
	});
};

function handleMedia(redditHandler, post, media, tempExtraCaption) {
	return new Promise(function(resolve, reject) {
		console.log("Media downloaded!");
		console.log(media);
		if (media['type'] == 'image') {
			console.log("Uploading image to Instagram...");
			igClient.publish.photo({
				file: fs.readFileSync(media['image']),
				caption: post['data']['title'] + (doCommentCredits ? "" : tempExtraCaption)
			}).then(function(publishResult) {
				console.log("Image uploaded!");
				if (doCommentCredits) {
					exports.commentCredits(redditHandler, publishResult.media.id, post['data']['author'], post['data']['id'])
						.then(function(commentResponse) {
							console.log("Credits commented");
						})
						.catch(function(err) {
							console.warn("Could not comment credits!");
							console.error(err);
						})
						.finally(function() {
							resolve(publishResult);
						})
				}
				else {
					resolve(publishResult);
				}
			}).catch(function(err) {
				reject(err);
			});
		}
		else if (media['type'] == 'video') {
			console.log("Uploading video to Instagram...");
			igClient.publish.video({
				video: fs.readFileSync(media['video']),
				coverImage: fs.readFileSync(media['thumbnail']),
				caption: post['data']['title'] + (doCommentCredits ? "" : tempExtraCaption)
			}).then(function(publishResult) {
				console.log("Video uploaded!");
				if (doCommentCredits) {
					exports.commentCredits(redditHandler, publishResult.media.id, post['data']['author'], post['data']['id'])
						.then(function(commentResponse) {
							console.log("Credits commented");
						})
						.catch(function(err) {
							console.warn("Could not comment credits!");
							console.error(err);
						})
						.finally(function() {
							resolve(publishResult);
						})
				}
				else {
					resolve(publishResult);
				}
			}).catch(function(err) {
				reject(err);
			});
		}
		else {
			reject("Unknown media type!");
		}
	});
}

exports.handleRedditPost = function(redditHandler, post, debugMode) {
	return new Promise(function(resolve, reject) {
		console.log("Found a post to handle:");
		console.log('http://www.reddit.com/' + post['data']['permalink']);

		// fix broken imgur links
		if (post['data']['url'].match(/http(s|):\/\/*imgur\.com\/.......$/) != null) {
			post['data']['url'] = "https://i." + post['data']['url'].split("//")[1] + ".jpg";
		}

		// fix more broken links
		post['data']['url'] = post['data']['url'].replace("&amp;", "&");

		// mark post as handled (done)
		redditHandler.getPostStatus().markPostAsDone(post['data']['id']);

		// check if post is not a selftext
		if ((post['data']['selftext'] == "" || post['data']['selftext'] == null) && post['data']['url'].indexOf(post['data']['id']) == -1) {
			console.log("Downloading media...");
			let tempExtraCaption = "\u2063\n\u2063\nMirrored from a post on " + redditHandler.getSubreddit() + " by /u/" + post['data']['author'] + ": https://redd.it/" + post['data']['id'];
			mediaDownloader.downloadMedia(redditHandler, post).then(function(media) {
				if (!debugMode) {
					handleMedia(redditHandler, post, media, tempExtraCaption)
						.then(function(igPublishResult) {
							resolve(igPublishResult);
						})
						.catch(function(err) {
							reject(err);
						})
						.finally(function() {
							temp.clear();
						});
				}
				else {
					console.log("Debug mode is active, so the post does not get uploaded to Instagram right now, nor does the temp folder get cleared.");
					resolve(null);
				}
			}).catch(function(err) {
				temp.clear();
				reject(err);
			});
		}
		else {
			reject("Selftext posts are not supported yet.");
		}
	});
};