const { ClientEvents } = require('discord.js');
const Bot = require('../client/Bot');

/**
 * @typedef EventOptions
 * @prop {keyof ClientEvents} event
 */

module.exports = class Event {
  /**
   * @param {Bot} client
   * @param {EventOptions} options
   */
  constructor(client, options) {
    if (!options.event) {
      throw new Error('No event provided');
    }

    /**
     * @type {Bot}
     */
    this.client = client;

    /**
     * The provided events
     * @type {keyof ClientEvents}
     */
    this.event = options.event;
  }

  /**
   * The function to be execute when the event is triggered
   * @abstract
   */
  execute() {}
};
