const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonField = require("./CommonField");

const Admin = sequelize.define(
  "Admin",
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
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.TEXT,
      field: "access_token",
      allowNull: true,
    },
    ...CommonField,
  },
  {
    tableName: "admins",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = Admin;
