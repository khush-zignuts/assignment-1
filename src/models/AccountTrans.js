const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const Account = require("./Account");

const AccountTrans = sequelize.define(
  "account_trans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    Account_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
      type:  DataTypes.STRING(10), // Storing language as an array ('en', 'de')
      allowNull: false,
    },
    
    ...CommonFields,
  }
);

module.exports = AccountTrans;
