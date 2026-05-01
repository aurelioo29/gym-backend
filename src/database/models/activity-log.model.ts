import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class ActivityLog extends Model<
  InferAttributes<ActivityLog>,
  InferCreationAttributes<ActivityLog>
> {
  declare id: CreationOptional<string>;
  declare userId: string | null;
  declare activity: string;
  declare description: string | null;
  declare metadata: object | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    ActivityLog.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "user_id",
        },
        activity: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "ip_address",
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "user_agent",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
      },
      {
        sequelize,
        tableName: "activity_logs",
        modelName: "ActivityLog",
        underscored: true,
        updatedAt: false,
      },
    );

    return ActivityLog;
  }
}
