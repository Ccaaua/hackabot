const { CommandInteraction, MessageEmbed, Interaction } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, User, Cache } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'chamada',
      description: '[GERAL] Infomações sobre seu tempo em chamada.',
      defaultPermission: false,
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    const user = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    const cachedUser = Cache.cache.get(user.id);
    const timeInCall = Date.now() - cachedUser?.joinedAt || 0;

    const userData = await User.findOne({ _id: user.id });

    const configEmbed = new MessageEmbed()
      .setColor('f2ef3d')
      .setTimestamp()
      .setAuthor({ name: `🕑Seu tempo em chamada!`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setDescription(
        [
          `⏰**Tempo total em chamada:** \`${moment.duration(userData?.callInfo.timeAll).format('M[m] d[d] h[h] m[m] s[s]')}\``,
          `${interaction.member.voice.channel ? `🔊**Se encontra em:** <#${interaction.member.voice.channelId}> \`${!Cache.cache.has(user.id) ? `📢Mute e desmute para voltar a contagem` : moment.duration(timeInCall).format('M[m] d[d] h[h] m[m] s[s]')}\``: '🔈Você não está em nenhuma chamada no momento.'}`,
          '',
          `⏱ \`+${moment.duration(timeInCall).format('M[m] d[d] h[h] m[m] s[s]')}\` adicionado no tempo total`,
        ].join('\n')
      )
      .setTimestamp(new Date());

    await interaction.editReply({ embeds: [configEmbed] }).catch(() => null);
  }
};
