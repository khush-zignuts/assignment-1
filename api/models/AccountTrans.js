const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const Account = require("./Account");

const AccountTrans = sequelize.define(
  "AccountTrans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "account_id",
      references: {
        model: Account,
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
  },
  {
    tableName: "account_trans",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = AccountTrans;
