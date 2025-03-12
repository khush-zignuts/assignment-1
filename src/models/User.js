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
    },
    // role: {
    //   type: DataTypes.ENUM("admin", "user"),
    //   allowNull: false,
    //   defaultValue: "user",
    // },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // companyName: {
    //   type: DataTypes.STRING(64),
    //   allowNull: true,
    // },
  },
  
);

module.exports = User;

// {
//     hooks: {
//       beforeCreate: async (user) => {
//         user.password = await bcrypt.hash(user.password, 10);
//       }
//     }
//   }
