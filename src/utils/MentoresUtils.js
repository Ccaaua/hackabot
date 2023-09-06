const MentorJson = require("../../mentores.json");


module.exports = {
  /**
   * @param {string} mentorId
   */
  getMentorPosition(mentorId) {
    return this.allItems().find((monitor) => monitor.position === mentorId);
  }, 

  getMentorId(mentorId) {
    return this.allItems().find((monitor) => monitor.mentorID === mentorId);
  }, 

  allItems() {
    return Object.values(MentorJson).flat();
  }, 
};
