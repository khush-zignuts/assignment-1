const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const commonFields = require("./commonFields");

const Category = sequelize.define("Category", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name_de: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  ...commonFields, 
  },
  {
    timestamps: true,  
});

module.exports = Category;
