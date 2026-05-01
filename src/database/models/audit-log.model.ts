import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  declare id: CreationOptional<string>;
  declare userId: string | null;
  declare action: string;
  declare resourceType: string;
  declare resourceId: string | null;
  declare oldData: object | null;
  declare newData: object | null;
  declare ipAddress: string | null;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    AuditLog.init(
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
        action: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        resourceType: {
          type: DataTypes.STRING,
          allowNull: false,
          field: "resource_type",
        },
        resourceId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "resource_id",
        },
        oldData: {
          type: DataTypes.JSONB,
          allowNull: true,
          field: "old_data",
        },
        newData: {
          type: DataTypes.JSONB,
          allowNull: true,
          field: "new_data",
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "ip_address",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
      },
      {
        sequelize,
        tableName: "audit_logs",
        modelName: "AuditLog",
        underscored: true,
        updatedAt: false,
      },
    );

    return AuditLog;
  }
}
