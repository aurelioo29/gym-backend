import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<string>;

  declare recipientUserId: string;
  declare actorUserId: string | null;

  declare type: string;
  declare title: string;
  declare message: string | null;
  declare data: Record<string, unknown> | null;

  declare isRead: CreationOptional<boolean>;
  declare readAt: Date | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    Notification.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        recipientUserId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "recipient_user_id",
        },

        actorUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "actor_user_id",
        },

        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        data: {
          type: DataTypes.JSONB,
          allowNull: true,
        },

        isRead: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "is_read",
        },

        readAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "read_at",
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
        tableName: "notifications",
        modelName: "Notification",
        underscored: true,
      },
    );

    return Notification;
  }
}
