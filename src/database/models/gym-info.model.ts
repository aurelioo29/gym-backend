import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class GymInfo extends Model<
  InferAttributes<GymInfo>,
  InferCreationAttributes<GymInfo>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare tagline: string | null;
  declare description: string | null;
  declare email: string | null;
  declare phone: string | null;
  declare whatsapp: string | null;
  declare address: string | null;
  declare city: string | null;
  declare province: string | null;
  declare postalCode: string | null;
  declare latitude: string | null;
  declare longitude: string | null;
  declare logoUrl: string | null;
  declare faviconUrl: string | null;
  declare openingHours: object | null;
  declare instagramUrl: string | null;
  declare facebookUrl: string | null;
  declare tiktokUrl: string | null;
  declare youtubeUrl: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    GymInfo.init(
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
        tagline: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        whatsapp: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        province: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        postalCode: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "postal_code",
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: true,
        },
        longitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: true,
        },
        logoUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "logo_url",
        },
        faviconUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "favicon_url",
        },
        openingHours: {
          type: DataTypes.JSONB,
          allowNull: true,
          field: "opening_hours",
        },
        instagramUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "instagram_url",
        },
        facebookUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "facebook_url",
        },
        tiktokUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "tiktok_url",
        },
        youtubeUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "youtube_url",
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
        tableName: "gym_infos",
        modelName: "GymInfo",
        underscored: true,
      },
    );

    return GymInfo;
  }
}
