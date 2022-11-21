const axios = require('axios');

const { Output, handlers } = require('@chrisofnormandy/mariwoah-bot');
const { MessageEmbed } = handlers.embed;
/**
 * 
 * @param {import('@chrisofnormandy/mariwoah-bot').MessageData} data 
 * @returns 
 */
module.exports = (data) => {
    if (!data.arguments.length) {
        return new Promise((resolve, reject) => {
            axios.post('http://localhost:8000/auth/register', {
                guildId: data.message.guild.id,
                channelId: data.message.channel.id,
                userId: data.message.author.id
            })
                .then((response) => {
                    const data = response.data;

                    if (data.tempPin) {
                        const embed = new MessageEmbed()
                            .makeField('Registration', `✅ Success! On login, use ${data.tempPin} as a pin and 000000 (6 zeros) as your 2FA.`)
                            .makeFooter('You will be prompted to set a pin on first login.');

                        new Output().addEmbed(embed).resolve(resolve);
                    }
                    else
                        new Output('You already have an account. :)').resolve(resolve);
                })
                .catch((err) => new Output().setError(err).reject(reject));
        });
    }

    return new Output('You only need the command. No arguments ;)').resolve();
};