import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class MembershipPlan extends Model<
  InferAttributes<MembershipPlan>,
  InferCreationAttributes<MembershipPlan>
> {
  declare id: CreationOptional<string>;

  declare name: string;
  declare slug: string;
  declare description: string | null;

  declare price: string;
  declare durationDays: number;
  declare maxBookingsPerMonth: number | null;
  declare benefits: string[] | null;

  declare isActive: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    MembershipPlan.init(
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

        price: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },

        durationDays: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "duration_days",
        },

        maxBookingsPerMonth: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "max_bookings_per_month",
        },

        benefits: {
          type: DataTypes.JSONB,
          allowNull: true,
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
        tableName: "membership_plans",
        modelName: "MembershipPlan",
        underscored: true,
      },
    );

    return MembershipPlan;
  }
}
