const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import DB connection
const CommonFields = require("./CommonField");
const MasterCountry = require("./MasterCountry");
const MasterCity = require("./MasterCity");

const User = sequelize.define(
  "user",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
    countryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "country_id",
      references: {
        model: MasterCountry,
        key: "id",
      },
    },
    cityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "city_id",
      references: {
        model: MasterCity,
        key: "id",
      },
    },
    companyName: {
      type: DataTypes.STRING(64),
      allowNull: true,
      required: false,
      field: "company_name",
    },
    accessToken: {
      type: DataTypes.TEXT,
      field: "access_token",
      allowNull: true,
    },
    ...CommonFields,
  },
  {
    tableName: "user",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = User;
