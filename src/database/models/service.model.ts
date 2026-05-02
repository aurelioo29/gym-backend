import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export type ServiceType = "CLASS" | "PERSONAL_TRAINING" | "FACILITY" | "OTHER";

export class Service extends Model<
  InferAttributes<Service>,
  InferCreationAttributes<Service>
> {
  declare id: CreationOptional<string>;

  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare serviceType: CreationOptional<ServiceType>;
  declare price: CreationOptional<string>;
  declare durationMinutes: CreationOptional<number>;
  declare capacity: number | null;
  declare imageUrl: string | null;
  declare isActive: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    Service.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        serviceType: {
          type: DataTypes.ENUM(
            "CLASS",
            "PERSONAL_TRAINING",
            "FACILITY",
            "OTHER",
          ),
          allowNull: false,
          defaultValue: "CLASS",
          field: "service_type",
        },

        price: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },

        durationMinutes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 60,
          field: "duration_minutes",
        },

        capacity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        imageUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "image_url",
        },

        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: "is_active",
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
        tableName: "services",
        modelName: "Service",
        underscored: true,
      },
    );

    return Service;
  }
}
