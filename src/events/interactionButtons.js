const { Interaction, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const moment = require('moment');

const { Emojis, EColors, Teams, requestMentoring, Mentor, User, Moment} = require('../index');

const { Event} = require('..');

require('moment-duration-format');
moment.locale('pt-br');

const cacheTeam = [];
const cacheTeamMentor = [];

module.exports = class extends Event {
  constructor(client) {
    super(client, {
      event: 'interactionCreate',
    });
  }

  /**
   * @param {Interaction} interaction
   */

  async execute(interaction) {
    const cooldown = 3600000;

    if (!interaction.isButton()) return;

    const guild = interaction.guild;

    const [userData, teamData] = await Promise.all([User.findOne({ _id: interaction.user.id }), Teams.findOne({ 'members.memberID': interaction.user.id })]);

    if (!userData) {
      await Promise.all([
        User.create({ _id: interaction.user.id }),
        interaction.reply({
          content: '❤ | É bom ter você aqui! Sua primeira vez usando o bot **HackaThon** requer te cadastrar no banco de dados. Aperte novamente o botão😁',
          ephemeral: true,
        }),
      ]);
      return;
    }

    function embedErro() {
      const erroInesperado = new MessageEmbed()
        .setColor('#ff0000')
        .setTitle(`Ticket Fechado Incorretamente - ${interaction.user.tag}`)
        .addFields(
          {
            name: `Aberto por`,
            value: `${interaction.user} \`(${interaction.user.id})\``,
          },
          {
            name: `Fechado por`,
            value: `SISTEMA`,
          },
          {
            name: `Data de abertura`,
            value: `${Moment(userData.ticket.date).format('LLLL')}`,
          },
          {
            name: `Data de fechamento`,
            value: `${Moment(Date.now()).format('LLLL')}`,
          },
          {
            name: `Duração`,
            value: `${Moment.duration(Date.now() - userData.ticket.date).format('d[d] h[h] m[m] s[s]')}`,
          }
        );

      return erroInesperado;
    }

    function ticketAberto(ticket) {
      const embed2 = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle(`🌟Novo Ticket Aberto! - ${interaction.user.tag}`)
        .addFields(
          {
            name: `👥Aberto por`,
            value: `${interaction.user} \`(${interaction.user.id})\``,
          },
          {
            name: `🗨Canal`,
            value: `<#${ticket}> \`(${ticket})\``,
          },
          {
            name: `📆Data`,
            value: `${Moment(Date.now()).format('LLLL')}`,
          }
        );

      return embed2;
    }

    switch (interaction.customId) {
      case 'open_requestMentoring': {
        if (!teamData) {
          return interaction.reply({ content: `${Emojis.Errado} | ${interaction.user}, você não está em nenhuma equipe no momento.`, ephemeral: true }).catch(() => null);
        }

        if (teamData?.members?.filter((x) => x.memberID === interaction.user.id && x.isAdvisor === true).length) {
          return interaction.reply({ content: `${Emojis.Errado} | ${interaction.user}, orientadores não podem solicitar mentoria.`, ephemeral: true }).catch(() => null);
        }

        if (cacheTeam.includes(teamData._id)) return interaction.reply({ content: `⏰ | Alguém da sua equipe já está solicitando uma mentoria. Por favor, aguarde.`, ephemeral: true }).catch(() => null);
        cacheTeam.push(teamData._id);

        //Canal no qual vai ser enviado as mentorias solicitadas
        const channelRequest = this.client.channels.cache.get(process.env.TICKET_CHANNEL_REQUEST);

        //Canal de logs de mentorias aceitas
        const channelLogAccept = this.client.channels.cache.get(process.env.TICKET_CHANNEL_ACCEPT);

        //Canal de logs de mentorias ignoradas
        const channelLogIgnored = this.client.channels.cache.get(process.env.TICKET_CHANNEL_IGNORED);

        //Buscando no banco de dados se já existe informações sobre solicitações pendentes da mesma equipe
        const [
          requestMentoringData,
          requestMentoringDataFinish
        ] = await Promise.all([
          requestMentoring.findOne({ teamID: teamData._id, status: "aguardando" }),
          requestMentoring.findOne({ teamID: teamData._id, status: "mentorando" }),
        ]);

        // Verificar se o usuário já tem uma solicitação em aberto
          if (requestMentoringData && requestMentoringData.date !== null && cooldown - (Date.now() - requestMentoringData.date) > 0) {
            cacheTeam.splice(cacheTeam.indexOf(teamData._id), 1);
            return interaction
              .reply({
                content: `${Emojis.Errado}⏰ | A equipe já tem uma solicitação de Mentoria em andamento. Expira em \`${Moment.duration(cooldown - (Date.now() - requestMentoringData.date)).format(
                  'd[d] h[h] m[m] s[s]'
                )}\``,
                ephemeral: true,
              })
              .catch(() => null);
          }
        if (requestMentoringDataFinish) {
          cacheTeam.splice(cacheTeam.indexOf(teamData._id), 1);
          return interaction
            .reply({
              content: `${Emojis.Errado} | ${interaction.user}, sua equipe já está sendo mentorado no momento. Por favor, se isso não for um erro, abra um TICKET Suporte em <#ID>`,
              ephemeral: true,
            })
            .catch(() => null);
        }

        let isAgain = false;

        if (requestMentoringData?.attempts >= 1) {
          isAgain = true;

          await requestMentoring.findOneAndUpdate(
            {
              teamID: teamData._id,
              status: "aguardando",
            },
            {
              $set: {
                date: Date.now(),
                attempts: requestMentoringData.attempts + 1,
              },
            }
          );
        } else {
          await requestMentoring.create({
            teamID: teamData._id,
            userID: interaction.user.id,
            date: Date.now(),
            status: "aguardando",
            attempts: 1,
          });
        }

        const row = new MessageActionRow();
        const buttonMentorar = new MessageButton().setCustomId('mentorar').setLabel('Mentorar').setStyle('SUCCESS').setDisabled(false);

        row.addComponents([buttonMentorar]);

        //-=-=-=--=-=-=-=-=-EMBEDS-=-=-=--=-=-=-=-=-

        const embedRequest = new MessageEmbed()
          .setColor('#F9E619')
          .setTitle(`${isAgain === false ? '🌟Nova Mentoria Solicitada🌟' : `🚨Mentoria Solicitada **NOVAMENTE!**🚨 #${requestMentoringData.attempts + 1}`}`)
          .setDescription(`👥**Equipe:** \`${teamData.name}\``)
          .setTimestamp();

        const messageSend = await channelRequest.send({ content: `<@&` + process.env.ROLE_MENTOR + `>`, components: [row], embeds: [embedRequest] }).catch(() => null);

        //Filtros e Coletor
        const filter = (interaction) => {
          return interaction.isButton();
        };

        const collector = messageSend.createMessageComponentCollector({
          filter: filter,
          time: cooldown,
        });

        function embedLogAccept(user, date) {
          const logEmbed = new MessageEmbed()
            .setColor(EColors.Certo)
            .setTitle(`🌟Nova Mentoria Aceita🌟`)
            .addFields(
              {
                name: `🌟Mentoria aceita por`,
                value: `${user} \`(${user.id})\``,
              },
              {
                name: `Informações da Equipe`,
                value: `\n**Mentoria solicitada por:** ${interaction.user} \`(${interaction.user.id})\` \n**ID Unico:** \`${teamData._id}\` \n**Nome**: \`${teamData.name}\` \n**Quantidade de participantes**: \`${teamData.members.length}\``,
              },
              {
                name: `⏰Tempo`,
                value: `\n**Data solicitada:** ${Moment(date).format('llll')} \n**Data aceita:** ${Moment(Date.now()).format('llll')} \n**Tempo de espera:** \`${Moment.duration(Date.now() - date).format(
                  'd[d] h[h] m[m] s[s]'
                )}\``,
              }
            )
            .setTimestamp();

          return logEmbed;
        }

        function embedLogIgnored() {
          const logEmbed = new MessageEmbed()
            .setColor('#F9E619')
            .setTitle(`🟡Mentoria Ignorada🟡`)
            .addFields(
              {
                name: `Informações da Equipe`,
                value: `\n**Mentoria solicitada por:** ${interaction.user} \`(${interaction.user.id})\` \n**ID Unico:** \`${teamData._id}\` \n**Nome**: \`${teamData.name}\` \n**Quantidade de participantes**: \`${teamData.members.length}\``,
              },
              {
                name: `Data solicitada`,
                value: `${Moment(Date.now()).format('LLLL')}`,
              }
            )
            .setTimestamp();

          return logEmbed;
        }

        const embed = new MessageEmbed().setColor('#00ff00').setTitle('🌟Mentoria solicitada!').setDescription(`Sua mentoria já foi solicitada. Por favor, aguarde.`);
        const embedAlertAgain = new MessageEmbed()
          .setColor(EColors.Certo)
          .setTitle('🔄Solicitação enviada novamente!')
          .setDescription(`Pelo visto você já solicitou a mentoria anteriormente e não foi respondida. Por tanto, foi enviada novamente. Caso não for respondida, abra um TICKET Suporte em <#ID>`);

        // Enviar uma mensagem de confirmação
        interaction.reply({ embeds: [isAgain === true ? embedAlertAgain : embed], ephemeral: true });
        cacheTeam.splice(cacheTeam.indexOf(teamData._id), 1);

        collector.on('collect', async (x) => {
          if (cacheTeamMentor.includes(teamData._id)) {
            return await interaction.reply({ content: `⏰ | Algum mentor já está tentando mentorar essa equipe. Por favor, aguarde.`, ephemeral: true }).catch(() => null);
          }
          cacheTeamMentor.push(teamData._id);

          //Buscando informações do discord sobre o mentor que clicou no botão
          const member = interaction.guild.members.cache.get(x.user.id);

          /**  TESTTAR FUNÇÃO DPS 
          

          function restored(team) {
            cacheTeamMentor.push(team)
            if(messageSend) buttonMentorar.setDisabled(false)
          } */
              //setTimeout(async () => {

              const [
                mentorData, 
                requestMentoringDatanow
              ] = await Promise.all([
                Mentor.findOne({ userID: member.id }), 
                requestMentoring.findOne({ teamID: teamData._id, status: "aguardando" })
              ]);

              if (!mentorData) {
                cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamData._id), 1);
                return await channelRequest.send({ content: `${Emojis.Errado} | ${member}, você não está no banco de dados dos Mentores. Por favor, abra um TICKET Suporte em <#ID>`, ephemeral: false }).catch(() => null);
              }

              if (mentorData.mentoringThis) {
                cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamData._id), 1);
                return await channelRequest
                  .send({ content: `${Emojis.Errado} | ${member}, você já está mentorando uma equipe no momento. Se isso não for um erro, por favor, abra um TICKET Suporte em <#ID>`, ephemeral: false })
                  .catch(() => null);
              }

              try {
                const role = interaction.guild.roles.cache.get(teamData.categoryInfo.roleID);
                const channelTeam = this.client.channels.cache.get(teamData.categoryInfo.textID);

                await Promise.all([
                  messageSend ? messageSend.delete().catch(() => null) : null,
                  Mentor.findOneAndUpdate(
                    {
                      userID: member.id,
                    },
                    {
                      $set: {
                        mentoringThis: true,
                      },
                    },
                    {
                      upsert: true,
                      new: true,
                    }
                  ),
                  requestMentoring.findOneAndUpdate(
                    {
                      teamID: teamData._id,
                      status: "aguardando",
                    },
                    {
                      $set: {
                        status: "mentorando",
                        dateInitial: Date.now(),
                        mentorID: member.id,
                      },
                    },
                    {
                      upsert: true,
                      new: true,
                    }
                  ),
                  channelLogAccept.send({ embeds: [embedLogAccept(member, requestMentoringDatanow.date)] }).catch(() => null),
                  member.roles.add(role),
                  channelRequest
                    .send({ content: `🎉 | ${member}, você está mentorando a equipe **${teamData.name}** \n💭 | Acesse o chat da equipe clicando ➡ <#${teamData.categoryInfo.textID}>`, ephemeral: false })
                    .catch(() => null),
                  channelTeam.send({ content: `🎉 | <@&${teamData.categoryInfo.roleID}>, o(a) mentor(a) ${member} está mentorando vocês agora.` }),
                ]);
                cacheTeam.splice(cacheTeam.indexOf(teamData._id), 1);
              } catch (error) {
                logger.error(error);
                await channelRequest.send({ content: `${Emojis.Errado} | ${member}, ocorreu um erro tentar executar o sistema. Por favor, abra um TICKET Suporte em <#ID>`, ephemeral: false }).catch(() => null);
              }
              // }, 100);
              cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamData._id), 1);
              cacheTeam.splice(cacheTeam.indexOf(teamData._id), 1);
              collector.stop();
        });

        collector.on('end', async (collected) => {
          cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamData._id), 1);
          if (collected.size === 0) {
            cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamData._id), 1);
            cacheTeam.splice(cacheTeam.indexOf(teamData._id), 1);
            channelLogIgnored.send({ embeds: [embedLogIgnored()] });
            if(messageSend) await messageSend.delete().catch(() => null);
          }
        });

        
        setTimeout(async () => {
          cacheTeam.splice(cacheTeam.indexOf(teamData._id), 1);
        }, 60000);
        break;
      }
      case 'open_ticketSupport': {
        // Verificar se o usuário já tem um ticket aberto
        if (userData?.ticket?.channelID) {
          if (this.client.channels.cache.get(userData.ticket.channelID)) {
            const embed = new MessageEmbed().setColor('#ff0000').setTitle('❌Erro').setDescription(`Você já tem um TICKET Suporte aberto em <#${userData.ticket.channelID}>`);
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => null);
          } else {
            await User.updateOne(
              {
                _id: interaction.user.id,
              },
              {
                $push: {
                  'ticket.lastTickets': {
                    channelID: userData.ticket.channelID,
                    dateOpen: userData.ticket.date,
                    dateFinish: Date.now(),
                    userFinishID: 'SISTEMA',
                  },
                },
              },
              {
                upsert: true,
                new: true,
              }
            );

            //Canal que vai ficar os LOGS dos ticket fechados
            const channelTicketLogFinish = this.client.channels.cache.get(process.env.TICKET_CHANNEL_FINISH);

            await channelTicketLogFinish.send({ embeds: [embedErro('Suporte')] }).catch(() => null);

            await User.updateOne(
              {
                _id: interaction.user.id,
              },
              {
                $set: {
                  'ticket.channelID': '',
                  'ticket.date': '',
                },
              },
              {
                upsert: true,
                new: true,
              }
            );
          }
        }

        // Criar um novo canal para o ticket
        const ticketChannel = await guild.channels.create(`ticket${userData.ticket.lastTickets.length > 0 ? `(${userData.ticket.lastTickets.length + 1})` : ''} - ${interaction.user.username}`, {
          parent: 'ID', // Coloque o ID da categoria onde os canais de ticket devem ser criados
          type: 'text',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: ['VIEW_CHANNEL'],
            },
            {
              id: guild.roles.cache.get('ID'),
              allow: ['VIEW_CHANNEL', 'ATTACH_FILES', 'SEND_MESSAGES'],
            },
            {
              id: interaction.user.id,
              allow: ['VIEW_CHANNEL', 'ATTACH_FILES', 'SEND_MESSAGES'],
            },
          ],
        });

        // Salvar o ticket no banco de dados
        await User.findOneAndUpdate(
          {
            _id: interaction.user.id,
          },
          {
            'ticket.channelID': ticketChannel.id,
            'ticket.date': Date.now(),
          },
          {
            upsert: true,
            new: true,
          }
        );

        // Enviar uma mensagem de boas-vindas ao ticket
        const embed = new MessageEmbed().setColor('#00ff00').setTitle('✅Ticket Aberto').setDescription(`🎫O seu ticket foi aberto em <#${ticketChannel.id}>`);
        interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => null);

        await this.client.channels.cache
          .get(ticketChannel.id)
          .send({ content: `👋Olá, ${interaction.user}! \nSeu TICKET Suporte está aberto. Mande sua dúvida/problema.\n` })
          .catch(() => null);

        //Canal que vai ficar os LOGS dos ticket abertos
        const channelTicketLogOpen = this.client.channels.cache.get(process.env.TICKET_CHANNEL_OPEN);

        await channelTicketLogOpen.send({ embeds: [ticketAberto(ticketChannel.id)] }).catch(() => null);
      }
    }
  }
};
