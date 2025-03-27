const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCategory = require("./MasterCategory");

const MasterSubcategory = sequelize.define(
  "MasterSubcategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "category_id",
      references: {
        model: MasterCategory,
        key: "id",
      },
    },
    ...CommonFields,
  },
  {
    tableName: "master_subcategory",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterSubcategory;
