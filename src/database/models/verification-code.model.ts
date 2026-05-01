import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export type VerificationCodeType = "EMAIL_VERIFICATION" | "FORGOT_PASSWORD";

export class VerificationCode extends Model<
  InferAttributes<VerificationCode>,
  InferCreationAttributes<VerificationCode>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare email: string;
  declare code: string;
  declare type: VerificationCodeType;
  declare expiresAt: Date;
  declare verifiedAt: Date | null;
  declare attempts: CreationOptional<number>;
  declare lastSentAt: Date | null;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    VerificationCode.init(
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
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM("EMAIL_VERIFICATION", "FORGOT_PASSWORD"),
          allowNull: false,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "expires_at",
        },
        verifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "verified_at",
        },
        attempts: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        lastSentAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "last_sent_at",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
      },
      {
        sequelize,
        tableName: "verification_codes",
        modelName: "VerificationCode",
        underscored: true,
        updatedAt: false,
      },
    );

    return VerificationCode;
  }
}
