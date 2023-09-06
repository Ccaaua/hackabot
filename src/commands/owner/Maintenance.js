const { CommandInteraction } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const Client = require('../../database/Schemas/Client');

const { Command, Emojis, embedReportCM } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'manutenção',
      description: '[DEV] Deixe o bot em manutenção.',
      defaultPermission: false,
      options: [
        {
          name: 'on',
          description: '[DEV] Deixe a manutenção ligada',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'motivo',
              description: '[DEV] Escreva o motivo da manutenção.',
              type: 'STRING',
              required: true,
            },
          ],
        },
        {
          name: 'off',
          description: '[DEV] Deixe a manutenção desligada',
          type: 'SUB_COMMAND',
        },
        {
          name: 'add',
          description: '[DEV] Adicione um usuário para ter acesso mesmo com a manutenção.',
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
          name: 'remove',
          description: '[DEV] Remova um usuário para ter acesso mesmo com a manutenção.',
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
      ],
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('usuário');
    await interaction.deferReply({ ephemeral: true });

    if (interaction.user.id !== '315309413244338178') {
      await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, apenas o criador do bot pode utilizar esse comando! Sua tentativa foi denunciada.` }).catch(() => null);
      embedReportCM.report(interaction.user.id, this.name, interaction)
      return;
    }

    const clientData = await Client.findOne({ _id: interaction.client.user.id });

    const maintenanceData = clientData.maintenance;

    switch(subCommand){

      case 'on' : {
        if (maintenanceData === true) {
          await interaction.editReply({ content: `${Emojis.Errado} | A manutenção já se encontra **LIGADA**.` });
          return;
        }

        await Promise.all([
          await Client.updateOne(
            { _id: interaction.client.user.id },
            {
              $set: {
                'maintenance.is': true,
                'maintenance.reason': interaction.options.getString('motivo'),
              },
            },
            {
              upsert: true,
              new: true,
            }
          ),
          interaction.editReply({ content: `${Emojis.Certo} | A manutenção foi **LIGADA**.` })
        ])
  
        break;
      }

      case 'off' : {
        if (maintenanceData === false) {
          await interaction.editReply({ content: `${Emojis.Errado} | A manutenção já se encontra **DESLIGADA**` });
          return;
        }
  
        await Promise.all([
          Client.updateOne(
            { _id: interaction.client.user.id },
            {
              $set: {
                'maintenance.is': false,
                'maintenance.reason': '',
              },
            },
            {
              upsert: true,
              new: true,
            }
          ),
          interaction.editReply({ content: `${Emojis.Certo} | A manutenção foi **DESLIGADA**.` })
        ])
        break;
      }

      case 'add' : {
        if (maintenanceData.users.find((x) => x.idUser === user.id)) {
          await interaction.editReply({ content: `${Emojis.Errado} | O usuário \`${user.tag}\` já está em minha lista de manutenção!` });
          return;
        }
  
        await Promise.all([
          await Client.updateOne(
            { _id: interaction.client.user.id },
            {
              $push: {
                'maintenance.users': {
                  idUser: user.id,
                },
              },
            },
            {
              upsert: true,
              new: true,
            }
          ),
          interaction.editReply({ content: `${Emojis.Certo} | O usuário \`${user.tag}\` foi **ADICIONADO** em minha lista de manutenção.` })
        ])

        break;
      }

      case 'remove' : {
        
        const maintenanceData2 = maintenanceData.users.find((x) => x.idUser === user.id);

        if (!maintenanceData2) {
          await interaction.editReply({ content: `${Emojis.Errado} | O usuário \`${user.tag}\` não está em minha lista de manutenção.` });
          return;
        }
  
        await Promise.all([
          await Client.updateOne(
            { _id: interaction.client.user.id },
            {
              $pull: {
                'maintenance.users': maintenanceData2,
              },
            },
            {
              upsert: true,
              new: true,
            }
          ),
          interaction.editReply({ content: `${Emojis.Certo} | O usuário \`${user.tag}\` foi **REMOVIDO** em minha lista de manutenção.` })
        ])
        
        break;
      }
      }

    }




};
