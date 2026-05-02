"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("member_memberships", {
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

      membership_plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "membership_plans",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("PENDING", "ACTIVE", "EXPIRED", "CANCELLED"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },

      payment_status: {
        type: Sequelize.ENUM("UNPAID", "PAID", "CANCELLED"),
        allowNull: false,
        defaultValue: "PAID",
      },

      payment_method: {
        type: Sequelize.ENUM("OFFLINE_CASH", "OFFLINE_TRANSFER"),
        allowNull: false,
        defaultValue: "OFFLINE_CASH",
      },

      paid_amount: {
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

    await queryInterface.addIndex("member_memberships", ["user_id"]);
    await queryInterface.addIndex("member_memberships", ["membership_plan_id"]);
    await queryInterface.addIndex("member_memberships", ["created_by"]);
    await queryInterface.addIndex("member_memberships", ["status"]);
    await queryInterface.addIndex("member_memberships", ["payment_status"]);
    await queryInterface.addIndex("member_memberships", ["payment_method"]);
    await queryInterface.addIndex("member_memberships", ["start_date"]);
    await queryInterface.addIndex("member_memberships", ["end_date"]);
    await queryInterface.addIndex("member_memberships", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("member_memberships");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_member_memberships_status";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_member_memberships_payment_status";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_member_memberships_payment_method";',
    );
  },
};
