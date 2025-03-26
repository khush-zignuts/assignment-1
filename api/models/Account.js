const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const user = require("./User");
const MasterCategory = require("./MasterCategory");
const MasterSubcategory = require("./MasterSubcategory");

const Account = sequelize.define(
  "account",
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: MasterCategory,
        key: "id",
      },
    },
    subcategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: MasterSubcategory,
        key: "id",
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ...CommonFields,
  }
);

module.exports = Account;
