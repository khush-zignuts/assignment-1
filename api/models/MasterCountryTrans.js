const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCountry = require("./MasterCountry");

const MasterCountryTrans = sequelize.define(
  "MasterCountryTrans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    masterCountryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "master_country_id",
      references: {
        model: MasterCountry,
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
    tableName: "master_country_trans",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterCountryTrans;
