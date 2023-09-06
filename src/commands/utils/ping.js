const { MessageEmbed, CommandInteraction } = require('discord.js');
const { Command } = require('../..');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'ping',
      description: '[GERAL] Pinga ai!',
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    const message = await interaction.deferReply({
      ephemeral: true,
      fetchReply: true,
    });

    const ms = message.createdTimestamp - interaction.createdTimestamp;

    let color = '#00FF00';
    if (ms > 240 && ms < 480) {
      color = '#FFFF00';
    } else if (ms > 480) {
      color = '#FF0000';
    }

    const embed = new MessageEmbed()
    .setColor(color)
    .setDescription(`\`Pong🏓\` | Latência do bot: \`${ms}ms\` & API: \`${interaction.client.ws.ping}\` `);

    interaction.editReply({
      embeds: [embed],
      ephemeral: true,
    });
  }
};
