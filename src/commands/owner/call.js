const { CommandInteraction, MessageEmbed, Interaction } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, Emojis, EColors, User, Cache, embedReportCM } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'call',
      description: '[ADM]Configuração do sistema de chamada.',
      defaultPermission: false,
      options: [
        {
          name: 'user',
          description: '[ADM] Veja as informações de chamada de qualquer usuário.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'member',
              description: '[ADM] Mencione o usuário.',
              type: 'USER',
              required: true,
            },
          ],
        },
      ],
    });
  }
  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: false });

    if (!interaction.member.roles.cache.has(process.env.ROLE_ADM)) {
      await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, apenas \`ADMINISTRADORES\` podem utilizar esses comandos. Sua tentativa foi denunciada.`}).catch(() => null);
      embedReportCM.report(interaction.user.id, this.name, interaction)
      return;
    }
    
    const member = interaction?.options?.getUser('member');
    
    if (subCommand === 'user') {

      const memberData = await User.findOne({ _id: member.id });

      const cachedUser = Cache.cache.get(member.id);
      const timeInCall = Date.now() - cachedUser?.joinedAt || 0;

      const test = interaction.guild.members.cache.get(member.id)

      const configEmbed = new MessageEmbed()
      .setColor(EColors.All)
      .setTimestamp()
      .setAuthor({ name: `🕑Tempo em chamada de ${member.username}!`, iconURL:member.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: `${member.username}`, iconURL: member.displayAvatarURL({ dynamic: true }) })
      .setDescription(
        [
          `⏰**Tempo total em chamada:** ${moment.duration(memberData?.callInfo.timeAll).format('M[m] d[d] h[h] m[m] s[s]')}`,
          `${test.voice.channel ? `🔊**Se encontra em:** <#${test.voice.channelId}> \`${!Cache.cache.has(member.id) ? `📢o usuário precisa mutar e desmutar para voltar a contagem` : moment.duration(timeInCall).format('M[m] d[d] h[h] m[m] s[s]')}\`` : '🔈Usuário não está em chamada no momento'}`,
          '',
          `⏱ \`+${moment.duration(timeInCall).format('M[m] d[d] h[h] m[m] s[s]')}\` adicionado no tempo total do usuário.`,
        ].join('\n')
      )
      .setTimestamp(new Date());

    await interaction.editReply({ embeds: [configEmbed] }).catch(() => null);

    }

  }
};
