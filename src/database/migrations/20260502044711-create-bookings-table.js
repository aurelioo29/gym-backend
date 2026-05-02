"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bookings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      service_schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "service_schedules",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      status: {
        type: Sequelize.ENUM("BOOKED", "COMPLETED", "CANCELLED", "NO_SHOW"),
        allowNull: false,
        defaultValue: "BOOKED",
      },

      amount_paid: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      payment_reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      booked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      cancelled_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      cancel_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      cancelled_at: {
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

    await queryInterface.addIndex("bookings", ["user_id"]);
    await queryInterface.addIndex("bookings", ["service_schedule_id"]);
    await queryInterface.addIndex("bookings", ["status"]);
    await queryInterface.addIndex("bookings", ["booked_at"]);
    await queryInterface.addIndex("bookings", ["cancelled_by"]);
    await queryInterface.addIndex("bookings", ["created_by"]);

    await queryInterface.addIndex(
      "bookings",
      ["user_id", "service_schedule_id"],
      {
        name: "idx_bookings_user_schedule",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bookings");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_bookings_status";',
    );
  },
};
