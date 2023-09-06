const { CommandInteraction, Permissions } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, Emojis, Teams, Mentor, MentorJson2, TeamsJson, embedReportCM, Advisor, logger } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'loading',
      description: 'PV',
      defaultPermission: false,
      options: [
        {
          name: 'start_teams',
          description: '[DEV] Start.',
          type: 'SUB_COMMAND',
        },
        {
          name: 'start_mentores',
          description: '[DEV] Start.',
          type: 'SUB_COMMAND',
        },
        {
          name: 'reload_advisor',
          description: '[DEV] Start.',
          type: 'SUB_COMMAND',
        },
      ],
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.user.id !== '315309413244338178') {
      await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, apenas o criador do bot pode utilizar esse comando! Sua tentativa foi denunciada.` }).catch(() => null);
      embedReportCM.report(interaction.user.id, this.name, interaction);
      return;
    }

    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'reload_advisor': {
        const cache = [];

        for (const advisor of TeamsJson) {

          if (cache.includes(advisor.monitorEmail)) return;
          cache.push(advisor.monitorEmail);
          for (const advisorUnic of TeamsJson.filter((x) => x.monitorEmail === advisor.monitorEmail)) {
            const [create, createAdvisor] = await Promise.all([Teams.findOne({ _id: advisorUnic.groupID }), Advisor.findOne({ _id: advisorUnic.monitorEmail })]);

            if (!createAdvisor) return;

            if (!createAdvisor.userID) return;

            if (!createAdvisor?.teams?.find((x) => x.teamID === advisorUnic.groupID)) {
              if (!create) return;

              const role = interaction.guild.roles.cache.get(create.categoryInfo.roleID);
              const member = interaction.guild.members.cache.get(createAdvisor.userID);
              await member.roles.add(role);

              try {
                await Promise.all([
                  Teams.findOneAndUpdate(
                    {
                      _id: advisorUnic.groupID,
                    },
                    {
                      $push: {
                        members: {
                          memberID: createAdvisor.userID,
                          memberName: advisorUnic.monitorName,
                          dateEntry: Date.now(),
                          isAdvisor: true,
                          isOwner: false,
                        },
                      },
                    }
                  ),
                  Advisor.findOneAndUpdate(
                    {
                      userID: createAdvisor.userID,
                    },
                    {
                      $push: {
                        teams: {
                          teamID: advisorUnic.groupID,
                        },
                      },
                    }
                  ),
                ]);
              } catch (error) {
                console.log(error);
                await interaction
                  .editReply({
                    embeds: [],
                    components: [],
                    content: `${Emojis.Errado} | ${interaction.user}, não foi possivel atualizar o banco de dados da equipe **${advisor.groupName}** ou do Orientador! Por favor, abra um TICKET Suporte.`,
                  })
                  .catch(() => null);
              }
            }

            
          }
          logger.info(`${advisor.monitorName} new Advisor were reloaded.`);
        }

        return await interaction.editReply({content: `${Emojis.Certo} | Os orientadores foram verificados. Por favor, consulte o banco de dados para ver se está tudo certo.`})
      }

      case 'start_teams': {
        let number = 1;
        for (const team of TeamsJson) {
          setTimeout(async () => {
            const [create, createAdvisor] = await Promise.all([Teams.findOne({ _id: team.groupID }), Advisor.findOne({ _id: team.monitorEmail })]);

            if (create && createAdvisor) return;

            if(TeamsJson.filter((x) => x.groupName.toLowerCase().includes(team.groupName)).length > 1){
              logger.error(`EQUIPES COM O MESMO NOME! ${team.groupName}`);
              return
            }

            if (!create) {
              try {
                const categoria = await interaction.guild.channels.create(`👥 | ${team.groupName}`, {
                  type: 'GUILD_CATEGORY',
                });

                const [canalTexto, canalVoz, cargo] = await Promise.all([
                  interaction.guild.channels.create(`💭chat-${team.groupName.replace(/\s+/g, '')}`, {
                    type: 'GUILD_TEXT',
                    parent: categoria.id,
                  }),
                  interaction.guild.channels.create(`🔊Chamada | ${team.groupName.replace(/\s+/g, '')}`, {
                    type: 'GUILD_VOICE',
                    parent: categoria.id,
                  }),
                  interaction.guild.roles.create({
                    name: team.groupName,
                    permissions: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.CONNECT],
                  }),
                ]);

                //definir as permissões do cargo nos canais da categoria
                const permissoesCanal = [
                  {
                    id: cargo.id,
                    allow: [
                      Permissions.FLAGS.VIEW_CHANNEL,
                      Permissions.FLAGS.SEND_MESSAGES,
                      Permissions.FLAGS.CONNECT,
                      Permissions.FLAGS.SPEAK,
                      Permissions.FLAGS.ATTACH_FILES,
                      Permissions.FLAGS.STREAM,
                      Permissions.FLAGS.READ_MESSAGE_HISTORY,
                    ],
                  },
                  {
                    id: interaction.guild.roles.everyone.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL],
                  },
                ];

                await Promise.all([
                  canalTexto.permissionOverwrites.set(permissoesCanal),
                  canalVoz.permissionOverwrites.set(permissoesCanal),
                  Teams.create({
                    _id: team.groupID,
                    name: team.groupName,
                    'categoryInfo.categoryID': categoria.id,
                    'categoryInfo.textID': canalTexto.id,
                    'categoryInfo.voiceID': canalVoz.id,
                    'categoryInfo.roleID': cargo.id,
                  }),
                ]);

                logger.info(`${team.groupName} new Team were identified.`);
              } catch (error) {
                logger.error(`${error}`);
              }
            }

            if (!createAdvisor) {
              try {
                await Advisor.create({
                  _id: team.monitorEmail,
                  name: team.monitorName,
                });
                logger.info(`${team.monitorName} new advisor were identified.`);
              } catch (error) {
                logger.error(`${error}`);
              }
            }
            //console.log("Delayed for 2 second.");
          }, 2000 * number);
        }
        return await interaction.editReply({content: `${Emojis.Certo} | As equipes foram verificadas. Por favor, consulte o banco de dados para ver se está tudo certo.`})
      }

      case 'start_mentores': {
        let number = 1;
        for (const mentor of MentorJson2) {
          number++;
          setTimeout(async () => {
            const create = await Mentor.findOne({ _id: mentor.mentorID });

            if (create) return;

            await Mentor.create({
              _id: mentor.mentorID,
            });

            logger.info(`${mentor.name} new Mentors were identified.`);
            //console.log("Delayed for 0.5 second.");
            number++;
          }, 100 * number);
        }

        return await interaction.editReply({ content: `${Emojis.Certo} | Mentores foram carregados!` });
      }
    }
  }
};
