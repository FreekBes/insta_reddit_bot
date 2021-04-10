const path = require('path');
const https = require('https');
const imageType = require('image-type');
const videoHandler = require("./video.js");
const Jimp = require('jimp');

exports.downloadImage = function(postId, url, previewImages, tempFolder) {
	return new Promise(function(resolve, reject) {
		let dataReceived = false;

		console.log("Retrieving image mime type...");
		console.log("URL: ", url);
		
		https.get(url, function(res) {
			res.on('close', function() {
				console.log("Connection closed.");
				if (!dataReceived) {
					reject("Connection closed abruptly");
				}
			})
			res.on('error', function(err) {
				reject(err);
			});
			res.once('data', function(chunk) {
				dataReceived = true;
				res.destroy();

				let imgType = imageType(chunk);
				if (!imgType) {
					reject("Could not detect mime type of image! Image URL: " + url);
					return;
				}
				if (imgType.mime == "image/gif") {
					console.log("GIF detected! Using videoHandler instead.");
					let asMp4 = false;
					if (url.match(/http(s|):\/\/i.redd.it\/.*.gif$/) != null) {
						let tempUrlOptions = previewImages[0]['variants']['mp4']['resolutions'];
						let tempUrl = null;
						let maxWidth = 0;
						let lastIndex = -1;
						for (t = 0; t < tempUrlOptions.length; t++) {
							if (parseInt(tempUrlOptions[t]['width']) > maxWidth) {
								maxWidth = parseInt(tempUrlOptions[t]['width']);
								lastIndex = t;
							}
						}
						if (maxWidth > 0 && lastIndex > -1) {
							tempUrl = tempUrlOptions[lastIndex]['url'];
						}
						if (tempUrl != undefined && url != null) {
							tempUrl = tempUrl.split("&amp;").join("&");
							url = tempUrl;
							console.log("New URL: " + url);
							asMp4 = true;
						}
						else {
							console.log("Could not change URL to preview MP4");
							asMp4 = false;
						}
					}

					if (asMp4) {
						videoHandler.downloadSimpleVideo(postId, url, tempFolder).then(function(videoLoc, thumbLoc) {
							resolve({
								isVideo: true, 
								video: videoLoc, 
								thumbnail: thumbLoc
							});
						}).catch(function(err) {
							reject(err);
						});
					}
					else {
						reject("GIFs without an MP4 version are not supported at the moment");
					}
				}
				else {
					console.log("No GIF detected ("+imgType.mime+"). Using imageHandler.");
					Jimp.read(url, function(err, imag) {
						if (err) {
							reject(err)
						}
						else if (imag == null) {
							reject("Could not grab image from url: " + url);
						}
						else {
							console.log("Download complete. Resizing image...");
							let newFileSrc = path.join(tempFolder, postId + ".jpg");
							try {
								imag.background(0xFFFFFFFF).contain(1000, 1000).quality(90).write(newFileSrc, function() {
									console.log("Resized image with success. Saved to " + newFileSrc);
									resolve({
										isVideo: false, 
										image: newFileSrc
									});
								});
							}
							catch(err) {
								reject(err);
							}
						}
					});
				}
			});
		});
	});
}