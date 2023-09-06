const GroupJson = require("../../groups.json");

module.exports = {
  /**
   * @param {string} groupId
   */
  getGroupId(groupId) {
    return this.allItems().find((group) => group.groupID === groupId);
  }, 

  allItems() {
    return Object.values(GroupJson).flat();
  }, 
};
