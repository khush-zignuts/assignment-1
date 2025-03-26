const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCountry = require("./MasterCountry");

const MasterCity = sequelize.define("master_city", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MasterCountry,
      key: "id",
    },
  },
  ...CommonFields,
});

module.exports = MasterCity;
