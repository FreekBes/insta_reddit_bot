const fs = require('fs');
const https = require('https');
const { exec, execSync } = require('child_process');

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

exports.downloadSimpleVideo = function(postId, url, tempFolder) {
	return new Promise(function(resolve, reject) {
		console.log("Downloading simple video...");
		console.log("URL: ", url);
		let downloadLoc = tempFolder + postId + "-temp.mp4";
		let mp4File = fs.createWriteStream(downloadLoc);
		let req = https.get(url, function(res) {
			res.pipe(mp4File);

			res.on('end', function() {
				console.log("Download complete! Resizing MP4...");
				let convertLoc = tempFolder + postId + ".mp4";
				let thumbLoc = tempFolder + postId + "-thumb.jpg";

				let command = 'ffmpeg -analyzeduration 20M -probesize 20M -y -re -f lavfi -i "movie=filename=' + downloadLoc + ':loop=5, setpts=N/(FRAME_RATE*TB)" -vcodec libx264 -b:v 3500k -vsync 2 -t 59 -acodec aac -b:a 128k -pix_fmt yuv420p -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white" '+ convertLoc
				console.log(command);
				exec(command, function(err, stdout, stderr) {
					if (err) {
						reject(err);
					}

					console.log(`stdout: ${stdout}`);
					console.log(`stderr: ${stderr}`);
					
					console.log("Resized MP4 with success!");
					createVideoThumb(convertLoc, thumbLoc).then(function() {
						resolve({
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
	});
};

exports.downloadRedditVideo = function(postId, redditVideo, tempFolder) {
	return new Promise(function(resolve, reject) {
		console.log("Downloading Reddit video...");
		let url = redditVideo['fallback_url'];
		console.log("URL: ", url);

		let hasAudio = false;
		let audioUrl = null;
		let audioOutput = null;
		if (redditVideo['hls_url'] != undefined && redditVideo['hls_url'] != null) {
			hasAudio = true;
			audioOutput = tempFolder + postId + "-temp.ts";
			audioUrl = redditVideo['hls_url'];
			console.log("Audio URL: ", audioUrl);

			console.log("Converting m3u8 file to audio...");
			let command = "ffmpeg -y -i \"" + audioUrl + "\" -acodec copy -map a? " + audioOutput;
			console.log(command);
			execSync(command, function(err, stdout, stderr) {
				if (err) {
					console.warn("Could not convert m3u8 to audio file! Continuing without audio.");
					console.error(err);
					hasAudio = false;
					audioUrl = null;
					audioOutput = null;
				}
				else {
					console.log(`stdout: ${stdout}`);
					console.log(`stderr: ${stderr}`);
					console.log("Converted m3u8 to audio file with success!");
				}
			});
		}
		else {
			console.log("No audio URL found. Continuing without audio.");
		}

		let downloadLoc = tempFolder + postId + "-temp.mp4";
		let mp4File = fs.createWriteStream(downloadLoc);
		let req = https.get(url, function(res) {
			res.pipe(mp4File);

			res.on('end', function() {
				let convertLoc = tempFolder + postId + ".mp4";
				let thumbLoc = tempFolder + postId + "-thumb.jpg";

				let command = null;
				if (hasAudio) {
					console.log("Download complete! Merging audio with video and resizing the resulting MP4...");
					command = "ffmpeg -loglevel verbose -analyzeduration 20M -probesize 20M -y -re -i " + downloadLoc + " -i " + audioOutput + " -vcodec libx264 -b:v 3500k -vsync 2 -t 59 -acodec aac -b:a 128k -pix_fmt yuv420p -vf 'scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white' " + convertLoc;
				}
				else {
					console.log("Download complete! Resizing MP4...");
					command = "ffmpeg -loglevel verbose -analyzeduration 20M -probesize 20M -y -re -i " + downloadLoc + " -vcodec libx264 -b:v 3500k -vsync 2 -t 59 -acodec aac -b:a 128k -pix_fmt yuv420p -vf 'scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white' " + convertLoc;
				}
				
				console.log(command);
				exec(command, function(err, stdout, stderr) {
					if (err) {
						reject(err);
					}

					console.log(`stdout: ${stdout}`);
					console.log(`stderr: ${stderr}`);

					console.log("Resized MP4 with success!")
					createVideoThumb(convertLoc, thumbLoc).then(function() {
						resolve({
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
	});
};