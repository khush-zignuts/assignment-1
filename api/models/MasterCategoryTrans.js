const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCategory = require("./MasterCategory");

const MasterCategoryTrans = sequelize.define(
  "master_category_trans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    master_category_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
      type:  DataTypes.STRING(10), // Storing language as an array ('en', 'de')
      allowNull: false,
    },
    ...CommonFields,
  },
  
);

module.exports = MasterCategoryTrans;
