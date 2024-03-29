const axios = require('axios');
const fs = require('fs');
const request = require('request');

module.exports = {
	config: {
		name: "shoticron",
		author: "cliff",//created by marjhun mirai file//converted by cliff to goatbot
		version: "2.0.0",
		cooldowns: 0,
		role: 0,
		shortDescription: {
			en: "send random video every minutes"
		},
		longDescription: {
			en: "randomshoti"
		},
		category: "Shoti",
		guide: {
			en: "&shoticron {p} <setinterval> <time> <hour> <minutes><seconds>"
		}
	},

	onStart: async function ({ api, event }) {
		const threadID = event.threadID;
		const commandArgs = event.body.toLowerCase().split(' ');

		const allowedAdminUID = '100080202774643';
		if (commandArgs[1] === 'setinterval') {
			const newIntervalValue = parseFloat(commandArgs[2]);
			const newIntervalUnit = commandArgs[3]?.toLowerCase();

			if (!isNaN(newIntervalValue) && newIntervalValue > 0) {
				let newInterval;

				if (newIntervalUnit === 'hour' || newIntervalUnit === 'hours') {
					newInterval = newIntervalValue * 60 * 60 * 1000;
					const unit = newIntervalValue === 1 ? 'hour' : 'hours';
					api.sendMessage(`馃殌 |鈥nterval time set to ${newIntervalValue} ${unit}.`, threadID);
				} else if (newIntervalUnit === 'minute' || newIntervalUnit === 'minutes') {
					newInterval = newIntervalValue * 60 * 1000;
					const unit = newIntervalValue === 1 ? 'minute' : 'minutes';
					api.sendMessage(`馃殌 |鈥nterval time set to ${newIntervalValue} ${unit}.`, threadID);
				} else {
					api.sendMessage('馃殌 |鈥nvalid unit. Please use "minutes" or "hours".', threadID);
					return;
				}

				shotiAutoInterval[threadID] = newInterval;
			} else {
				api.sendMessage('馃殌 |鈥nvalid interval time. Please provide a valid positive number.', threadID);
			}
			return;
		} else if (commandArgs[1] === 'interval') {
			const currentInterval = shotiAutoInterval[threadID] || defaultInterval;
			const unit = currentInterval === 60 * 60 * 1000 ? 'hour' : 'minute';
			api.sendMessage(`馃殌 |鈥urrent interval time is set to ${currentInterval / (unit === 'hour' ? 60 * 60 * 1000 : 60 * 1000)} ${unit}.`, threadID);
			return;
		} else if (commandArgs[1] === 'on') {
			if (!shotiAutoState[threadID]) {
				shotiAutoState[threadID] = true;
				const intervalUnit = shotiAutoInterval[threadID] ? (shotiAutoInterval[threadID] === 60 * 60 * 1000 ? 'hour' : 'minute') : 'hour';
				const intervalValue = shotiAutoInterval[threadID] ? shotiAutoInterval[threadID] / (intervalUnit === 'hour' ? 60 * 60 * 1000 : 60 * 1000) : 1;
				const intervalMessage = `will send video every ${intervalValue} ${intervalUnit}${intervalValue === 1 ? '' : 's'}`;

				api.sendMessage(`馃殌 |鈥ommand feature is turned on, ${intervalMessage}.`, threadID);

				shoticron(api, event, threadID);

				setInterval(() => {
					if (shotiAutoState[threadID]) {
						shoticron(api, event, threadID);
					}
				}, shotiAutoInterval[threadID] || defaultInterval);
			} else {
				api.sendMessage('馃殌 |鈥ommand feature is already turned on', threadID);
			}
			return;
		} else if (commandArgs[1] === 'off') {
			shotiAutoState[threadID] = false;
			api.sendMessage('馃殌|鈥ommand feature is turned off', threadID);
			return;
		} else if (commandArgs[1] === 'status') {
			const statusMessage = shotiAutoState[threadID] ? 'on' : 'off';
			const intervalMessage = shotiAutoInterval[threadID] ? `Interval time set to ${shotiAutoInterval[threadID] / (shotiAutoInterval[threadID] === 60 * 60 * 1000 ? 60 : 1000)} minutes.` : 'Interval time not set. Using the default 1 -hour interval.';
			const errorMessage = lastVideoError[threadID] ? `Last video error: ${lastVideoError[threadID]}` : '';

			api.sendMessage(`馃殌|鈥ommand feature is currently ${statusMessage}.\n馃殌|鈥otal videos sent: ${videoCounter}\n馃殌|鈥otal error videos: ${errorVideoCounter}\n${errorMessage}`, threadID);
			return;
		} else if (commandArgs[1] === 'resetcount') {
			// Check if the user has permission to reset counts
			if (event.senderID === allowedAdminUID) {
				videoCounter = 0;
				errorVideoCounter = 0;
				api.sendMessage('馃殌 |鈥ideo counts have been reset.', threadID);
			} else {
				api.sendMessage('馃殌 |鈥ou do not have permission to reset counts.', threadID);
			}
			return;
		}

		api.sendMessage('馃殌|鈥nvalid command.\n\n\n馃殌|鈥� "shoticron on", "shoticron off" - to turn ON or turn OFF.\n\n\n馃殌|鈥� "shoticron setinterval <minutes/hours>" - set the timer for video\n\n\n馃殌|鈥� "shoticron interval" - check the interval\n\n\n馃殌|鈥� "shoticron status" - check the status off command', threadID);
	},
};

