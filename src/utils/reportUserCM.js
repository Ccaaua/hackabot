const MentorJson = require("../../mentores.json");

const { MessageEmbed, Interaction } = require('discord.js');

const Bot = require('../client/Bot');

/**
   * @param {string} userId
   * @param {Bot} client
   */


module.exports = {
  
/**
   * @param {Interaction} interaction
   */

  async report(userId, command, interaction) {

    const channelReportUserCM = interaction.client.guilds.cache.get(process.env.REPORT_GUILD).channels.cache.get(process.env.REPORT_CHANNEL)  

    const embed= new MessageEmbed()
    .setColor('#fc031c')
    .setTitle(`🚨Tentativa de utilizar comando🚨`)
    .addFields(
      {
        name: `👋Usuário`,
        value: `${interaction.user} \`${interaction.user.id}\``
      },
      {
        name: `💭Comando`,
        value: `\`/${command}\``
      },
    )
    .setTimestamp(new Date());

    
    await channelReportUserCM.send({ embeds: [embed]})

    return;
  }, 


  allItems() {
    return Object.values(MentorJson).flat();
  }, 
};
