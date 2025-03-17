const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");

const MasterCountry = sequelize.define("master_country", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ...CommonFields, 
  },
  );

module.exports = MasterCountry;
