#!/usr/bin/env node

const cors = require('cors');
const express = require('express');
const commands = require('./src/commands');
const config = require('./config/config.json');

const { Intents } = require('discord.js');
const { Bot } = require('@chrisofnormandy/mariwoah-bot');

const app = express();

const bot = new Bot(config, [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], commands);
bot.setStatus('MC servers | %prefix%?');

bot.startup({ devEnabled: true })
    .then(() => {
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(cors());

        const sendUser = (req, res) => {
            res.send(Array.from(bot.client.users.cache.values()).filter((user) => `${user.username}#${user.discriminator}` === `${req.query.username}#${user.discriminator}`));
        };

        app.get('/user/id', sendUser);

        app.listen(process.env.NODE_PORT, () => console.log('Bot server running:', process.env.NODE_PORT));
    })
    .catch((err) => console.error(err));