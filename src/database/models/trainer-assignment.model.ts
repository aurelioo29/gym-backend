import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class TrainerAssignment extends Model<
  InferAttributes<TrainerAssignment>,
  InferCreationAttributes<TrainerAssignment>
> {
  declare id: CreationOptional<string>;

  declare customerId: string;
  declare trainerId: string;
  declare assignedBy: string;

  declare startDate: Date;
  declare endDate: Date | null;
  declare isActive: CreationOptional<boolean>;
  declare notes: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    TrainerAssignment.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        customerId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "customer_id",
        },

        trainerId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "trainer_id",
        },

        assignedBy: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "assigned_by",
        },

        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "start_date",
        },

        endDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "end_date",
        },

        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: "is_active",
        },

        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },

        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "updated_at",
        },
      },
      {
        sequelize,
        tableName: "trainer_assignments",
        modelName: "TrainerAssignment",
        underscored: true,
      },
    );

    return TrainerAssignment;
  }
}
