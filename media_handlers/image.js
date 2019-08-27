const fs = require('fs');
const http = require('http');
const imageType = require('image-type');
const videoHandler = require("./video.js");
const Jimp = require('jimp');

exports.downloadImage = function(postId, url, previewImages, tempFolder) {
    return new Promise(function(resolve, reject) {
        console.log("Retrieving image mime type...");
        url = url.replace("https://", "http://");
        console.log("URL: ", url);
        
        http.get(url, function(res) {
            res.once('data', function(chunk) {
                res.destroy();

                let imgType = imageType(chunk);
                if (imgType == "image/gif") {
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
                            url = url.replace("https://", "http://");
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
                            resolve(true, videoLoc, thumbLoc);
                        }).catch(function(err) {
                            reject(err);
                        });
                    }
                    else {
                        reject("GIFs without an MP4 version are not supported at the moment");
                    }
                }
                else {
                    Jimp.read(url, function(err, imag) {
                        if (err) {
                            reject(err)
                        }
                        else if (imag == null) {
                            reject("Could not grab image from url: " + url);
                        }
                        else {
                            console.log("Download complete. Resizing image...");
                            let newFileSrc = tempFolder + postId + ".jpg";
                            try {
                                imag.background(0xFFFFFFFF).contain(1000, 1000).quality(90).write(newFileSrc, function() {
                                    console.log("Resized image with success.");
                                    resolve(false, newFileSrc);
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