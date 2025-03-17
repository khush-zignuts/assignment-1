const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");
const master_account = require("./master_account");
const master_category = require("./master_category");
const master_subcategory = require("./master_Subcategory");

const master_account_trans = sequelize.define(
  "master_account_trans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    master_account_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: master_account,
        key: "id",
      },
    },
    translations: {
      type: DataTypes.JSONB, // Store both name & lang as JSON
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: master_category,
        key: "id",
      },
    },
    subcategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: master_subcategory,
        key: "id",
      },
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ...common_fields,
  },
  {
    timestamps: true,
  }
);

module.exports = master_account_trans;
