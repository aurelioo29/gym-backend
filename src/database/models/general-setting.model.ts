import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export type GeneralSettingType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

export class GeneralSetting extends Model<
  InferAttributes<GeneralSetting>,
  InferCreationAttributes<GeneralSetting>
> {
  declare id: CreationOptional<string>;
  declare key: string;
  declare value: string | null;
  declare type: GeneralSettingType;
  declare groupName: CreationOptional<string>;
  declare label: string | null;
  declare description: string | null;
  declare isPublic: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    GeneralSetting.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        value: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM("STRING", "NUMBER", "BOOLEAN", "JSON"),
          allowNull: false,
          defaultValue: "STRING",
        },
        groupName: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "general",
          field: "group_name",
        },
        label: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        isPublic: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "is_public",
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
        tableName: "general_settings",
        modelName: "GeneralSetting",
        underscored: true,
      },
    );

    return GeneralSetting;
  }
}
