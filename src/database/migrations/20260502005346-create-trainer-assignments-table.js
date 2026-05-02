"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("trainer_assignments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      trainer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      assigned_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
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
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex("trainer_assignments", ["customer_id"]);
    await queryInterface.addIndex("trainer_assignments", ["trainer_id"]);
    await queryInterface.addIndex("trainer_assignments", ["assigned_by"]);
    await queryInterface.addIndex("trainer_assignments", ["is_active"]);
    await queryInterface.addIndex("trainer_assignments", ["start_date"]);
    await queryInterface.addIndex("trainer_assignments", ["end_date"]);

    await queryInterface.addIndex(
      "trainer_assignments",
      ["customer_id", "trainer_id", "is_active"],
      {
        name: "idx_trainer_assignments_customer_trainer_active",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("trainer_assignments");
  },
};
