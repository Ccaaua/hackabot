const { CommandInteraction, MessageEmbed} = require('discord.js');

const os = require('os');
const moment = require('moment');
require('moment-duration-format');

moment.locale('pt-br');

const { Command } = require('../..');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'botinfo',
      description: '[GERAL] Veja as informações do bot.',
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const cpuUsage = (process.cpuUsage().system / 1024 / 1024).toFixed(2);
    const memoryUsage = `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}/${(os.totalmem() / 1024 / 1024).toFixed(2)}`;

    const [
      guildsAmount,
      usersAmount
    ] = await Promise.all([
      interaction.client.shard.fetchClientValues('guilds.cache.size').then((res) => res.reduce((acc, val) => acc + val)),
      interaction.client.shard.broadcastEval((client) => client.guilds.cache.reduce((acc, val) => acc + (val.memberCount ?? 0), 0)).then((res) => res.reduce((acc, val) => acc + val))
    ])
 

    const BotInfoEmbed = new MessageEmbed()
      .setColor('6c4be3')
      .setAuthor({ name: 'Minhas Informações', iconURL: interaction.client.user.displayAvatarURL()})
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addField(
        '📑 Informações Principais',
        `• Desenvolvedor: <@315309413244338178>\n• Total De Usuários: **${usersAmount}**\n• Total De Servidoes: **${guildsAmount}**\n• Uptime: \`${moment
          .duration(process.uptime() * 1000)
          .format('d[d] h[h] m[m] e s[s]')}\`\n`
      )
      .addField(
        '📖 Informações Secundárias',
        `• Processador: \`${os.cpus().map((p) => p.model)[0]}\`\n• Uso Da CPU: **${cpuUsage}%**\n• Uso Da Memória: **${memoryUsage}mb**\n• Velocidade Da CPU: **${os.cpus()[0].speed}mhz**`
      )
      .setFooter({ text: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })})
      .setTimestamp();
    await interaction.editReply({ embeds: [BotInfoEmbed] });
  }
};
