const { Interaction, Permissions, MessageEmbed } = require('discord.js');
const moment = require('moment');
const { Event, logger } = require('..');

const { Guild, User, Client } = require('../');

require('moment-duration-format');

moment.locale('pt-br');

const cache = [];

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
    if (!this.client.commandsLoaded) {
      return;
    }

    if (interaction.isCommand()) {
      const [clientData, userData, guildData] = await Promise.all([Client.findOne({ _id: interaction.client.user.id }), User.findOne({ _id: interaction.user.id }), Guild.findOne({ _id: interaction.guildId })]);

      if (!guildData) Guild.create({ _id: interaction.guildId });

      if (cache.includes(interaction.user.id)) return await interaction.reply({ content: `⏰ | Aguarde um instante antes de executar um comando.` }).catch(() => null);
      cache.push(interaction.user.id);

      if (!userData) {
        await Promise.all([
          User.create({ _id: interaction.user.id }),
          interaction.reply({
            content: '❤ | É bom ter você aqui! Sua primeira vez usando o bot **HackaThon** requer te cadastrar no banco de dados. Digite novamente o comando😁',
            ephemeral: true,
          }),
        ]);
        cache.splice(cache.indexOf(interaction.user.id), 1);
        return;
      }

      this.client.channels.cache.get(process.env.COMMANDO_LOG_CHANNEL).send({
        embeds: [
          new MessageEmbed()
            .setDescription(`\`/${interaction.commandName}\``)
            .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setFooter({ text: `${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp(),
        ],
      });

      if (clientData.blacklist.find((x) => x.idUser === interaction.user.id)) {
        await interaction.reply({
          content: ` \`Blacklist\` | ${interaction.user} você está incapacitado de me usar. \nMotivo: \`${clientData.blacklist.find((x) => x.idUser === interaction.user.id).reason}\``,
          ephemeral: true,
        });
        cache.splice(cache.indexOf(interaction.user.id), 1);
        return;
      }

      if (clientData.maintenance.is) {
        if (interaction.user.id !== '315309413244338178') {
          if (!clientData.maintenance.users.find((x) => x.idUser === interaction.user.id)) {
            await interaction.reply({
              content: ` \`Manutenção\` | ${interaction.user} me encontro em manutenção no momento. \nMotivo: **${clientData.maintenance.reason}**`,
              ephemeral: true,
            });
            cache.splice(cache.indexOf(interaction.user.id), 1);
            return;
          }
        }
      }

      if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
        if (guildData.cmd.status) {
          const arr = guildData.cmd.channels;
          if (!arr.includes(interaction.channelId)) {
            await interaction
              .reply({
                content: '`Block Commands` | Não posso responder comandos nesse canal.',
              })
              .then((msg) => setTimeout(() => msg.delete().catch(() => null), process.env.DELETE_TEMP));
            cache.splice(cache.indexOf(interaction.user.id), 1);
            return;
          }
        }
      }

      const command = this.client.commands.get(interaction.commandName);
      if (command) {
        try {
          await command.run(interaction);
          cache.splice(cache.indexOf(interaction.user.id), 1);
        } catch (err) {
          logger.error(err);
          cache.splice(cache.indexOf(interaction.user.id), 1);
        }
      }
    }
  }
};
