import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export type MemberMembershipStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED";

export type MembershipPaymentStatus = "UNPAID" | "PAID" | "CANCELLED";

export type MembershipPaymentMethod = "OFFLINE_CASH" | "OFFLINE_TRANSFER";

export class MemberMembership extends Model<
  InferAttributes<MemberMembership>,
  InferCreationAttributes<MemberMembership>
> {
  declare id: CreationOptional<string>;

  declare userId: string;
  declare membershipPlanId: string;

  declare startDate: Date;
  declare endDate: Date;

  declare status: CreationOptional<MemberMembershipStatus>;
  declare paymentStatus: CreationOptional<MembershipPaymentStatus>;
  declare paymentMethod: CreationOptional<MembershipPaymentMethod>;

  declare paidAmount: CreationOptional<string>;
  declare paymentReference: string | null;
  declare notes: string | null;

  declare createdBy: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    MemberMembership.init(
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

        membershipPlanId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "membership_plan_id",
        },

        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "start_date",
        },

        endDate: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "end_date",
        },

        status: {
          type: DataTypes.ENUM("PENDING", "ACTIVE", "EXPIRED", "CANCELLED"),
          allowNull: false,
          defaultValue: "ACTIVE",
        },

        paymentStatus: {
          type: DataTypes.ENUM("UNPAID", "PAID", "CANCELLED"),
          allowNull: false,
          defaultValue: "PAID",
          field: "payment_status",
        },

        paymentMethod: {
          type: DataTypes.ENUM("OFFLINE_CASH", "OFFLINE_TRANSFER"),
          allowNull: false,
          defaultValue: "OFFLINE_CASH",
          field: "payment_method",
        },

        paidAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
          field: "paid_amount",
        },

        paymentReference: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "payment_reference",
        },

        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
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
        tableName: "member_memberships",
        modelName: "MemberMembership",
        underscored: true,
      },
    );

    return MemberMembership;
  }
}
