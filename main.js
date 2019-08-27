// load basic packages
const process = require('process');

// retrieve details needed for logging in to Instagram
const loginDetails = require('logindetails.json');

// load the Instagram Private API Client
const IgApiClient = require('instagram-private-api');
const ig = new IgApiClient();

// load device
ig.state.generateDevice(loginDetails.userName);

// execute all requests prior to authorization in the real Android application
ig.simulate.preLoginFlow().then(function() {
    ig.account.login(loginDetails.userName, loginDetails.passWord).then(function(loggedInUser) {
        process.nextTick(async function() {
            await ig.simulate.postLoginFlow();
        });
    });
});