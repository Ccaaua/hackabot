const { CommandInteraction, MessageEmbed, Interaction } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, Emojis, User, Moment, embedReportCM, logger } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'ticket',
      description: '[ADM] Sistema de Ticket.',
      defaultPermission: false,
      options: [
        {
          name: 'adicionar-participante',
          description: '[ADM] Adicione participantes na conversa.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'usuario',
              description: '[ADM] Mencione o participante para adicionar.',
              type: 'USER',
              required: true,
            },
          ],
        },
        {
          name: 'remover-participante',
          description: '[ADM] Remova participantes da conversa.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'usuario',
              description: '[ADM] Mencione o participante para remover.',
              type: 'USER',
              required: true,
            },
          ],
        },
        {
          name: 'fechar-ticket',
          description: '[ADM] Feche o ticket.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'motivo',
              description: '[ADM] Deixe um FEEDBACK em relação a esse TICKET.',
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
    await interaction.deferReply({ ephemeral: false });
    if (!interaction.member.roles.cache.has(process.env.ROLE_ADM)) {
      await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, apenas \`ADMINSTRADORES\` podem utilizar esses comandos. Sua tentativa foi denunciada.` }).catch(() => null);
      embedReportCM.report(interaction.user.id, this.name, interaction)
      return;
    }

    const subCommand = interaction.options.getSubcommand();

    const user = interaction.user;

    const member = interaction.options.getUser('usuario');

    const categorySupport = process.env.CATEGORY_TICKET;

    const motivo = interaction.options.getString('motivo');

    //Canal que vai ficar os LOGS dos ticket fechados
    const channelTicketLogFinish = this.client.channels.cache.get(process.env.TICKET_CHANNEL_FINISH);

    switch (subCommand) {
      case 'fechar-ticket': {
        
        function ticketFechado(data, userTicket) {
          const ticketFechado = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle(`🎫Ticket Suporte Fechado - ${userTicket.user.tag}`)
            .addFields(
              {
                name: `👁‍🗨Usuários`,
                value: `🟢**Ticket aberto por:** ${userTicket.user} \`(${userTicket.user.id})\` \n🔵**Ticket fechado por:** ${interaction.user} \`(${interaction.user.id})\``,
              },
              {
                name: `💭FeedBack do usuário que fechou o Ticket`,
                value: `${motivo}`,
              },
              {
                name: `⏰Tempo`,
                value: `🟢**Data de abertura:** ${Moment(data.ticket.date).format('LLLL')} \n🔵**Data de fechamento:** ${Moment(Date.now()).format('LLLL')} \n⏰**Duração:** \`${Moment.duration(
                  Date.now() - data.ticket.date
                ).format('d[d] h[h] m[m] s[s]')}\``,
              }
            );

          return ticketFechado;
        }

        if (interaction.channel.parentId === categorySupport) {

          const userTicketDB = await User.findOne({ 'ticket.channelID': interaction.channelId });

          if (!userTicketDB)
            return await interaction
              .editReply({
                content: `${Emojis.Errado} | ${interaction.user}, um erro inesperado aconteceu! Pelo visto esse canal existe mas não consta em meu banco de dados =/. Por favor, chame o DEV responsável.`,
              })
              .catch(() => null);

          const userTicket = interaction.guild.members.cache.get(userTicketDB._id);
          const channel = interaction.guild.channels.cache.get(interaction.channelId);
          const channelBase = interaction.guild.channels.cache.get(process.env.TICKET_CHANNEL_BASE);

          try{

          await Promise.all([
            User.findOneAndUpdate(
              {
                _id: userTicketDB._id,
              },
              {
                $push: {
                  'ticket.lastTickets': {
                    channelID: userTicketDB.ticket.channelID,
                    dateOpen: userTicketDB.ticket.date,
                    dateFinish: Date.now(),
                    userFinishID: user.id,
                    feedback: motivo,
                  },
                },
                $set: {
                  'ticket.channelID': '',
                  'ticket.date': '',
                },
              },
              {
                upsert: true,
                new: true,
              }
            ),
            channelTicketLogFinish.send({ embeds: [ticketFechado(userTicketDB, userTicket)] }).catch(() => null),
            channel.permissionOverwrites.set(channelBase.permissionOverwrites.cache),
            //channel.edit({ parent: 'ID_CANAL_TICKETS_FECHADOS' }).catch(() => null),
            interaction.editReply({ content: `${Emojis.Certo} | ${interaction.user}, TICKET fechado com sucesso!`, ephemeral: false }).catch(() => null)
          ]);
          return;

        } catch (error) {
          logger.error(error)
          return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, ocorreu um erro tentar executar o sistema. Por favor, chame o DEV responsável`, ephemeral: false }).catch(() => null)
        }

        } else {
          return await interaction
            .editReply({ content: `${Emojis.Errado} | ${interaction.user}, você precisa estar em um canal criado pelo sistema TICKET. Se isso não for um erro, por favor, entre em contato com o DEV responsável.` })
            .catch(() => null);
        }
      }
      case 'remover-participante': {
        if (!interaction.channel.parentId === categorySupport)
          return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, você precisa estar em um canal criado pelo sistema TICKET.` }).catch(() => null);

        const channel = interaction.guild.channels.cache.get(interaction.channelId);

        await Promise.all([
          channel.permissionOverwrites.delete(member).catch(() => null),
          interaction.editReply({ content: `${Emojis.Certo} | ${interaction.user}, o usuário ${member} foi removido com sucesso desse canal.` }).catch(() => null),
        ]);
      }
      case 'adicionar-participante': {
        if (!interaction.channel.parentId === categorySupport)
          return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, você precisa estar em um canal criado pelo sistema TICKET.` }).catch(() => null);

        const channel = interaction.guild.channels.cache.get(interaction.channelId);

        const permissao = {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
        };

        await Promise.all([
          channel.permissionOverwrites.edit(member, permissao),
          interaction.editReply({ content: `${Emojis.Certo} | ${interaction.user}, o usuário ${member} foi adicionado com sucesso nesse canal.` }).catch(() => null),
        ]);

      }
    }
  }
};
