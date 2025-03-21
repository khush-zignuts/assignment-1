const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCountry = require("./MasterCountry");

const MasterCountryTrans = sequelize.define("master_country_trans", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  master_country_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
});

module.exports = MasterCountryTrans;
