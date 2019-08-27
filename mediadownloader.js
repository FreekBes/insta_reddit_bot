const fs = require('fs');
const videoHandler = require("./media_handlers/video.js");
const imageHandler = require("./media_handlers/image.js");

exports.downloadMedia = function(post) {
    return new Promise(function(resolve, reject) {
        let mediaUrl = post['data']['url'];

        if (mediaUrl.match(/http(s|):\/\/i.imgur.com\/.*.gifv$/) != null) {
            mediaUrl = mediaUrl.replace(".gifv", ".mp4");
            mediaUrl = mediaUrl.replace("https://", "http://");

            console.log("mediaUrl: ", mediaUrl);
            if (mediaUrl.match(/http(s|):\/\/i.imgur.com\/.*.gifv$/) != null) {
                console.log("GIFV on Imgur detected!");
                videoHandler.downloadSimpleVideo(post['data']['id'], mediaUrl, __dirname + "/temp/").then(function(videoLoc, thumbLoc) {
                    resolve({
                        type: 'video',
                        video: videoLoc,
                        thumbnail: thumbLoc
                    });
                }).catch(function(err) {
                    reject(err);
                });
            }
            else if (mediaUrl.match(/http(s|):\/\/v.redd.it\/.*$/) != null) {
                if (post['data']['media']['reddit_video'] != undefined && post['data']['media']['reddit_video'] != null) {
                    if (post['data']['media']['reddit_video']['fallback_url'] != undefined && post['data']['media']['reddit_video']['fallback_url'] != null) {
                        console.log("Video on Reddit detected!");
                        videoHandler.downloadRedditVideo(post['data']['id'], post['data']['media']['reddit_video'], __dirname + "/temp/").then(function(videoLoc, thumbLoc) {
                            resolve({
                                type: 'video',
                                video: videoLoc,
                                thumbnail: thumbLoc
                            });
                        }).catch(function(err) {
                            reject(err);
                        });
                    }
                    else {
                        reject("Could not retrieve v.redd.it link from post!");
                    }
                }
                else {
                    reject("Could not retrieve v.redd.it link from post!");
                }
            }
            else if (mediaUrl.match(/http(s|):\/\/gfycat.com\/.*$/) != null) {
                console.log("Video on gfycat detected");

                let asMp4 = false;
                if (post['data']['preview']['reddit_video_preview'] != undefined && post['data']['preview']['reddit_video_preview'] != null) {
                    if (post['data']['preview']['reddit_video_preview']['fallback_url'] != undefined && post['data']['preview']['reddit_video_preview']['fallback_url'] != null) {
                        asMp4 = true;
                        mediaUrl = post['data']['preview']['reddit_video_preview']['fallback_url'];
                    }
                }
                if (asMp4 == false) {
                    mediaUrl = mediaUrl.replace("//gfycat.com/", "//giant.gfycat.com/");
                    mediaUrl += ".mp4";
                }

                videoHandler.downloadSimpleVideo(post['data']['id'], mediaUrl, __dirname + "/temp/").then(function(videoLoc, thumbLoc) {
                    resolve({
                        type: 'video',
                        video: videoLoc,
                        thumbnail: thumbLoc
                    });
                }).catch(function(err) {
                    reject(err);
                });
            }
            else {
                console.log("Normal image detected");
                imageHandler.downloadImage(post['data']['id'], mediaUrl, post['data']['preview']['images'], __dirname + "/temp/").then(function(isVideo, imageLoc, thumbLoc) {
                    if (isVideo) {
                        resolve({
                            type: 'video',
                            video: imageLoc,
                            thumbnail: thumbLoc
                        });
                    }
                    else {
                        resolve({
                            type: 'image',
                            image: imageLoc
                        });
                    }
                }).catch(function(err) {
                    reject(err);
                });
            }
        }
    });
};