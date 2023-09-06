const { CommandInteraction, Interaction, MessageAttachment } = require('discord.js');

const moment = require('moment');
require('moment-duration-format');

const { Command, Emojis, User, Mentor, MentorJson2, TeamsJson, requestMentoring } = require('../..');

const { loadImage, registerFont, createCanvas } = require("canvas");
registerFont('./src/assets/fonts/GothamBold.ttf', { family: 'Gotham Bold' });

moment.locale('pt-br');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: 'resumo',
      description: '[MENTOR] Veja o resumo de suas mentorias.',
      defaultPermission: false,
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async run(interaction) {
    await interaction.deferReply({ ephemeral: true });

    //-=-=-=-=-=-=-=-= PUXANDO AS INFORMAÇÕES =-=-=-=-=-=-=-=-
    const user = interaction.user.id

    const mentorData = await Mentor.findOne({ userID: user });
    const userData = await User.findOne({ _id: user });

    if(!mentorData) {
      return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, apenas \`MENTORES\` e \`ADMINISTRADORES\` podem utilizar esse comando!` }).catch(() => null);
    }

    if(mentorData.lastMentoring.length <= 0){
      return await interaction.editReply({ content: `${Emojis.Errado} | ${interaction.user}, pelo visto você não tem nenhuma mentoria registrada =/` }).catch(() => null);
    }

    const mentorAmountMentoringsAccept = await requestMentoring.find({ mentorID: user});


    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext("2d");

    //Background 
    const resume = await loadImage('./src/assets/images/back.jpg');
    ctx.drawImage(resume, 0, 0, 1080, 1080);

    const mentorj = MentorJson2.find(x => x.mentorID === mentorData._id)

    //Nome do mentor.
    ctx.textAlign = "left";
    ctx.font = '45px "Gotham Bold"';
    ctx.fillStyle = "#ffff";
    ctx.fillText(`${mentorj.name}`, 33, 330);

    //Quantidade de mentorias aceitas.
    ctx.textAlign = "center";
    ctx.font = '165px "Gotham Bold"';
    ctx.fillStyle = "#ffff";
    ctx.fillText(`${mentorAmountMentoringsAccept.length}`, 858, 178);

    const AmountTeamsMentorings = []
    for(const x of mentorData.lastMentoring) {

    if(AmountTeamsMentorings.includes(x.teamID)) continue;
    AmountTeamsMentorings.push(x.teamID);

    }

    

    //Quantidade de equipes mentoradas.
    ctx.textAlign = "center";
    ctx.font = '100px "Gotham Bold"';
    ctx.fillStyle = "#ffff";
    ctx.fillText(`${AmountTeamsMentorings.length}`, 187, 473);


    let time = 1
    for(const x of mentorData.lastMentoring) {
    time = time + (x.dateEnd - x.dateInitial);
    }


    //Quantidade de tempo total em mentoria.
    ctx.textAlign = "center";
    ctx.font = '100px "Gotham Bold"';
    ctx.fillStyle = "#ffff";
    ctx.fillText(`${moment.duration(time).format(time > '3600000' ? 'h[h]': 'm[m]')}`, 540, 473);

    //Quantidade de tempo total em chamada.
    ctx.textAlign = "center";
    ctx.font = '100px "Gotham Bold"';
    ctx.fillStyle = "#ffff";
    ctx.fillText(`${moment.duration(userData.callInfo.timeAll).format(userData.callInfo.timeAll > '3600000' ? 'h[h]': 'm[m]')}`, 882, 473);

    
    const teams = mentorData.lastMentoring
    const teamsSort = teams.sort((a, b) =>  (b.dateEnd - b.dateInitial) - (a.dateEnd - a.dateInitial))

        let posY = 666
        
    for(var i = 0; teams.length > 8 ? i < 8 : i < teams.length; i++) {

        const teamj = TeamsJson.find(x => x.groupID === teamsSort[i].teamID)
        ctx.textAlign = "left";
        ctx.font = '25px "Gotham Bold"';
        ctx.fillText(`${teamj.groupName.length > 16 ? teamj.groupName.slice(0, 16) + '...' : teamj.groupName}`, 45, posY)

        ctx.textAlign = "center";
        ctx.font = '25px "Gotham Bold"';
        ctx.fillText(`${moment.duration((teamsSort[i].dateEnd - teamsSort[i].dateInitial)).format('h[h] m[m] s[s]')}`, 540, posY)
        posY += 53
    }


    const attach = new MessageAttachment(
        canvas.toBuffer(),
        `Resume.png`
      );

    await interaction.editReply({ files: [attach]})
    

  }
};
