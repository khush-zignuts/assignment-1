const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");
const MasterCategory = require("./MasterCategory");

const MasterSubcategory = sequelize.define("master_subcategory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MasterCategory,
      key: "id",
    },
  },
  ...CommonFields,
});

module.exports = MasterSubcategory;
