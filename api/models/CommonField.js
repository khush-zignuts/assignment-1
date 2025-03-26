const { DataTypes } = require("sequelize");
const Sequelize = require("sequelize");

const CommonField = {
  createdAt: {
    type: DataTypes.BIGINT,
    feild: "created_at",
    allowNull: true,
    defaultValue: Math.floor(Date.now() / 1000),
  },
  createdBy: {
    type: DataTypes.UUID,
    feild: "created_by",
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    field: "is_deleted",
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    feild: "is_active",
    defaultValue: true,
  },
  updatedAt: {
    type: DataTypes.BIGINT,
    feild: "updated_at",
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    field: "updated_by",
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    feild: "deleted_at",
    allowNull: true,
  },
  deletedBy: {
    type: DataTypes.UUID,
    field: "deleted_by",
    allowNull: true,
  },
};

module.exports = CommonField;
