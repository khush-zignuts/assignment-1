const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");
const master_category = require("./master_category");

const master_subcategory = sequelize.define("master_subcategory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: master_category,
      key: "id"
    }
  },
  ...common_fields, 
  },
  {
    timestamps: true,  
});

module.exports = master_subcategory;
