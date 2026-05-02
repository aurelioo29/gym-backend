import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export type PushNotificationTargetType =
  | "ALL"
  | "CUSTOMER"
  | "TRAINER"
  | "SPECIFIC_USER";

export type PushNotificationStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "CANCELLED";

export class PushNotification extends Model<
  InferAttributes<PushNotification>,
  InferCreationAttributes<PushNotification>
> {
  declare id: CreationOptional<string>;

  declare userId: string | null;
  declare serviceId: string | null;

  declare imageUrl: string | null;
  declare title: string;
  declare description: string | null;

  declare targetType: CreationOptional<PushNotificationTargetType>;
  declare status: CreationOptional<PushNotificationStatus>;

  declare scheduledAt: Date | null;
  declare publishedAt: Date | null;

  declare createdBy: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    PushNotification.init(
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

        serviceId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "service_id",
        },

        imageUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "image_url",
        },

        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        targetType: {
          type: DataTypes.ENUM("ALL", "CUSTOMER", "TRAINER", "SPECIFIC_USER"),
          allowNull: false,
          defaultValue: "ALL",
          field: "target_type",
        },

        status: {
          type: DataTypes.ENUM("DRAFT", "SCHEDULED", "PUBLISHED", "CANCELLED"),
          allowNull: false,
          defaultValue: "DRAFT",
        },

        scheduledAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "scheduled_at",
        },

        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "published_at",
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
        tableName: "push_notifications",
        modelName: "PushNotification",
        underscored: true,
      },
    );

    return PushNotification;
  }
}
