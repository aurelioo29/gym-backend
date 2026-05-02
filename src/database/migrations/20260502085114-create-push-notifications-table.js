"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("push_notifications", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      service_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      image_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      target_type: {
        type: Sequelize.ENUM("ALL", "CUSTOMER", "TRAINER", "SPECIFIC_USER"),
        allowNull: false,
        defaultValue: "ALL",
      },

      status: {
        type: Sequelize.ENUM("DRAFT", "SCHEDULED", "PUBLISHED", "CANCELLED"),
        allowNull: false,
        defaultValue: "DRAFT",
      },

      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      published_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("push_notifications", ["user_id"]);
    await queryInterface.addIndex("push_notifications", ["service_id"]);
    await queryInterface.addIndex("push_notifications", ["created_by"]);
    await queryInterface.addIndex("push_notifications", ["target_type"]);
    await queryInterface.addIndex("push_notifications", ["status"]);
    await queryInterface.addIndex("push_notifications", ["scheduled_at"]);
    await queryInterface.addIndex("push_notifications", ["published_at"]);
    await queryInterface.addIndex("push_notifications", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("push_notifications");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_push_notifications_target_type";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_push_notifications_status";',
    );
  },
};
