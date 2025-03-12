const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Category = require("./Category");
const Subcategory = require("./Subcategory");

const Account = sequelize.define("Account", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "id"
    }
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name_de: {
    type: DataTypes.STRING,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Category,
      key: "id"
    }
  },
  subcategoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Subcategory,
      key: "id"
    }
  },
  description: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
});

module.exports = Account;
