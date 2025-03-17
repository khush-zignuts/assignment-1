const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonFields");
const MasterCategory = require("./MasterCategory");

const MasterSubcategory = sequelize.define("master_subcategory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MasterCategory,
      key: "id"
    }
  },
  ...CommonFields, 
  },
 );

module.exports = MasterSubcategory;
