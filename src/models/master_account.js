const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");
const user = require("./user");

const master_account = sequelize.define(
  "master_account",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: user,
        key: "id",
      },
    },
    ...common_fields,
  },
  {
    timestamps: true,
  }
);

module.exports = master_account;

