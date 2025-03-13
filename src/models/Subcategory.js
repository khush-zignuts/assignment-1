const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Category = require("./Category");
const commonFields = require("./commonFields");

const Subcategory = sequelize.define("Subcategory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Category,
      key: "id"
    }
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

module.exports = Subcategory;
