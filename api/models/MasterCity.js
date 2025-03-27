const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCountry = require("./MasterCountry");

const MasterCity = sequelize.define(
  "MasterCity",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    countryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "country_id",
      references: {
        model: MasterCountry,
        key: "id",
      },
    },
    ...CommonFields,
  },
  {
    tableName: "master_city",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterCity;
