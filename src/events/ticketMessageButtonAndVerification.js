const { Interaction, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const moment = require('moment');

const { Emojis, EColors, Teams, requestMentoring, Mentor, Moment } = require('../index');

const { Event, logger } = require('..');

require('moment-duration-format');
moment.locale('pt-br');

const cacheTeamMentor = [];

module.exports = class extends Event {
  constructor(client) {
    super(client, {
      event: 'ready',
    });
  }

  /**
ticketMessageButtonAndVerification   * @param {Interaction} interaction
   */

  async execute(interaction) {
    const cooldown = 3600000;

    //Canal no qual vai ser enviado as mentorias solicitadas
    const channelRequest = this.client.channels.cache.get(process.env.TICKET_CHANNEL_REQUEST);

    //Canal de logs de mentorias aceitas
    const channelLogAccept = this.client.channels.cache.get(process.env.TICKET_CHANNEL_ACCEPT);

    //Canal de logs de mentorias ignoradas
    const channelLogIgnored = this.client.channels.cache.get(process.env.TICKET_CHANNEL_IGNORED);

    const guildCache = this.client.guilds.cache.get(process.env.DEVELOPMENT_GUILD_ID);

    

    async function requestMentoringFunction(userRequestID, teamID, interaction) {
     
      const [
        requestMentoringData,
        teamData,
      ] = await Promise.all([
        requestMentoring.findOne({ teamID: teamID, status: "aguardando" }),
        Teams.findOne({ _id: teamID })
      ])

      //
      

      //botões Filtros e Coletor
      const buttonMentorar = new MessageButton()
      .setCustomId('mentorar')
      .setLabel('Mentorar')
      .setStyle('SUCCESS')
      .setDisabled(false);

      const row = new MessageActionRow();
      row.addComponents([buttonMentorar]);

      const embedNewRequest = new MessageEmbed()
        .setColor('#F9E619')
        .setTitle(`${requestMentoringData.attempts > 1 ? `🚨Mentoria Solicitada **NOVAMENTE!**🚨 #${requestMentoringData.attempts + 1}` : '🌟Nova Mentoria Solicitada🌟'}`)
        .setDescription(`👥**Equipe:** \`${teamData.name}\``)
        .setTimestamp();

      const messageSend = await channelRequest.send({ content: `<@&` + process.env.ROLE_MENTOR + `>`, components: [row], embeds: [embedNewRequest] }).catch(() => null);

      const filter = (interaction) => {
        return interaction.isButton();
      };

      const collector = messageSend.createMessageComponentCollector({
        filter: filter,
        time: requestMentoringData.date + cooldown - Date.now(),
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
              value: `\n**Mentoria solicitada por:** <@${requestMentoringData.userID}> \`(${requestMentoringData.userID})\` \n**ID Unico:** \`${teamData._id}\` \n**Nome**: \`${teamData.name}\` \n**Quantidade de participantes**: \`${teamData.members.length}\``,
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
              value: `\n**Mentoria solicitada por:** <@${requestMentoringData.userID}> \`(${requestMentoringData.userID})\` \n**ID Unico:** \`${teamData._id}\` \n**Nome**: \`${teamData.name}\` \n**Quantidade de participantes**: \`${teamData.members.length}\``,
            },
            {
              name: `Data solicitada`,
              value: `${Moment(requestMentoringData.date).format('LLLL')}`,
            }
          )
          .setTimestamp();

        return logEmbed;
      }

      collector.on('collect', async (x) => {

        if (cacheTeamMentor.includes(teamID)){
          return await interaction.reply({content: `⏰ | Algum mentor já está tentando mentorar essa equipe. Por favor, aguarde.`, ephemeral: true}).catch(() => null);
        } 
        cacheTeamMentor.push(teamID);

        

        //Buscando informações do discord sobre o mentor que clicou no botão
        const member = guildCache.members.cache.get(x.user.id);

            //setTimeout(async () => {
              
              const [
                mentorData,
                requestMentoringDatanow
              ] = await Promise.all([
                Mentor.findOne({ userID: x.user.id }),
                requestMentoring.findOne({ teamID: teamID, status: "aguardando" })
              ]);

              //Verificando o mentor
              if (!mentorData) {
                cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamID), 1);
                return await channelRequest.send({ content: `${Emojis.Errado} | ${member}, você não está no banco de dados dos Mentores. Por favor, abra um TICKET Suporte em <#ID>`, ephemeral: false }).catch(() => null);
              }
              if (mentorData.mentoringThis) {
                cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamID), 1);
                return await channelRequest
                  .send({ content: `${Emojis.Errado} | ${member}, você já está mentorando uma equipe no momento. Se isso não for um erro, por favor, abra um TICKET Suporte em <#ID>`, ephemeral: false })
                  .catch(() => null);
              }

              try{

              const role = guildCache.roles.cache.get(teamData.categoryInfo.roleID);
              const channelTeam = guildCache.channels.cache.get(teamData.categoryInfo.textID);

              await Promise.all([
                messageSend ? messageSend.delete().catch(() => null) : null,
                await Mentor.findOneAndUpdate(
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
                    teamID: teamID,
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
                channelLogAccept.send({ embeds: [embedLogAccept(member, requestMentoringDatanow.date)] }),
                member.roles.add(role),
                channelRequest.send({ content: `${Emojis.Certo} | ${member}, agora você está mentorando o grupo **${teamData.name}**\n💭 | Acesse o chat da equipe clicando ➡ <#${teamData.categoryInfo.textID}>`, ephemeral: false }).catch(() => null),
                channelTeam.send({ content: `🎉 | <@&${teamData.categoryInfo.roleID}>, o(a) mentor(a) ${member} está mentorando vocês agora.` }).catch(() => null),
              ])


            } catch (error){
              logger.error(error)
              await channelRequest.send({ content: `${Emojis.Errado} | ${member}, ocorreu um erro tentar executar o sistema. Por favor, abra um TICKET Suporte em <#ID>`, ephemeral: false }).catch(() => null);
            }          

              //if (messageSend) await messageSend.delete().catch(() => null);
            //}, 100);
            cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamID), 1);
            collector.stop()
      });

      collector.on('end', async (collected) => {
        cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamID), 1);
        if (collected.size === 0){
          cacheTeamMentor.splice(cacheTeamMentor.indexOf(teamID), 1);
          channelLogIgnored.send({ embeds: [embedLogIgnored()] }).catch(() => null);
          if(messageSend) await messageSend.delete().catch(() => null);
        } 
      });
    }

    //ID do canal que a mensagem com os botões dos TICKETS
    const channelTicketId = process.env.TICKET_CHANNEL_BUTTONS;

    //Buscando o banco de dados de todos as solicitações de tickets que estão aguardando
    const requestMentoringData = await requestMentoring.find();

    //Embed com as informações
    const configEmbed = new MessageEmbed()
      .setColor(EColors.Certo)
      .setTimestamp()
      .setTitle(`🌟Solicite sua mentoria ou abra um Ticket Suporte🌟`)
      .setDescription([`\n🟢**Solicitar Mentoria**\n\`A equipe precisa de ajuda? Solicite a mentoria agora. Não é agendada, é agora!\` \n\n🎫**TICKET Suporte**\n\`Direcionado a problemas gerais.\``].join('\n'))
      .setTimestamp(new Date())
      .setFooter({ text: `${this.client.user.username}`, iconURL: this.client.user.displayAvatarURL({ dynamic: true }) });

    const buttonLabel = 'Solicitar Mentoria AGORA';
    const buttonLabelSupport = 'Abrir Ticket Suporte';
    const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
      .setCustomId('open_requestMentoring')
      .setLabel(buttonLabel)
      .setStyle('SUCCESS')
      .setDisabled(true),

      new MessageButton()
      .setCustomId('open_ticketSupport')
      .setLabel(buttonLabelSupport)
      .setStyle('PRIMARY')
      .setDisabled(true)
    ); 

    //Sistema para excluir a mensagem anterior
    const channelTicketInt = this.client.channels.cache.get(channelTicketId);
    channelTicketInt.bulkDelete(3, true).catch((err) => {
      console.error(err);
    });

    //Sistema para excluir a mensagem anterior
    const channelRequestMentoringInt = this.client.channels.cache.get(process.env.TICKET_CHANNEL_REQUEST);
    channelRequestMentoringInt.bulkDelete(90, true).catch((err) => {
      console.error(err);
    });

    //Enviando a mensagem nova
    channelTicketInt.send({ components: [row], embeds: [configEmbed] });

    for (const document of requestMentoringData.filter((x) => x.status === "aguardando" && cooldown - (Date.now() - x.date) > 0)) {
      await requestMentoringFunction(document.userID, document.teamID, interaction);
      //await channelRequestMentoringInt.send({ content: `${document.teamID} \n${document.userID} \n${document.attempts} \n${Moment.duration(Date.now() - document.date).format('d[d] h[h] m[m] s[s]')}` ,components: [], embeds: [] });
    }
  }
};
