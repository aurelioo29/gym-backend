"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("membership_plans", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      max_bookings_per_month: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      benefits: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("membership_plans", ["slug"], {
      unique: true,
    });

    await queryInterface.addIndex("membership_plans", ["is_active"]);
    await queryInterface.addIndex("membership_plans", ["price"]);
    await queryInterface.addIndex("membership_plans", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("membership_plans");
  },
};
