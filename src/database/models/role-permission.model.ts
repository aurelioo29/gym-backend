import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class RolePermission extends Model<
  InferAttributes<RolePermission>,
  InferCreationAttributes<RolePermission>
> {
  declare id: CreationOptional<string>;
  declare roleId: string;
  declare permissionId: string;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    RolePermission.init(
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
        permissionId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "permission_id",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
      },
      {
        sequelize,
        tableName: "role_permissions",
        modelName: "RolePermission",
        underscored: true,
        updatedAt: false,
      },
    );

    return RolePermission;
  }
}
