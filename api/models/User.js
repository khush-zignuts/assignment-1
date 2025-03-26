const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import DB connection
const CommonFields = require("./CommonField");
const validator = require("validator");
const MasterCountry = require("./MasterCountry");
const MasterCity = require("./MasterCity");

const User = sequelize.define("user", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  country_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MasterCountry,
      key: "id",
    },
  },
  city_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MasterCity,
      key: "id",
    },
  },
  companyName: {
    type: DataTypes.STRING(64),
    allowNull: true,
    required: false,
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ...CommonFields,
});

module.exports = User;
