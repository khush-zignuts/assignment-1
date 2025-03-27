const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterSubcategory = require("./MasterSubcategory");

const MasterSubcategoryTrans = sequelize.define(
  "MasterSubcategoryTrans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    masterSubcategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "master_subcategory_id",
      references: {
        model: MasterSubcategory,
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
    tableName: "master_subcategory_trans",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterSubcategoryTrans;
