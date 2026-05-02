"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("service_schedules", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      trainer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      booked_slots: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      is_cancelled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      cancel_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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

    await queryInterface.addIndex("service_schedules", ["service_id"]);
    await queryInterface.addIndex("service_schedules", ["trainer_id"]);
    await queryInterface.addIndex("service_schedules", ["created_by"]);
    await queryInterface.addIndex("service_schedules", ["start_time"]);
    await queryInterface.addIndex("service_schedules", ["end_time"]);
    await queryInterface.addIndex("service_schedules", ["is_cancelled"]);

    await queryInterface.addIndex(
      "service_schedules",
      ["service_id", "start_time"],
      {
        name: "idx_service_schedules_service_start",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("service_schedules");
  },
};
