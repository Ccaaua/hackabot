const { CommandInteraction, MessageEmbed, Interaction, MessageSelectMenu, MessageActionRow } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, Emojis, EColors, requestMentoring, Mentor, Teams, Moment, TeamsJson, embedReportCM, logger } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'mentor',
      description: '[MENTOR] Comandos para os MENTORES.',
      defaultPermission: false,
      options: [
        {
          name: 'denunciar-equipe',
          description: '[MENTOR] Denuncie alguma equipe',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'nome',
              description: '[MENTOR] Digite o nome da Equipe.',
              type: 'STRING',
              required: true,
            },
            {
              name: 'motivo',
              description: '[MENTOR] Digite o motivo da denúncia.',
              type: 'STRING',
              required: true,
            },
          ],
        },
        {
          name: 'finalizar-mentoria',
          description: '[MENTOR] Finalize a mentoria!',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'feedback',
              description: '[MENTOR] Conte como foi mentorar essa equipe. Não economize nas palavras 😁',
              type: 'STRING',
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
    
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.roles.cache.has(process.env.ROLE_MENTOR)) {
      await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, apenas \`MENTORES\` e \`ADMINISTRADORES\` podem utilizar esses comandos. Sua tentativa foi denunciada.` }).catch(() => null);
      embedReportCM.report(interaction.user.id, this.name, interaction)
      return;
    }

    const subCommand = interaction.options.getSubcommand();
    
    const user = interaction.user;
    const member = interaction.member;

    const channelReport = interaction.client.guilds.cache.get(process.env.GUILD_ID).channels.cache.get(process.env.REPORT_TEAM_CHANNEL);
    const channelMentoringEnd = interaction.client.guilds.cache.get(process.env.GUILD_ID).channels.cache.get(process.env.MENTOR_MENTORING_END);

    const motivo = interaction?.options?.getString('motivo') || '';
    const feedback = interaction?.options?.getString('feedback') || '';

    const equipeName = interaction?.options?.getString('nome');

    const mentorData = await Mentor.findOne({ userID: user.id });

    function embedReport(equipe) {
      const teamFind = TeamsJson.find((team) => team.groupName.includes(equipe));
      const embedReport = new MessageEmbed()
        .setColor(EColors.Error)
        .setTitle(`🚨Nova Denúncia de Equipe🚨`)
        .addFields(
          {
            name: `🚨Denúnciado por`,
            value: `${user} \`(${user.id})\``,
          },
          {
            name: `👥Informações da Equipe`,
            value: `\n**ID Unico:** \`${teamFind.groupID}\` \n**Nome**: \`${teamFind.groupName}\``,
          },
          {
            name: `💭Motivo`,
            value: `${motivo}`,
          }
        )
        .setTimestamp();

      return embedReport;
    }

    switch (subCommand) {
      case 'denunciar-equipe': {
        const filteredTeams = TeamsJson.filter((team) => team.groupName.toLowerCase().includes(equipeName.toLowerCase()));

        if (filteredTeams.length) {
          if (filteredTeams.length > 1) {

            const selectMenu = new MessageSelectMenu()
              .setCustomId('teamSelect')
              .setPlaceholder('Selecione uma equipe.')
              .addOptions(filteredTeams.map((team) => ({ label: team.groupName, value: team.groupName, description: team.etec })))
              .setMinValues(1)
              .setMaxValues(1);

            const actionRow = new MessageActionRow().addComponents(selectMenu);

            const messageSend =  await interaction.editReply({ content: '❓Selecione abaixo a equipe correspondente:', components: [actionRow] }).catch(() => null);

            const filter = (i) => i.customId === 'teamSelect' && i.user.id === interaction.user.id;
            const collector = messageSend.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async (x) => {

              await Promise.all([
                channelReport.send({ embeds: [embedReport(x.values.toString())] }).catch(() => null),
                x.update({ content: `${Emojis.Certo} | ${interaction.user}, sua denúncia foi enviada com sucesso!`, components: [] }).catch(() => null),
              ]);
              collector.stop();
            });
            
           

            collector.on('end', async (collected) => {
              if (collected.size === 0) {
                await interaction.editReply({ content: `⏰ | Tempo limite atingido. Tente novamente.`, components: [] });
              }
            });
          } else {
            await Promise.all([
              channelReport.send({ embeds: [embedReport(filteredTeams[0].groupName)] }).catch(() => null),
              interaction.editReply({ content: `${Emojis.Certo} | ${interaction.user}, sua denúncia foi enviada com sucesso!` }).catch(() => null),
            ]);
            return;
          }
        } else {
          return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, não foi encontrado nenhuma Equipe como esse nome! Se isso não for um erro, abra um TICKET Suporte em <#ID>` }).catch(() => null);
        }

        break;
      }

      case 'finalizar-mentoria': {
        if (!mentorData) {
          return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, você não foi encontrado no banco de dados dos Mentores. Por favor, abra um TICKET Suporte <#ID>.` }).catch(() => null);
        }

        if (!mentorData?.mentoringThis) {
          return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, você não está mentorando nenhuma equipe no momento.` }).catch(() => null);
        }

        const requestMentoringData = await requestMentoring.findOne({ mentorID: user.id, status: "mentorando" });
        const teamData = await Teams.findOne({ _id: requestMentoringData.teamID });

        const embedMentoringEnd = new MessageEmbed()
          .setColor(EColors.Certo)
          .setTitle(`🎉Mentoria Finalizada🎉`)
          .addFields(
            {
              name: `🟢Mentor`,
              value: `${user} \`(${user.id})\``,
            },
            {
              name: `👥Equipe mentorada`,
              value: `\n**ID Unico:** \`${requestMentoringData.teamID}\` \n**Nome**: \`${teamData.name}\``,
            },
            {
              name: `⏰Tempo`,
              value: `\n🟡**Mentoria solicitada em:** ${Moment(requestMentoringData?.date).format('llll')} \n🟢**Mentoria aceita em:** ${Moment(requestMentoringData?.dateInitial).format(
                'llll'
              )} \n🔵**Mentoria finalizada em:** ${Moment(Date.now()).format('llll')} \n⏰**Duração:** \`${Moment.duration(Date.now() - requestMentoringData?.dateInitial).format('d[d] h[h] m[m] s[s]')}\``,
            },
            {
              name: `💭FeedBack do Mentor`,
              value: `${feedback}`,
            }
          )
          .setTimestamp();

        try{

        const role = interaction.guild.roles.cache.get(teamData.categoryInfo.roleID);

        await Promise.all([
          await Mentor.findOneAndUpdate(
            {
              userID: user.id,
            },
            {
              $push: {
                lastMentoring: {
                  teamID: requestMentoringData.teamID,
                  dateInitial: requestMentoringData.dateInitial,
                  dateEnd: Date.now(),
                  feedback: feedback,
                },
              },
              $set: {
                mentoringThis: false,
              },
            }
          ),
          requestMentoring.findOneAndUpdate(
            {
              mentorID: user.id,
              status: "mentorando"
            },
            {
              $set: {
                status: "finalizado",
                dateEnd: Date.now(),
              },
            }
          ),
          interaction.guild.members.cache.get(user.id).roles.remove(role),
          interaction.guild.channels.cache.get(teamData.categoryInfo.textID).send({ content: `👋 | O(a) mentor(a) ${user} encerrou por aqui! Caso queiram outra mentoria vocês podem solicitar novamente😊` }).catch(() => null),
          channelMentoringEnd.send({ embeds: [embedMentoringEnd] }).catch(() => null),
          interaction.editReply({ content: `${Emojis.Certo} | ${interaction.user}, mentoria finalizada com sucesso!` }).catch(() => null),
        ]);

        if (member.voice.channel) {
            await member.voice.disconnect().catch((err) => console.log(err))
        }

      } catch(error) {
        logger.error(error)
        await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, ocorreu um erro tentar executar o sistema. Por favor, abra um TICKET Suporte em <#ID>`, ephemeral: false }).catch(() => null)
      }
        break;
      }
    }
  }
};
