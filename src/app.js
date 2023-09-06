const { Intents } = require('discord.js');
const Bot = require('./client/Bot');
const fs = require('fs');

const { MessageEmbed, Snowflake, Collection, GuildMember, } = require('discord.js');

const { User,  Moment, } = require('./index');

const client = new Bot({
  token: process.env.DISCORD_TOKEN,
  presence: {
    status: 'idle',
    activities: [
      {
        name: 'que deu tudo certo. Obrigado!',
        type: 'LISTENING',
      },
    ],
  },
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

const cache = new Collection();
const ignoredChannels = ['1085673053377286225', '1085775749925044277'];
const giveInterval = 10000;

client.on('voiceStateUpdate', async (oldMember, newMember, interaction) => {
  /**
   * @typedef CachedMember
   * @prop {NodeJS.Timeout} interval
   * @prop {number} lastGive
   * @prop {number} joinedAt
   */

  /**
   * @type {Collection<Snowflake, CachedMember>}
   */
  const user = newMember;

  const [
    userInfo,
    userData
  ] = await Promise.all([
    client.users.fetch(user.id),
    User.findOne({ _id: user.id })
  ])

  if (userInfo.bot) return;

  if (!oldMember.channelId && newMember.channelId) {
    const embedEntry = new MessageEmbed()
      .setColor('#00ff00')
      .setTitle(`${userInfo.tag} - \`${userInfo.id}\``)
      .setFooter({ text: `${Moment(Date.now()).format('LLLL')}`, iconURL: userInfo.displayAvatarURL({ dynamic: true }) })
      .addFields({
        name: `Entrou no canal`,
        value: `<#${user.channelId}> \`(${user.channelId})\``,
      });

      

    await client.guilds.cache.get(process.env.VOICE_LOG).channels.cache
      .get(process.env.VOICE_LOG_ENTRY)
      .send({ embeds: [embedEntry] })
      .catch(() => null);
  } else if (oldMember.channelId && !newMember.channelId) {
    const embedLeft = new MessageEmbed()
      .setColor('ff0000')
      .setTitle(`${userInfo.tag} - \`${userInfo.id}\``)
      .setFooter({ text: `${Moment(Date.now()).format('LLLL')}`, iconURL: userInfo.displayAvatarURL({ dynamic: true }) })
      .addFields({
        name: `Saiu do canal`,
        value: `<#${oldMember.channelId}> \`(${oldMember.channelId})\``,
      });

    await client.guilds.cache.get(process.env.VOICE_LOG).channels.cache
      .get(process.env.VOICE_LOG_LEFT)
      .send({ embeds: [embedLeft] })
      .catch(() => null);
  }

  if (isAvaliable(user)) {
    await User.updateOne(
      { _id: user.id },
      {
        $set: {
          'callInfo.callID': user.channelId,
          'callInfo.date': Date.now(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    if (!cache.has(user.id)) {
      cache.set(user.id, makeCache(user));
    }
  } else if (cache.has(user.id)) {
    const { interval, lastGive, joinedAt } = cache.get(user.id);
    clearInterval(interval);
    cache.delete(user.id);

    if (userData.callInfo.date) {

      await Promise.all([
        User.updateOne(
          { _id: user.id },
          {
            $push: {
              'callInfo.lastCalls': {
                callID: userData.callInfo.callID,
                dateEntry: userData.callInfo.date,
                dateLeft: Date.now(),
              },
            },
          },
          {
            upsert: true,
            new: true,
          }
        ),
        User.updateOne(
          { _id: user.id },
          {
            $set: {
              'callInfo.callID': null,
              'callInfo.date': 0,
            },
          },
          {
            upsert: true,
            new: true,
          }
        )
      ])
    }
    if (Date.now() - joinedAt < 60000) return;
    onMemberTimeUpdate(user, Date.now() - lastGive);
  }
});

function makeCache(member) {
  return {
    interval: setInterval(() => {
      cache.set(member.id, {
        ...cache.get(member.id),
        lastGive: Date.now(),
      });

      onMemberTimeUpdate(member, giveInterval);
    }, giveInterval),
    lastGive: Date.now(),
    joinedAt: Date.now(),
  };
}

/**
 * @param {GuildMember} member
 * @param {number} time
 */

async function onMemberTimeUpdate(member, time) {
  const fetchedData = (await User.findOne({ _id: member.id }))?.toObject();
  if (!fetchedData) {
    await User.create({ _id: member.id });
  }

  let updateEntity = {};

  //Adicionar o tempo da call no banco de dados.
  await User.updateOne(
    { _id: member.id },
    {
      ...updateEntity,
      $inc: {
        'callInfo.timeAll': time,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
}

/**
 * @param {GuildMember} member
 */
/** function isAvaliable(member) {
  return member.voice.channel && !member.selfMute && !member.selfDeaf && !ignoredChannels.includes(member.channelId);
} */

function isAvaliable(member) {
  return !ignoredChannels.includes(member.channelId) && member.channel;
}

module.exports.cache = cache;

client.start();

process.on('unhandledRejection', (error) => {
  console.log(error);
});
