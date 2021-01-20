const fs = require('fs');
const videoHandler = require("./media_handlers/video.js");
const imageHandler = require("./media_handlers/image.js");

exports.downloadMedia = function(redditor, post, handlePost) {
    return new Promise(function(resolve, reject) {
        console.log(post['data']);
        let mediaUrl = post['data']['url'];
        mediaUrl = mediaUrl.replace("https://", "http://");
        console.log("Initial mediaUrl: ", mediaUrl);

        if (mediaUrl.match(/http(s|):\/\/www.reddit.com\/r\/.*$/) != null) {
            console.log("Crosspost detected! Fetching post...");
            redditor.getPostFromPermalink(mediaUrl).then(handlePost).catch(function(err) {
                console.log("An error occurred: could not handle crosspost");
                console.error(err);
            });
        }
        if (mediaUrl.match(/http(s|):\/\/i.imgur.com\/.*.gifv$/) != null) {
            console.log("GIFV on Imgur detected!");
            mediaUrl = mediaUrl.replace(".gifv", ".mp4");
            videoHandler.downloadSimpleVideo(post['data']['id'], mediaUrl, __dirname + "/temp/").then(function(res) {
                resolve({
                    type: 'video',
                    video: res['video'],
                    thumbnail: res['thumbnail']
                });
            }).catch(function(err) {
                reject(err);
            });
        }
        else if (mediaUrl.match(/http(s|):\/\/v.redd.it\/.*$/) != null) {
            if (post['data']['media']['reddit_video'] != undefined && post['data']['media']['reddit_video'] != null) {
                if (post['data']['media']['reddit_video']['fallback_url'] != undefined && post['data']['media']['reddit_video']['fallback_url'] != null) {
                    console.log("Video on Reddit detected!");
                    videoHandler.downloadRedditVideo(post['data']['id'], post['data']['media']['reddit_video'], __dirname + "/temp/").then(function(res) {
                        resolve({
                            type: 'video',
                            video: res['video'],
                            thumbnail: res['thumbnail']
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

            videoHandler.downloadSimpleVideo(post['data']['id'], mediaUrl, __dirname + "/temp/").then(function(res) {
                resolve({
                    type: 'video',
                    video: res['video'],
                    thumbnail: res['thumbnail']
                });
            }).catch(function(err) {
                reject(err);
            });
        }
        else {
            console.log("Normal image detected");
            imageHandler.downloadImage(post['data']['id'], mediaUrl, post['data']['preview']['images'], __dirname + "/temp/").then(function(res) {
                if (res['isVideo']) {
                    resolve({
                        type: 'video',
                        video: res['video'],
                        thumbnail: res['thumbnail']
                    });
                }
                else {
                    resolve({
                        type: 'image',
                        image: res['image']
                    });
                }
            }).catch(function(err) {
                reject(err);
            });
        }
    });
};