const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCity = require("./MasterCity");

const MasterCityTrans = sequelize.define(
  "MasterCityTrans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    masterCityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "master_city_id",
      references: {
        model: MasterCity,
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
    tableName: "master_city_trans",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterCityTrans;
