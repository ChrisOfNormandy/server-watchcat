#!/usr/bin/env node

const cors = require('cors');
const express = require('express');
const commands = require('./src/commands');
const config = require('./config/config.json');

require('dotenv').config();

const { Bot, Discord } = require('@chrisofnormandy/mariwoah-bot');

const app = express();

const bot = new Bot(config)
    .allow(
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildPresences,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildMembers
    )
    .addCommands(commands);

const onStartup = () => {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cors());

    const sendUser = (req, res) => {
        res.send(Array.from(bot.client.users.cache.values()).filter((user) => `${user.username}#${user.discriminator}` === `${req.query.username}#${user.discriminator}`));
    };

    app.get('/user/id', sendUser);

    app.listen(process.env.NODE_PORT, () => console.log('Bot server running:', process.env.NODE_PORT));
}

bot.startup({ devEnabled: true })
    .then((bot) => bot.setStatus('%guild_count% servers | %prefix%?'))
    .catch(console.error)
    .then(onStartup);