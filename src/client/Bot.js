const glob = require('util').promisify(require('glob'));
const path = require('path');
const { Client, Collection } = require('discord.js');
const fs = require('fs');

const Command = require('../structures/Command');
const Event = require('../structures/Event');
const logger = require('../services/logger');

const dbIndex = require('../database/index');

/**
 * @typedef BotOptions
 * @property {string} token
 */

module.exports = class Bot extends Client {
  /**
   * Creates a new client
   * @param {BotOptions & import('discord.js').ClientOptions} options
   */
  constructor(options) {
    /**
     * If a token is not provided
     */
    if (!options.token) {
      throw new Error('The client needs a token');
    }

    super(options);

    /**
     * The client token
     * @type {string}
     */
    this.token = options.token;

    /**
     * The commands collection
     * @type {Collection<string, Command>}
     */
    this.commands = new Collection();

    /**
     * A boolean to check if commands are loaded
     * @type {boolean}
     */
    this.commandsLoaded = false;
  }

  /**
   * Starts the client and login with the token
   */
  async start() {
    await dbIndex.start();

    logger.info('Loading events...');
    await this.loadEvents();

    logger.info('Logging in...');
    await this.login(this.token);

    logger.info('Loading commands...');
    await this.loadCommands();
  }

  /**
   * Load all commands
   */
  async loadCommands() {
    const fullPath = path.resolve(path.dirname(require.main.filename), 'commands/**/*.js');

    let loaded = 0;
    let failed = 0;

    const files = await glob(fullPath);
    for (const filePath of files) {
      if (path.extname(filePath) === '.js') {
        try {
          const File = require(filePath);
          const command = new File(this);
          if (command instanceof Command) {
            this.commands.set(command.name, command);

            loaded++;
          }
        } catch (err) {
          logger.error(err);
          failed++;
        }
      }
    }


    const guildId = process.env.DEVELOPMENT_GUILD_ID;
    if (!guildId) {
      throw new Error('Set a development guild ID in the .env file to test commands in development mode');
    }
    if (process.env.NODE_ENV?.trim() !== 'production') {
      await this.application.commands.set(
        this.commands.map((x) => x.transformCommand()),
        guildId 
      );
    } else {
      await Promise.all([
        this.application.commands.set(this.commands.filter((cmd) => cmd.defaultPermission !== false).map((x) => x.transformCommand())),
        this.application.commands.set(
          this.commands.filter((cmd) => cmd.defaultPermission === false).map((x) => x.transformCommand()),
          guildId 
        ),
      ]);
    }

    // const parse = (cmds) => cmds.filter((cmd) => cmd.defaultPermission === false);
    // const commands = process.env.NODE_ENV?.trim() === 'production' ? await this.application.commands.fetch().then(parse) : await this.guilds.cache.get(guildId).commands.fetch().then(parse);
    // await this.application.commands.permissions.set({
    //   guild: guildId,
    //   fullPermissions: commands.map((cmd) => ({
    //     id: cmd.id,
    //     permissions: [
    //       {
    //         id: '315309413244338178',
    //         type: 'USER',
    //         permission: true,
    //       },
    //     ],
    //   })),
    // });

    logger.info(`(${loaded}/${loaded + failed}) commands loaded!`);
    this.commandsLoaded = true;
  }

  /**
   * Load the client events
   */
  async loadEvents() {
    const fullPath = path.resolve(path.dirname(require.main.filename), 'events/**/*.js');

    let loaded = 0;
    let failed = 0;

    const files = await glob(fullPath);
    for (const filePath of files) {
      if (path.extname(filePath) === '.js') {
        try {
          const File = require(filePath);
          const event = new File(this);
          if (event instanceof Event) {
            this.on(event.event, (...args) => event.execute(...args));
            loaded++;
          }
        } catch (err) {
          logger.error(err);
          failed++;
        }
      }
    }

    logger.info(`Loaded ${loaded} of ${loaded + failed} events!`);
  }
};
