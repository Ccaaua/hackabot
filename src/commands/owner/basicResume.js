const { CommandInteraction, MessageEmbed, Interaction } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, Emojis, Teams, Mentor, MentorJson2, embedReportCM, requestMentoring } = require('../..');

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'basicResume',
      description: 'A command basic.',
      defaultPermission: false,
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

   const cacheRequest = []
   const cacheRequestMentor = []

    const [
      teamDataNotId,
      mentorDataNotId,
      mentoringTeam,
      mentoringMentor,
      mentoringNot,
      mentoringAll
    ] = await Promise.all([
      Teams.distinct('_id', {members: {$size: 0 }}),
      Mentor.distinct('_id', { userID: null}),
      requestMentoring.distinct('teamID', {status: "finalizado"}),
      requestMentoring.distinct('mentorID', {status: "finalizado"}),
      Mentor.distinct('userID', {lastMentoring: {$size: 0 }}),
      requestMentoring.find({ status: 'finalizado'})
    ])

    for(const info of mentoringTeam){

      if(cacheRequest.includes(info)) return;
      cacheRequest.push(info);

    }

    for(const info of mentoringMentor){

      if(cacheRequestMentor.includes(info)) return;
      cacheRequestMentor.push(info);

    }

    for(const x of mentorDataNotId){
    
      console.log(x)
      const name = MentorJson2.find(y => y.mentorID === x)
      if(!name) continue;

     console.log(name.name)

    }

   // distinct('_id', { minhaArray: [] })

   //const teamIdenti = await Teams.distinct('_id', {members: {$size:   }})


    //console.log(teamDataNotId)
    //console.log(cacheRequestMentor)
    //console.log(mentoringNot)

    const embed = new MessageEmbed()
    .addFields(
      {
        name: `Equipes`,
        value: `Identificadas: ${162 - teamDataNotId.length} \nNão identificadas: ${teamDataNotId.length} `
    },
    {
      name: `Mentores`,
      value: `Identificados: ${55 - mentorDataNotId.length} \nNão identificados: ${mentorDataNotId.length} `
    },
    {
      name: `Mentorias`,
      value: `Total de mentorias: ${mentoringAll.length} \nEquipes diferentes que solicitaram mentorias: ${cacheRequest.length} \nMentores diferentes que mentoraram: ${cacheRequestMentor.length}`
    }
    )

    await interaction.editReply({ embeds: [embed]})
    

  }
};
