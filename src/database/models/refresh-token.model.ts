import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class RefreshToken extends Model<
  InferAttributes<RefreshToken>,
  InferCreationAttributes<RefreshToken>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare isRevoked: CreationOptional<boolean>;
  declare ipAddress: string | null;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    RefreshToken.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "user_id",
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "expires_at",
        },
        isRevoked: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "is_revoked",
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
        tableName: "refresh_tokens",
        modelName: "RefreshToken",
        underscored: true,
        updatedAt: false,
      },
    );

    return RefreshToken;
  }
}
