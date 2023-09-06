require('dotenv').config();

const { ShardingManager } = require('discord.js');

const manager = new ShardingManager('src/app.js', {
  respawn: true,
  totalShards: 'auto',
});

manager.on('shardCreate', (shard) => {
  console.log(`Initializing shard [${shard.id}]...`);

  shard.on('ready', () => console.log(`Shard [${shard.id}] is ready!`));
  shard.on('error', (err) => console.error(`Shard [${shard.id}] error: ${err}`));
});

manager.spawn({ amount: 'auto', delay: 5500, timeout: 30000 }).catch(e => console.log(e))


