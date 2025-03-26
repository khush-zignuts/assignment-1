// npm init -y
// npm install express
// npm install sequelize mysql2  # For MySQL
// npm install sequelize pg pg-hstore  # For PostgreSQL
// npm install jsonwebtoken
// npm install cors
// npm install dotenv
// npm install express-validator
// npx nodemon server.js

// npm install express sequelize pg pg-hstore bcrypt jsonwebtoken dotenv i18next i18next-fs-backend i18next-http-middleware cors body-parser

// #Bhavnagar
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
      feild: "city_id",
      references: {
        model: MasterCity,
        key: "id",
      },
    },
    companyName: {
      type: DataTypes.STRING(64),
      allowNull: true,
      required: false,
      feild: "company_name",
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ...CommonFields,
  },
  {
    tableName: "users",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = User;
