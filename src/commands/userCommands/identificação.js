const { CommandInteraction, MessageEmbed, Interaction, MessageActionRow, MessageButton } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, Emojis, EColors, User, Group, Teams, Moment, MentorJson, Mentor, TeamsJson, Advisor } = require('../..');

moment.locale('pt-br');

const cache = [];
const cacheTeam = [];

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'identificação',
      description: '[GERAL] Identifique o seu código aqui.',
      defaultPermission: false,
      options: [
        {
          name: 'identificar-id',
          description: '[GERAL] Informe o ID único.',
          required: true,
          type: 'STRING',
        },
      ],
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {

    if (cache.includes(interaction.user.id)){
      return await interaction.reply({ content: `⏰ | Você acabou de executar esse comando no momento. Aguarde um pouco.`, ephemeral: true }).catch(() => null);
    } 
    if (cacheTeam.includes(interaction.options.getString('identificar-id'))){
      return await interaction.reply({ content: `⏰ | Alguém da sua equipe está sendo identificado. Por favor, aguarde.`, ephemeral: true }).catch(() => null);
    }
      
    cache.push(interaction.user.id);
    cacheTeam.push(interaction.options.getString('identificar-id'));

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.user;

    const group = Group.getGroupId(interaction.options.getString('identificar-id')) || false;
    const mentor = MentorJson.getMentorId(interaction.options.getString('identificar-id')) || false;

    const cooldownCollector = 60000;

    
    setTimeout(async () => {
      cache.splice(cache.indexOf(interaction.user.id), 1);
      cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
    }, cooldownCollector * 3);


    const [
      mentorData, 
      teamDataRequest, 
      teamData
    ] = await Promise.all(
        [
        Mentor.findOne({ userID: user.id }), 
        Teams.findOne(), 
        Teams.findOne({ _id: group.groupID })
      ]
      );

    


    if (group) {

      if (mentorData) {
        await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | Você já está registrado como Mentor!` });
        cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        return;
      }

      if (teamDataRequest?.members?.find((x) => x.memberID === user.id)) {
        await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | Você já está em uma EQUIPE! Se isso não for um erro, por favor abra um TICKET Suporte em <#ID>.` }).catch(() => null);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
        return;
      }

      if (teamData.members.length > (group.membersNumber +1)) {
        await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | A equipe já está cheia! Se isso não for um erro, por favor abra um TICKET Suporte em <#ID>.` }).catch(() => null);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
        return;
      }


      const nomesConcatenados = `${group.ownerName};${group.membersNames}`;
      const namesOfGroup = nomesConcatenados.split(';');

      const configEmbed = new MessageEmbed()
        .setColor(EColors.Certo)
        .setTimestamp()
        .setAuthor({ name: `${group.groupName}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTitle(`🎉Equipe identificada!🎉`)
        .setDescription(`🔘Pressione o botão com o **SEU NOME**.`)
        .addFields(
          {
            name: `💭Equipe`,
            value: `${group.groupName}`,
          },
          {
            name: `📚Escola`,
            value: `${group.etec}`,
          },
          {
            name: `👥Participantes`,
            value: `\`${namesOfGroup.join('\n')}\``,
          },
          {
            name: `🎓Orientador`,
            value: `\`${group.monitorName}\``,
          }
        )
        .setTimestamp(new Date());

      try {
        //array de objetos com as informações de cada botão
        const botoes = namesOfGroup.map((nome) => {
          return {
            type: 'BUTTON',
            label: `${nome.length > 15 ? nome.slice(0, 15) + `...` : nome}`,
            style: teamData.members.find((x) => x.memberName === nome)  ? 'DANGER' : 'SUCCESS',
            custom_id: `${nome}`,
            disabled: teamData.members.find((x) => x.memberName === nome) ? true : false,
          };
        });

        const orientador =[
          { 
          type: 'BUTTON', 
          label: `${group.monitorName.length > 15 ? group.monitorName.slice(0, 15) + `...` : group.monitorName}`, 
          style: `${teamData.members.find((x) => x.memberName === group.monitorEmail)  ? 'DANGER' :  'PRIMARY' }`, 
          custom_id: `${group.monitorEmail}`,
          disabled:  `${teamData.members.find((x) => x.memberName === group.monitorEmail) ? true : false}`
        },
        ]
        //enviar a mensagem com os botões
       const messageSend =  await interaction.editReply({embeds: [configEmbed],
            components: [
              {
                type: 'ACTION_ROW',
                components: botoes,
              },
              {
                type: 'ACTION_ROW',
                components: orientador,
              },
            ],
          })
          .catch(() => null);

        const filter = (interaction) => {
          return interaction.isButton();
        };

        //criar um listener para ouvir as interações com os botões
        const collector = messageSend.createMessageComponentCollector({
          componentType: 'BUTTON',
          filter: filter,
          time: cooldownCollector,
        });

        collector.on('collect', async (button) => {

          const nome = button.customId;

          if (button.member.id == !interaction.user.id) return;

          //FAZER CÓDIGO PARA IDENTIFICAR SE O NOME JÁ FOI RESGATADO
          if (teamData.members.find((x) => x.memberName === nome)) {
            await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | Esse usuário já foi resgatado! Se isso não for um erro, por favor, abra um TICKET Suporte em <#ID>.` }).catch(() => null);
            cache.splice(cache.indexOf(interaction.user.id), 1);
            cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
            return;
          }

          const roleParticipante = interaction.guild.roles.cache.get(process.env.ROLE_PARTICIPANTE);

          if (nome === group.monitorEmail) {

            for (const monitor of TeamsJson.filter((x) => x.monitorEmail === nome)) {
              try {
                const requestTeamData = await Teams.findOne({ _id: monitor.groupID })
                const role = interaction.guild.roles.cache.get(requestTeamData.categoryInfo.roleID);
                await interaction.member.roles.add(role)
             } catch (error) {
              console.log(error);
                await interaction.channel
                 .send({ embeds: [], components: [], content: `${Emojis.Errado} | ${interaction.user}, não foi possivel adicionar o cargo da equipe **${monitor.groupName}**! Por favor, abra um TICKET Suporte em <#ID>.` })
                 .catch(() => null);
             }

              try {
                await Promise.all([
                  Teams.findOneAndUpdate(
                    {
                      _id: monitor.groupID,
                    },
                    {
                      $push: {
                        members: {
                          memberID: user.id,
                          memberName: monitor.monitorEmail,
                          dateEntry: Date.now(),
                          isAdvisor: true,
                          isOwner: false,
                        },
                      },
                    }
                  ),
                  Advisor.findOneAndUpdate(
                    {
                      _id: monitor.monitorEmail,
                    },
                    {
                      $push: {
                        teams: {
                          teamID: monitor.groupID,
                        },
                      },
                      $set: {
                        userID: user.id,
                        dateEntry: Date.now(),
                      },
                    }
                  ),
                ]);
              } catch (error) {
                console.log(error);
                await interaction.channel
                  .send({
                    embeds: [],
                    components: [],
                    content: `${Emojis.Errado} | ${interaction.user}, não foi possivel atualizar o banco de dados da equipe **${monitor.groupName}** ou do Orientador! Por favor, abra um TICKET Suporte em <#ID>.`,
                  })
                  .catch(() => null);
              }
            }

            
            const role = interaction.guild.roles.cache.get(process.env.ROLE_ORIENTADOR);

            await Promise.all([
              interaction.member.roles.add(role),
              interaction.member.roles.add(roleParticipante),
              
            ])
            await setNicknameTeam(group.monitorName)
            const embedNew = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle(`🎓Nova Identificação de ORIENTADOR🎓`)
            .addFields(
              {
                name: `👋Identificador`,
                value: `${interaction.user} \`(${interaction.user.id})\``,
              },
              {
                name: `🎓Informações do Orientador`,
                value: `ID Único utilizado: \`${interaction.options.getString('identificar-id')}\` \nNome: \`${group.monitorName}\` \nE-mail: \`${group.monitorEmail}\``,
              },
              {
                name: `⏰Data`,
                value: `${Moment(Date.now()).format('LLLL')}`,
              }
            );

          cache.splice(cache.indexOf(interaction.user.id), 1);
          cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
          await interaction.client.guilds.cache.get(process.env.GUILD_ID).channels.cache.get(process.env.USER_NEW_ORIENTADOR_CHANNEL).send({ embeds: [embedNew] }).catch(() => null);

          } else {

            const role = interaction.guild.roles.cache.get(teamData.categoryInfo.roleID);

            try {
            await Promise.all([
              setNicknameTeam(nome),
              Teams.findOneAndUpdate(
                {
                  _id: group.groupID,
                },
                {
                  $push: {
                    members: {
                      memberID: user.id,
                      memberName: nome,
                      dateEntry: Date.now(),
                      isOwner: nome === group.ownerName ? true : false,
                      isAdvisor: false
                    },
                  },
                }
              ),
              
            ]);

            await interaction.member.roles.add(roleParticipante)
            await interaction.member.roles.add(role)

            
            } catch (error) {
              console.log(error);
              cache.splice(cache.indexOf(interaction.user.id), 1);
            cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
             return await interaction.channel
                .send({ embeds: [], components: [], content: `${Emojis.Errado} | ${interaction.user}, ocorreu um erro tentar executar o sistema! Por favor, abra um TICKET Suporte em <#ID>.` })
                .catch(() => null);
            }
          
            const embedNew = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle(`🌟Nova Identificação de EQUIPE🌟`)
            .addFields(
              {
                name: `👋Identificador`,
                value: `${interaction.user} \`(${interaction.user.id})\``,
              },
              {
                name: `👥Informações da Equipe`,
                value: `ID Único: \`${interaction.options.getString('identificar-id')}\` \nNome: \`${group.groupName}\` \nApelido atualizado para: \`${nome}\` \nCargo: \`${nome === group.ownerName ? '✅Líder' : '❌Lider'}\``,
              },
              {
                name: `⏰Data`,
                value: `${Moment(Date.now()).format('LLLL')}`,
              }
            );

            cache.splice(cache.indexOf(interaction.user.id), 1);
            cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
            await interaction.client.guilds.cache.get(process.env.GUILD_ID).channels.cache.get(process.env.TEAM_NEW_CHANNEL).send({ embeds: [embedNew] }).catch(() => null);

          }

          
          cache.splice(cache.indexOf(interaction.user.id), 1);
          cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);

          collector.stop();
        });

        collector.on('end', async (collected) => {
          cache.splice(cache.indexOf(interaction.user.id), 1);
          cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
          if (collected.size === 0) {
            await interaction.editReply({ content: `⏰ | Tempo limite atingido. Tente novamente.`, components: [], embeds: [] }).catch(() => null);
          }
        });
      } catch (error) {
        cache.splice(cache.indexOf(interaction.user.id), 1);
        cacheTeam.splice(cacheTeam.indexOf(interaction.options.getString('identificar-id')), 1);
        console.log(error);
        await interaction.channel.send({ content: `${Emojis.Errado} | ${interaction.user}, não foi possível criar os botões. Por favor abra um TICKET Suporte em <#ID>` }).catch(() => null);
      }

      
    } else if (mentor) {
      

      if (mentorData) {
        await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | Você já está identificado como mentor!` }).catch(() => null);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        return;
      }

      const mentorDatarequest = await Mentor.findOne({ _id: mentor.mentorID });

      if (mentorDatarequest?.userID) {
        await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | Esse ID único já foi resgatado. Se isso não for um erro, por favor, abra um TICKET Suporte em <#ID>` }).catch(() => null);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        return;
      }

      if (teamDataRequest?.members?.find((x) => x.memberID === user.id)) {
        await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | Você já está identificado! Se isso não for um erro, por favor abra um TICKET Suporte em <#ID>` }).catch(() => null);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        return;
      }

      if (!mentorDatarequest) {
        await interaction.editReply({ embeds: [], components: [], content: `${Emojis.Errado} | Esse Mentor não está registrado em meu banco de dados. Por favor, abra um TICKET Suporte em <#ID>` }).catch(() => null);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        return;
      }

      const Embed = new MessageEmbed()
        .setColor(EColors.All)
        .setTimestamp()
        .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTitle(`✅Mentor identificado`)
        .addFields(
          {
            name: `👋Nome`,
            value: `${mentor.name}`,
          },
          {
            name: `💼Cargo/Função`,
            value: `${mentor.cargo}`,
          },
          {
            name: `📧Email`,
            value: `${mentor.email}`,
          }
        )
        .setTimestamp(new Date());

      const row = new MessageActionRow();

      const buttonAccept = new MessageButton().setCustomId('accept').setLabel('Aceitar').setStyle('SUCCESS').setDisabled(false);

      const buttonRecuse = new MessageButton().setCustomId('recuse').setLabel('Recusar').setStyle('DANGER').setDisabled(false);

      const filter = (interaction) => {
        return interaction.isButton();
      };

      row.addComponents([buttonAccept, buttonRecuse]);

      const messageSend = await interaction.editReply({ content: `Confirme os dados`, embeds: [Embed], components: [row] }).catch(() => null);

      const collector = messageSend.createMessageComponentCollector({
        filter: filter,
        time: cooldownCollector,
      });

      collector.on('collect', async (x) => {

        switch (x.customId) {

          case 'accept': {

            try{
              //cache.splice(cache.indexOf(interaction.user.id), 1);
            const role = interaction.guild.roles.cache.get(process.env.ROLE_MENTOR);
            await interaction.member.roles.add(role)

            const embedNew = new MessageEmbed()
              .setColor('#00ff00')
              .setTitle(`🌟Novo Mentor identificado! - ${interaction.user.tag}`)
              .addFields(
                {
                  name: `Identificado por`,
                  value: `${interaction.user} \`(${interaction.user.id})\``,
                },
                {
                  name: `Informações do Mentor`,
                  value: `**ID único:** \`${interaction.options.getString('identificar-id')}\` \n**Nome:** \`${mentor.name}\` \n**Cargo/Função:** \`${mentor.cargo}\` \n**Email:** \`${mentor.email}\` `,
                },
                {
                  name: `Data`,
                  value: `${Moment(Date.now()).format('LLLL')}`,
                }
              );

            await Promise.all([
              Mentor.findOneAndUpdate(
                {
                  _id: mentor.mentorID,
                },
                {
                  $set: {
                    userID: interaction.user.id,
                  },
                }
              ),
              setNicknameMentor(mentor.name),
              interaction.client.guilds.cache.get(process.env.GUILD_ID).channels.cache.get(process.env.USER_NEW_MENTOR_CHANNEL).send({ embeds: [embedNew] }).catch(() => null)
            ]);

            x.update({ content: `${Emojis.Certo} | ${interaction.user}, você resgatou o ID Único Mentor com sucesso! Seu apelido foi alterado para **${mentor.name}**`, components: [], embeds: [] }).catch(() => null);
            cache.splice(cache.indexOf(interaction.user.id), 1);
              
            } catch (error) {
              console.log(error);
              cache.splice(cache.indexOf(interaction.user.id), 1);
             return await interaction.channel
                .send({ content: `${Emojis.Errado} | ${interaction.user}, ocorreu um erro tentar executar o sistema. Por favor abra um TICKET Suporte em <#ID>`, embeds: [], components: [] })
                .catch(() => null);
            }

            collector.stop();
            break;
          }
          case 'recuse': {
            cache.splice(cache.indexOf(interaction.user.id), 1);
            if (messageSend) await x.update({ content: `${Emojis.Certo} | ${interaction.user}, você cancelou a operação.`, components: [], embeds: [] }).catch(() => null);
            collector.stop();
            break;
          }
        }
      });

      collector.on('end', async (collected) => {
        cache.splice(cache.indexOf(interaction.user.id), 1);
        if (collected.size === 0) {
          await interaction.editReply({ content: `⏰ | Tempo limite atingido. Tente novamente.`, components: [], embeds: [] }).catch(() => null);
        }
      });
    } else {
      await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, o código digitado não pertence a nenhuma categoria. Por favor abra um TICKET Suporte em <#ID>` }).catch(() => null);
      cache.splice(cache.indexOf(interaction.user.id), 1);
      return;
    }

    async function setNicknameMentor(nome) {
      try {
        const member = await interaction.guild.members.fetch(interaction.user.id);

        //definir o apelido do membro
        await member.setNickname(nome.length > 30 ? nome.slice(0, 15) + `.` : nome);
      } catch (error) {
        console.log(error);
        await interaction.channel.send({ content: `${Emojis.Errado} | ${interaction.user}, não foi possível alterar seu apelido. Por favor abra um TICKET Suporte em <#ID>`, embeds: [], components: [] }).catch(() => null);
      }
    }
    async function setNicknameTeam(nome) {
      try {

          const member = await interaction.guild.members.fetch(interaction.user.id)

          await Promise.all([
            member.setNickname(nome.length > 30 ? nome.slice(0, 15) + `.` : nome),
            interaction.editReply({ content: `${Emojis.Certo} | Seu apelido foi alterado para \`${nome}\` e você foi adicionado ao grupo \`${group.groupName}\``, embeds: [], components: [] }).catch(() => null)
          ])
      } catch (error) {
        console.log(error);
        await interaction.channel.send({ content: `${Emojis.Errado} | ${interaction.user}, não foi possível alterar seu apelido. Por favor abra um TICKET Suporte em <#ID>`, embeds: [], components: [] }).catch(() => null);
      }
    }
  }
};
