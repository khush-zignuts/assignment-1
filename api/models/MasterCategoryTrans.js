const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCategory = require("./MasterCategory");

const MasterCategoryTrans = sequelize.define(
  "MasterCategoryTrans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    masterCategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "master_category_id",
      references: {
        model: MasterCategory,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(128), // Storing name as an array
      allowNull: false,
    },
    lang: {
      type: DataTypes.STRING(10), // Storing language as an array ('en', 'de')
      allowNull: false,
    },
    ...CommonFields,
  },
  {
    tableName: "master_category_trans",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterCategoryTrans;
