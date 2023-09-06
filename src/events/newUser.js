const { Interaction, MessageEmbed } = require('discord.js');
const moment = require('moment');

const { User, Moment } = require('../index');

const { Event } = require('..');

require('moment-duration-format');
moment.locale('pt-br');

module.exports = class extends Event {
  constructor(client) {
    super(client, {
      event: 'guildMemberAdd',
    });
  }

  /**
   * @param {Interaction} interaction
   */

  async execute(interaction) {

    // Verifica se o usuário já existe no banco de dados
    const userData = await User.findOne({ _id: interaction.user.id });

    const embed = new MessageEmbed()
    .setColor('#00ff00')
    .setTitle(`${interaction.user.tag} - \`${interaction.user.id}\``)
    .setFooter({ text: `${Moment(Date.now()).format('LLLL')}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
    .addFields(
      {
        name: `${userData ? 'Entrou no server novamente' : 'Entrou no server'}`,
        value: `${interaction.user} \`(${interaction.user.id})\``,
    }
    )

    
    await this.client.channels.cache.get(process.env.USER_NEW_CHANNEL).send({ embeds: [embed]}).catch((err) => console.log(err));

    if (!userData) {
      await User.create({ _id: interaction.user.id });
      console.log(`Novo usuário ${interaction.user.username}, registrado no banco de dados!`);
    } else console.log(`Usuário ${interaction.user.username}, já registrado no banco de dados!`);
  }
};
