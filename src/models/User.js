const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import DB connection
const CommonFields = require("./CommonField");
const validator = require("validator");
const MasterCountry = require("./MasterCountry");
const MasterCity = require("./MasterCity");

const User = sequelize.define(
  "user",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        len: {
          args: [1, 30],
          msg: "Name must be between 1 and 30 characters long.",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [8, 16],
          msg: "Password must be between 8-16 characters.",
        },
        isStrong(value) {
          if (
            !validator.isStrongPassword(value, {
              minLength: 8,
              minUppercase: 1,
              minNumbers: 1,
              minSymbols: 1,
            })
          ){
            throw new Error(
              "Password must have at least one uppercase letter, one number, and one special character."
            );
          }
        },
      },
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
      validate: {
        len: {
          args: [0, 64],
          msg: "Company name can have a maximum of 64 characters.",
        },
      },
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ...CommonFields,
  },

);

module.exports = User;
