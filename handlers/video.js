const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { lookpath } = require('lookpath');

function createVideoThumb(fromVid, thumbLoc) {
	return new Promise(function(resolve, reject) {
		console.log("Generating thumbnail for video...");
		let thumbCommand = 'ffmpeg -y -ss 00:00:00 -i ' + fromVid + ' -vframes 1 ' + thumbLoc;
		console.log(thumbCommand);
		exec(thumbCommand, function(err, stdout, stderr) {
			if (err) {
				reject(err);
			}

			console.log(`stdout: ${stdout}`);
			console.log(`stderr: ${stderr}`);

			console.log("Thumbnail generated!");
			resolve();
		});
	});
}

function ffmpegInstalled() {
	return new Promise(function(resolve, reject) {
		lookpath("ffmpeg").then(function(path) {
			if (path) {
				resolve(true);
			}
			resolve(false);
		}).catch(function(err) {
			reject(err);
		});
	});
}

function ytdlInstalled() {
	return new Promise(function(resolve, reject) {
		lookpath("youtube-dl").then(function(path) {
			if (path) {
				resolve(true);
			}
			resolve(false);
		}).catch(function(err) {
			reject(err);
		});
	});
}

exports.downloadVideoYTDL = function(postId, permalink, tempFolder) {
	return new Promise(function(resolve, reject) {
		ffmpegInstalled()
			.then(function(installed) {
				if (installed) {
					ytdlInstalled()
						.then(function(installed2) {
							if (!installed2) {
								reject("youtube-dl was not found on your system, which is required for downloading videos from Reddit. Please install it from http://ytdl-org.github.io/youtube-dl/download.html (or pip) to enable support for video posts.");
								return;
							}
							let url = "https://www.reddit.com" + permalink;
							console.log("YT-DL URL: ", url);
				
							let downloadLoc = path.join(tempFolder, postId + "-temp.mp4");
							let command = "youtube-dl -o " + downloadLoc + " " + url
							console.log(command);
							exec(command, function(err, stdout, stderr) {
								if (err) {
									reject(err);
									return;
								}
		
								console.log(`stdout: ${stdout}`);
								console.log(`stderr: ${stderr}`);
		
								let convertLoc = path.join(tempFolder, postId + ".mp4");
								let thumbLoc = path.join(tempFolder, postId + "-thumb.jpg");
								console.log("Download complete! Resizing MP4...");
								command = "ffmpeg -loglevel verbose -analyzeduration 20M -probesize 20M -y -re -i " + downloadLoc + " -vcodec libx264 -b:v 3500k -vsync 2 -t 59 -acodec aac -b:a 128k -pix_fmt yuv420p -vf \"scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white\" " + convertLoc;
								
								console.log(command);
								exec(command, function(errFfmpeg, stdoutFfmpeg, stderrFfmpeg) {
									if (errFfmpeg) {
										reject(errFfmpeg);
										return;
									}
		
									console.log(`stdout: ${stdoutFfmpeg}`);
									console.log(`stderr: ${stderrFfmpeg}`);
		
									console.log("Resized MP4 with success!")
									createVideoThumb(convertLoc, thumbLoc).then(function() {
										resolve({
											type: "video", 
											video: convertLoc,
											thumbnail: thumbLoc
										});
									})
									.catch(function(err) {
										reject(err);
									});
								});
							});
						});
				}
				else {
					reject("FFMPEG was not found on your system, which is required for resizing videos. Please install it from https://ffmpeg.org/download.html to enable support for video posts.");
				}
			});
	});
};
