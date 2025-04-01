const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const user = require("./User");
const MasterCategory = require("./MasterCategory");
const MasterSubcategory = require("./MasterSubcategory");

const Account = sequelize.define(
  "Account",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: user,
        key: "id",
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "category_id",
      references: {
        model: MasterCategory,
        key: "id",
      },
    },
    subCategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "subcategory_id",
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
  },
  {
    tableName: "account",
    freezeTableName: true,
    timestamps: false,
  },
  {
    tableName: "accounts",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = Account;
