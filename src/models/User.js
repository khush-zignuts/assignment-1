const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");// Import DB connection
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
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
          // isStrong(value) {
          //     if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(value)) {
          //         throw new Error("Password must have at least one uppercase letter, one number, and one special character.");
          //     }
          // },
      },
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
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
  },
  
);


module.exports = User;
 