const moment = require('moment-timezone');

const targetTimeZone = 'Asia/Dhaka';

const now = moment().tz(targetTimeZone);
const currentDate = now.format('YYYY-MM-DD');
const currentDay = now.format('dddd');
const currentTime = now.format('HH:mm:ss');

console.log(`In ${targetTimeZone}, on ${currentDate}, it is currently ${currentDay} at ${currentTime}`);

const shotiAutoState = {};
const shotiAutoInterval = {};
let videoCounter = 0;
let errorVideoCounter = 0;
const startTime = Date.now();
const lastVideoError = {};
const defaultInterval = 60 * 60 * 1000;

const shoticron = async (api, event, threadID) => {
	try {
		let response = await axios.post('https://your-shoti-api.vercel.app/api/v1/get', { apikey: '$shoti-1hg4gifgnlfdmeslom8' });
		console.log('API Response:', response.data);

		if (response.data.error) {
			throw new Error(`API Error: ${response.data.error}`);
		}

		const userInfo = response.data.data.user;
		const videoInfo = response.data.data;
		const title = videoInfo.title;
		const durations = videoInfo.duration;
		const region = videoInfo.region;
		const username = userInfo.username;
		const nickname = userInfo.nickname;

		videoCounter++;

		const tid = event.threadID;
		const file = fs.createWriteStream('temp_video.mp4');
		const rqs = request(encodeURI(response.data.data.url));
		rqs.pipe(file);

		file.on('finish', () => {
			api.sendMessage({
				body: `饾枲饾柎饾柍饾柈 饾柌饾枻饾柇饾枺 饾柋饾枲饾柇饾枺饾柈饾柆 饾柌饾枾饾柈饾柍饾枿 饾枼饾柈饾柆 饾柍饾枿饾柂饾柍饾柈饾柂\n\n馃殌 |鈥潠仇潠潠仇潠潠�: ${title}\n馃殌 |鈥潠答潠拆潠ゐ潠别潠潠狆潠潠�: @${username}\n馃殌 |鈥潠潠潠潠潠潠狆潠潠�: ${nickname}\n馃殌 |鈥潠ｐ潠答潠别潠狆潠仇潠潠潠� : ${durations}\n馃殌 |鈥潠别潠ゐ潠︷潠潠潠�: ${region}\n\n饾棫饾棝饾棩饾棙饾棓饾棗: ${tid}\n饾枺饾柡饾棈饾柧 & 饾棈饾梻饾梿饾柧: ${currentDate} || ${currentTime}`,
				attachment: fs.createReadStream('temp_video.mp4'),
			}, threadID, () => {
				fs.unlink('temp_video.mp4', (err) => {
					if (err) {
						console.error('Error deleting temporary file:', err);
					}
				});
			});
		});
		} catch (error) {
		console.error('Error fetching or sending the video:', error);
		lastVideoError[threadID] = error.message;
		videoCounter++;
		errorVideoCounter++;
	}
};