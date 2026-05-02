import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export type BookingStatus = "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export class Booking extends Model<
  InferAttributes<Booking>,
  InferCreationAttributes<Booking>
> {
  declare id: CreationOptional<string>;

  declare userId: string;
  declare serviceScheduleId: string;

  declare status: CreationOptional<BookingStatus>;
  declare amountPaid: CreationOptional<string>;
  declare paymentReference: string | null;
  declare notes: string | null;

  declare bookedAt: CreationOptional<Date>;

  declare cancelledBy: string | null;
  declare cancelReason: string | null;
  declare cancelledAt: Date | null;

  declare createdBy: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    Booking.init(
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

        serviceScheduleId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "service_schedule_id",
        },

        status: {
          type: DataTypes.ENUM("BOOKED", "COMPLETED", "CANCELLED", "NO_SHOW"),
          allowNull: false,
          defaultValue: "BOOKED",
        },

        amountPaid: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
          field: "amount_paid",
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

        bookedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "booked_at",
        },

        cancelledBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "cancelled_by",
        },

        cancelReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "cancel_reason",
        },

        cancelledAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "cancelled_at",
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
        tableName: "bookings",
        modelName: "Booking",
        underscored: true,
      },
    );

    return Booking;
  }
}
