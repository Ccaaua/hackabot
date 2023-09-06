const { CommandInteraction, MessageEmbed, Interaction } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const Client = require('../../database/Schemas/Client');

const { Command, Emojis, embedReportCM } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'blacklist',
      description: '[DEV] BlackList do bot.',
      defaultPermission: false,
      options: [
        {
          name: 'add',
          description: '[DEV] Adicione um usuário a blacklist',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'usuário',
              description: '[DEV] Mencione o usuário',
              type: 'USER',
              required: true,
            },
            {
              name: 'motivo',
              description: '[DEV] Escreva o motivo da BlackList.',
              type: 'STRING',
              required: true,
            },
          ],
        },
        {
          name: 'remove',
          description: '[DEV] Remove um usuário a blacklist',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'usuário',
              description: '[DEV] Mencione o usuário',
              type: 'USER',
              required: true,
            },
          ],
        },
        {
          name: 'list',
          description: '[DEV] Veja a blacklist',
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
      embedReportCM.report(interaction.user.id, this.name, interaction)
      return;
    }

    const subCommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('usuário') || interaction.user;

    const clientData = await Client.findOne({ _id: interaction.client.user.id });
    const blackData = clientData.blacklist;

    switch (subCommand){

      case 'add' : {

        if (clientData.blacklist.find((x) => x.idUser === user.id)) {
          await interaction.editReply({ content: `${Emojis.Errado} | O usuário \`${user.tag}\` já está na blacklist!` }).catch(() => null);
          return;
        }
  
        await Client.updateOne(
          { _id: interaction.client.user.id },
          {
            $push: {
              blacklist: {
                idUser: user.id,
                reason: interaction.options.getString('motivo'),
              },
            },
          },
          {
            upsert: true,
            new: true,
          }
        );
  
        await interaction.editReply({ content: `${Emojis.Certo} | O usuário \`${user.tag}\` foi **ADICIONADO** em minha blacklist` }).catch(() => null);
        break;

      }

      case 'remove' : {
        const blackUserData = clientData.blacklist.find((x) => x.idUser === user.id);

        if (!blackUserData) {
          await interaction.editReply({ content: `${Emojis.Errado} | O usuário \`${user.tag}\` não está na BlackList` }).catch(() => null);
          return;
        }
  
        await Client.updateOne(
          { _id: interaction.client.user.id },
          {
            $pull: {
              blacklist: blackUserData,
            },
          },
          {
            upsert: true,
            new: true,
          }
        );
  
        await interaction.editReply({ content: `${Emojis.Certo} | O usuário \`${user.tag}\` foi **REMOVIDO** da minha blacklist` }).catch(() => null);
      }
  
      async function searchUser(id) {
        const userSearch = await interaction.client.users.fetch(id).catch(() => null);
  
        return userSearch.tag;
      }
  
      async function getUserBL(start = 0, end = 10) {
        const blUsers = await Promise.all(
          blackData.slice(start, end).map(async (userData, i) => {
            const tag = await searchUser(userData.idUser);
  
            return `**${i + 1}** Usuário: \`${tag}\` \nMotivo: ${userData.reason}`;
          })
        );
  
        return blUsers.join('\n\n');
      }

      case 'list' : {
        if (!blackData.length) {
          await interaction.editReply({ content: `${Emojis.Errado} | Não há **NENHUM** usuário na BlackList.` });
          return;
        }
  
        const listBlack = new MessageEmbed().setDescription(await getUserBL(0, 10));
  
        await interaction.editReply({ embeds: [listBlack] });
        break;
      }

    }
  }
};
