import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class ServiceSchedule extends Model<
  InferAttributes<ServiceSchedule>,
  InferCreationAttributes<ServiceSchedule>
> {
  declare id: CreationOptional<string>;

  declare serviceId: string;
  declare trainerId: string | null;
  declare title: string | null;

  declare startTime: Date;
  declare endTime: Date;

  declare capacity: CreationOptional<number>;
  declare bookedSlots: CreationOptional<number>;

  declare location: string | null;
  declare notes: string | null;

  declare isCancelled: CreationOptional<boolean>;
  declare cancelReason: string | null;

  declare createdBy: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    ServiceSchedule.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        serviceId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "service_id",
        },

        trainerId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "trainer_id",
        },

        title: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        startTime: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "start_time",
        },

        endTime: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "end_time",
        },

        capacity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },

        bookedSlots: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: "booked_slots",
        },

        location: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        isCancelled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "is_cancelled",
        },

        cancelReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "cancel_reason",
        },

        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "created_by",
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
        tableName: "service_schedules",
        modelName: "ServiceSchedule",
        underscored: true,
      },
    );

    return ServiceSchedule;
  }
}
