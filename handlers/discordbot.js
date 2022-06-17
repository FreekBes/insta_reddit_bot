const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('../settings.json');
const prefix = settings.discord.prefix;
let postStatus = null;
let botActive = false;

function getArgs(body) {
	let args = body.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);
	for (let i = 0; i < args.length; i++) {
		args[i] = args[i].split("\"").join("");
	}
	return args;
}

client.on('ready', function() {
	console.log("Logged in to Discord as " + client.user.tag);
	botActive = true;
	client.user.setUsername(settings.instagram.username);
	client.user.setAFK(false);
});

client.on('message', function(msg) {
	if (msg.author.bot || !msg.content.startsWith(prefix) || msg.channel.id != settings.discord.channels.commands) {
		return;
	}
	const commandBody = msg.content.slice(prefix.length);
	const args = getArgs(commandBody);
	const command = args.shift().toLowerCase();
	switch (command) {
		case "bl":
		case "blacklist": {
			if (args.length == 0) {
				msg.reply("usage: " + prefix + "blacklist *<redditPostId>*, or " + prefix + "blacklist *<redditPostUrl>*");
				return;
			}
			if (args[0].indexOf("http") == 0) {
				let temp = args[0].split("/");
				if (!temp.length >= 7) {
					msg.reply("invalid Reddit post URL");
					return;
				}
				args[0] = temp[6];
			}
			if (args[0].length != 6) {
				msg.reply("the postId given is likely not a valid postId, or the URL is not an URL from Reddit. Not adding it to the blacklist.");
				return;
			}
			if (postStatus.postNotDone(args[0])) {
				postStatus.markPostAsDone(args[0]);
				msg.reply("the following post has been added to the blacklist: https://www.reddit.com/comments/" + args[0] + "/. Thanks for making sure the bot is Instagram-safe!");
			}
			else {
				msg.reply("this post was already on the blacklist! Thanks for making sure the bot is Instagram-safe.");
			}
			break;
		}
		case "ubl":
		case "unblacklist": {
			if (args.length == 0) {
				msg.reply("usage: " + prefix + "unblacklist *<redditPostId>*, or " + prefix + "unblacklist *<redditPostUrl>*");
				return;
			}
			if (args[0].indexOf("http") == 0) {
				let temp = args[0].split("/");
				if (!temp.length >= 7) {
					msg.reply("invalid Reddit post URL");
					return;
				}
				args[0] = temp[6];
			}
			if (args[0].length != 6) {
				msg.reply("the postId given is likely not a valid postId, or the URL is not an URL from Reddit. Cannot remove it from the blacklist.");
				return;
			}
			if (postStatus.postNotDone(args[0])) {
				msg.reply("this post was not on the blacklist!");
			}
			else {
				postStatus.unmarkPostAsDone(args[0]);
				msg.reply("the following post has been removed from the blacklist: https://www.reddit.com/comments/" + args[0] + "/.");
			}
			break;
		}
		case "schedule": {
			let temp = "";
			for (let i = 0; i < 24; i++) {
				temp += i.toString() + " 'o clock: " + JSON.stringify(settings.schedule.hourly_timings[i]) + "\n";
			}
			msg.reply("here's the posting schedule:\n"+temp).catch(function(err) {
				msg.reply("I tried to send you the posting schedule, but I couldn't do it. It's most likely too long to fit in one message.");
			});
			break;
		}
		case "ping": {
			msg.reply("pong! I'm online!");
			break;
		}
		case "help": {
			msg.reply(
`here's an overview of all available commands:
- `+prefix+`blacklist <redditPostId> - *blacklist a Reddit post*
- `+prefix+`blacklist <redditPostUrl> - *blacklist a Reddit post*
- `+prefix+`bl - *short version of blacklist command*
- `+prefix+`unblacklist <redditPostId> - *remove a Reddit post from the blacklist (or done-list)*
- `+prefix+`unblacklist <redditPostUrl> - *remove a Reddit post from the blacklist (or done-list)*
- `+prefix+`ubl - *short version of unblacklist command*
- `+prefix+`schedule - *get an overview of the posting schedule per-hour*
- `+prefix+`ping - *check if the bot is online*
- `+prefix+`help - *this overview*
`
			);
			break;
		}
		default: {
			msg.reply("unknown command. Use " + prefix + "help for help.");
			break;
		}
	}
});

exports.sendSystemMessage = function(msg) {
	if (settings.discord.enabled) {
		const channel = client.channels.cache.get(settings.discord.channels.system);
		if (channel) {
			channel.send(msg);
		}
	}
};

exports.setPostStatus = function(newPostStatus) {
	postStatus = newPostStatus;
};

function init() {
	if (settings.discord.enabled) {
		if (settings.discord.token != 'ENTER_DISCORD_TOKEN_HERE_THEN_ENABLE') {
			client.login(settings.discord.token);
		}
		else {
			console.log("Please set a Discord token in settings.json. Create a new application and add a bot at https://discord.com/developers/applications/.");
		}
	}
};

init();
