"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("services", {
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

      service_type: {
        type: Sequelize.ENUM("CLASS", "PERSONAL_TRAINING", "FACILITY", "OTHER"),
        allowNull: false,
        defaultValue: "CLASS",
      },

      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60,
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      image_url: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex("services", ["slug"], {
      unique: true,
    });

    await queryInterface.addIndex("services", ["service_type"]);
    await queryInterface.addIndex("services", ["is_active"]);
    await queryInterface.addIndex("services", ["price"]);
    await queryInterface.addIndex("services", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("services");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_services_service_type";',
    );
  },
};
