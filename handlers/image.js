const path = require('path');
const https = require('https');
const imageType = require('image-type');
const videoHandler = require("./video.js");
const Jimp = require('jimp');

exports.downloadImage = function(postId, permalink, url, tempFolder) {
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
					videoHandler.downloadVideoYTDL(postId, permalink, tempFolder).then(function(res) {
						resolve(res);
					}).catch(function(err) {
						reject(err);
					});
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
										type: "image",
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
