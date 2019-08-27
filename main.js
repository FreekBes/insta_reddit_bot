// load basic packages
const process = require('process');
const fs = require('fs');
const { exec } = require('child_process');

// create temporary folder if it does not exist
if (!fs.existsSync(__dirname + "/temp")) {
    console.warn("Temporary folder does not exist! Creating...");
    fs.mkdirSync(__dirname + "/temp");
    console.log("Temporary folder created.");
}

function clearTemp() {
    exec("rm -rf " + __dirname + "/temp/*", function(err, stdout, stderr) {
        if (err) {
            console.warn("Failed to clear temp folder!");
        }
        else {
            console.log("Cleared temp folder");
        }
    });
}

// load custom packages
const redditor = require("./redditor.js");
const mediaDownloader = require('./mediadownloader.js');

// retrieve details needed for logging in to Instagram
const loginDetails = require('./logindetails.json');

// load the Instagram Private API Client
const igPrivateApi = require('instagram-private-api');
const igClient = new igPrivateApi.IgApiClient();

// load device
// if you get the IgSentryBlockError, replace _hahano with some random other string to circumvent it
igClient.state.generateDevice(loginDetails.userName + "_hahano");

// execute all requests prior to authorization in the real Android application
igClient.simulate.preLoginFlow().then(function() {
    console.log("Loggin in to " + loginDetails.username + "...");
    igClient.account.login(loginDetails.username, loginDetails.password).then(function(loggedInUser) {
        process.nextTick(async function() {
            await igClient.simulate.postLoginFlow();
        });
        console.log("Login successful!");

        try {
            // set subreddit
            redditor.setSubreddit(loginDetails.subreddit);
            
            // retrieve a post that is still on the to-do list
            redditor.getPostToDo().then(function(post) {
                console.log("Found a post to handle");

                // fix broken imgur links
                if (post['data']['url'].match(/http(s|):\/\/*imgur\.com\/.......$/) != null) {
                    post['data']['url'] = "https://i." + post['data']['url'].split("//")[1] + ".jpg";
                }
                
                // fix more broken links
                post['data']['url'] = post['data']['url'].replace("&amp;", "&");

                // check if post is not a selftext
                if (post['data']['selftext'] == "" || post['data']['selftext'] == null) {
                    console.log("Downloading media...");
                    mediaDownloader.downloadMedia(post).then(function(media) {
                        console.log("Media downloaded!");
                        console.log(media);
                        if (media['type'] == 'image') {
                            console.log("Uploading image to Instagram...");
                            igClient.publish.photo({
                                file: fs.readFileSync(media['image']),
                                caotion: post['data']['title']
                            }).then(function(publishResult) {
                                console.log(publishResult);
                            }).catch(function(err) {
                                console.warn("Could not upload image to Instagram!");
                                console.error(err);
                            }).finally(function() {
                                clearTemp();
                            });
                        }
                        else if (media['type'] == 'video') {
                            console.log("Uploading video to Instagram...");
                            igClient.publish.video({
                                video: fs.readFileSync(media['video']),
                                coverImage: fs.readFileSync(media['thumbnail']),
                                caption: post['data']['title']
                            }).then(function(publishResult) {
                                console.log(publishResult);
                            }).catch(function(err) {
                                console.warn("Could not upload video to Instagram!");
                                console.error(err);
                            }).finally(function() {
                                clearTemp();
                            });
                        }
                        else {
                            console.warn("Unknown media type!");
                        }
                    }).catch(function(err) {
                        console.warn("MediaDownloader failed!");
                        console.error(err);
                        clearTemp();
                    });
                }
                else {
                    console.warn("Selftext posts are not supported yet.");
                }
            });
        }
        catch(err) {
            console.warn("An error occurred");
            console.error(err);
        }
    }).catch(function(err) {
        console.warn("Failed to sign in!");
        console.error(err);
    });
}).catch(function(err) {
    console.warn("Failed to simulate pre-login flow!");
    console.error(err);
});