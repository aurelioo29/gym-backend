"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("users", ["phone"], {
      unique: true,
      name: "users_phone_unique",
      where: {
        phone: {
          [queryInterface.sequelize.Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("users", "users_phone_unique");
  },
};
