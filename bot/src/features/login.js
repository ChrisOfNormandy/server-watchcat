const axios = require('axios');
const Discord = require('discord.js');

const { Output } = require('@chrisofnormandy/mariwoah-bot');

module.exports = (message, data) => {
    if (!data.arguments.length) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:8000/auth/register', {
                guildId: message.guild.id,
                channelId: message.channel.id,
                userId: message.author.id
            })
                .then((response) => {
                    const data = response.data;

                    if (data.tempPin) {
                        const embed = new Discord.MessageEmbed()
                            .addField('Registration', `✅ Success! On login, use ${data.tempPin} as a pin and 000000 (6 zeros) as your 2FA.`)
                            .setFooter({ text: 'You will be prompted to set a pin on first login.' });

                        resolve(new Output().addEmbed(embed));
                    }
                    else
                        resolve(new Output('You already have an account. :)'));
                })
                .catch((err) => reject(new Output().setError(err)));
        });
    }

    return Promise.resolve(new Output());
};