const { DataTypes } = require("sequelize");
const Sequelize = require("sequelize");

const CommonField = {
  createdAt: {
    type: DataTypes.BIGINT,
    field: "created_at",
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    field: "created_by",
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    field: "is_deleted",
    field: "is_deleted",
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: "is_active",
    defaultValue: true,
  },
  updatedAt: {
    type: DataTypes.BIGINT,
    field: "updated_at",
    allowNull: true,
  },

  updatedBy: {
    type: DataTypes.UUID,
    field: "updated_by",
    allowNull: true,
  },

  deletedAt: {
    type: DataTypes.DATE,
    field: "deleted_at",
    allowNull: true,
  },
  deletedBy: {
    type: DataTypes.UUID,
    field: "deleted_by",
    deletedBy: {
      type: DataTypes.UUID,
      field: "deleted_by",
      allowNull: true,
    },
  },
};

module.exports = CommonField;
