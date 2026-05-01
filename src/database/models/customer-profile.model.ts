import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export class CustomerProfile extends Model<
  InferAttributes<CustomerProfile>,
  InferCreationAttributes<CustomerProfile>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare birthDate: Date | null;
  declare gender: Gender | null;
  declare heightCm: number | null;
  declare weightKg: number | null;
  declare emergencyContactName: string | null;
  declare emergencyContactPhone: string | null;
  declare healthNotes: string | null;
  declare fitnessGoals: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    CustomerProfile.init(
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
        birthDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          field: "birth_date",
        },
        gender: {
          type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
          allowNull: true,
        },
        heightCm: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "height_cm",
        },
        weightKg: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "weight_kg",
        },
        emergencyContactName: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "emergency_contact_name",
        },
        emergencyContactPhone: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "emergency_contact_phone",
        },
        healthNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "health_notes",
        },
        fitnessGoals: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "fitness_goals",
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
        tableName: "customer_profiles",
        modelName: "CustomerProfile",
        underscored: true,
      },
    );

    return CustomerProfile;
  }
}
