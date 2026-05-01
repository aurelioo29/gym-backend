import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare roleId: string;
  declare email: string;
  declare passwordHash: string;
  declare fullName: string;
  declare phone: string | null;
  declare avatarUrl: string | null;
  declare isActive: CreationOptional<boolean>;
  declare emailVerifiedAt: Date | null;
  declare lastLoginAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        roleId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "role_id",
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        passwordHash: {
          type: DataTypes.STRING,
          allowNull: false,
          field: "password_hash",
        },
        fullName: {
          type: DataTypes.STRING,
          allowNull: false,
          field: "full_name",
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        avatarUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "avatar_url",
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "is_active",
        },
        emailVerifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "email_verified_at",
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "last_login_at",
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
        tableName: "users",
        modelName: "User",
        underscored: true,
      },
    );

    return User;
  }
}
