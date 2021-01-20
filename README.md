# insta_reddit_bot

A bot for Instagram which pulls images from Reddit. This was also the source code of @me_irl_bot and @ik_ihe_bot, before they both got deleted by Instagram.



## Requirements

The following software needs to be installed on your system in order for this bot to work:
- [NodeJS](https://nodejs.org/)
- [npm](https://www.npmjs.com/get-npm) (often included with NodeJS)
- [ffmpeg](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg) for video support

Now keep in mind that I run the bot on Linux (Raspbian), so this guide is also focused on Linux. You should be able to run this bot on other operating systems as well, but for video support it might require some modifying of the code in the [video-mediahandler](https://github.com/FreekBes/insta_reddit_bot/blob/master/media_handlers/video.js). Automation-wise, I also have no idea how to do that on other systems, so you would have to figure that out yourself. Don't have a Linux system? Luckily, a [Raspberry Pi](https://www.raspberrypi.org/) can fix that for you - it's a small little system that is perfect for situations like these. I run my bot on one too. You can get them for prices as low as $35-40.


## Installation

> **Disclaimer:** by using this bot, you will not have control over what your account will be posting - the bot will post whatever the subreddit(s) you choose to mirror from upvotes. In essence, this means that sometimes the bot might post pictures that do not follow [Instagram's Terms of Service](https://help.instagram.com/477434105621119), which could result in Instagram taking action against your account, such as permanently deleting it. By using this bot, you agree with the fact that I am not responsible for any damages to your account(s) or other possessions in any means, whatever the cause.


[Download](https://github.com/FreekBes/insta_reddit_bot/archive/master.zip) or clone this repository into an empty folder. Create a file in this folder called *logindetails.json* and enter the following information into this file, replacing all the `ENTER` fields:
```
{
  "username": "ENTER_YOUR_INSTAGRAM_USERNAME",
  "password": "ENTER_YOUR_INSTAGRAM_PASSWORD",
  "subreddit": "/r/ENTER_A_SUBREDDIT"
}
```

Please note that two-factor authentication is not supported, so disable that for any account you plan on using. Also, I shouldn't have to mention this, but be careful showing/sharing any of the contents from this file - it does contain your password.

After creating this file, open a CLI, change directory to the project's folder (`cd /PATH/TO/PROJECT`), then run `npm install` and wait for the installation to complete.



### Mirroring from multiple subreddits

Ever since version 0.2.0 of this bot, mirroring from multiple subreddits is now supported. To set this up, modify *logindetails.json* as follows:
```
{
  "username": "ENTER_YOUR_INSTAGRAM_USERNAME",
  "password": "ENTER_YOUR_INSTAGRAM_PASSWORD",
  "subreddit": {
    "/r/ENTER_A_RANDOM_SUBREDDIT": 30,
    "/r/ENTER_A_RANDOM_SUBREDDIT": 40,
    "/r/ENTER_A_RANDOM_SUBREDDIT": 25,
    "/r/ENTER_A_RANDOM_SUBREDDIT": 5
  }
}
```


The number behind the subreddit's name is the chance of the subreddit being chosen by the bot during runtime. All the chances combined together must equal 100 (30+40+25+5=100), otherwise the bot will purposefully run into an error (a total of >100 might cause performance issues, eventually).

This means you can mirror from a maximum of 100 subreddits from a single bot instance (when every subreddit's chance equals 1).


## Running the bot

To run the bot, simply run the command `node main.js` in the project's folder.



### Automating the bot

To let the bot automatically mirror posts from a subreddit, you can automate it with cron on Linux. To do so, run the command `crontab -e`, select your favorite text editor if not done yet (I recommend using [nano](https://www.howtogeek.com/howto/42980/the-beginners-guide-to-nano-the-linux-command-line-text-editor/)), and add the following two lines to the end of the file opened:

```
0,20,40 9-17 * * * node /PATH/TO/PROJECT/main.js >/dev/null 2>&1
0,30 18-23,0-8 * * * node /PATH/TO/PROJECT/main.js >/dev/null 2>&1
```

This will make the bot run three times an hour between 09:00 and 18:00, and two times an hour between 18:00 and 09:00. Please note that it uses your machine's timezones. You can modify any times and frequencies here - to do so, please take a look at [cron tutorials](https://www.google.com/search?q=how+to+edit+a+cron+file).

When you're done, simply press <kbd>Ctrl</kbd> + <kbd>X</kbd> and save the file. That's all, no need to restart your system! The changes will automatically be applied.



## Preventing Instagram's bot detection

Now, something important to notice: Instagram will at some point probably detect your bot, and ban it from using Instagram. To make sure this does not happen as easily, we can create a short simple script that adds a random delay when running the bot, so that your account won't be uploading images at regular intervals too much.

Create a new file using `nano run.sh` in the project's folder. Enter the following contents:

```
#!/bin/bash

sleep $((($RANDOM % 300)+20))
node /PATH/TO/PROJECT/main.js
```

This will add a random delay of at least 20, at most 320 seconds when running the bot **via this script**. Do not forget to modify any active cron jobs: instead of running `node /PATH/TO/PROJECT/main.js`, it should now run `/PATH/TO/PROJECT/run.sh`!



## My bot has been banned, what do I do?

If it's not the account but the actual bot being banned (an *IgSentryBlockError*), modify `main.js` as follows: search for the line `igClient.state.generateDevice`. Here you'll find a function that generates a device to use for the bot, using a deviceID. Currently, it is as follows: `igClient.state.generateDevice(loginDetails.userName + "_blahblahblah");`. Simply edit the `_blahblahblah` part to any random text you'd like, save the file and run the bot again. It should now work again.

If the above does not fix your issue, it might be your IP-address that has been blocked from using Instagram's services. There's no way to circumvent this, except from using a VPN or proxy for your bot.

If it's the account that has been banned, there's nothing more you can do other than [contacting Instagram and appealing the ban](https://help.instagram.com/contact/606967319425038), or creating a new account.



## Please do not use this library for spamming purposes

I did not create this library to spam Instagram. Please respect this, and do not use it to flood Instagram with posts. Posting a maximum of 3 times an hour should be more than enough.



## Contributing

If you wish to contribute to this repository, feel free to go ahead. Keep in mind that the code is a bit messy, since I never originally intended on releasing it. I might clean it up some day.



## Need help?

If you need any more help setting up your bot, feel free to send me a message on Instagram! You can find me at [@freekbes](https://www.instagram.com/freekbes).
