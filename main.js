// load basic packages
const process = require('process');

// retrieve details needed for logging in to Instagram
const loginDetails = require('./logindetails.json');
const redditor = require("./redditor.js");

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
                console.log(post);
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