const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");

const master_category = sequelize.define("master_category", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ...common_fields, 
  },
  {
    timestamps: true,  
});

module.exports = master_category;
