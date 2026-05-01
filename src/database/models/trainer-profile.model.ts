import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export type TrainerApprovalStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export class TrainerProfile extends Model<
  InferAttributes<TrainerProfile>,
  InferCreationAttributes<TrainerProfile>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare bio: string | null;
  declare specialization: string | null;
  declare certification: string | null;
  declare certificateUrl: string | null;
  declare experienceYears: CreationOptional<number>;
  declare hourlyRate: CreationOptional<string>;
  declare approvalStatus: CreationOptional<TrainerApprovalStatus>;
  declare approvedBy: string | null;
  declare approvedAt: Date | null;
  declare rejectedReason: string | null;
  declare isAvailable: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    TrainerProfile.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          field: "user_id",
        },
        bio: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        specialization: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        certification: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        certificateUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "certificate_url",
        },
        experienceYears: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
          field: "experience_years",
        },
        hourlyRate: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
          defaultValue: 0,
          field: "hourly_rate",
        },
        approvalStatus: {
          type: DataTypes.ENUM("PENDING", "SUBMITTED", "APPROVED", "REJECTED"),
          allowNull: false,
          defaultValue: "PENDING",
          field: "approval_status",
        },
        approvedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "approved_by",
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "approved_at",
        },
        rejectedReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "rejected_reason",
        },
        isAvailable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "is_available",
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
        tableName: "trainer_profiles",
        modelName: "TrainerProfile",
        underscored: true,
      },
    );

    return TrainerProfile;
  }
}
