const { ChatInputApplicationCommandData, ApplicationCommandOptionData, CommandInteraction } = require('discord.js');
const Bot = require('../client/Bot');

module.exports = class Command {
  /**
   * @param {Bot} client
   * @param {ChatInputApplicationCommandData} data
   */
  constructor(client, data) {
    /**
     * @type {Bot}
     */
    this.client = client;

    /**
     * @type {string}
     */
    this.name = data.name;

    /**
     * @type {string}
     */
    this.description = data.description;
    

    /**
     * @type {?boolean}
     */
    this.defaultPermission = data.defaultPermission;

    /**
     * @type {?ApplicationCommandOptionData[]}
     */
    this.options = data.options;
  }

  /**
   * Function to run when command is called
   * @param {CommandInteraction} interaction
   * @abstract
   */
  async run(interaction) {
    interaction.deferReply({ ephemeral: true });
  }

  /**
   * Transforms the command into a simple command data to register in the client
   * @returns {ChatInputApplicationCommandData}
   */
  transformCommand() {
    return {
      name: this.name,
      description: this.description,
      defaultPermission: this.defaultPermission,
      options: this.options,
    };
  }
};
