const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");

const MasterCategory = sequelize.define("master_category", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ...CommonFields, 
  },
  );

module.exports = MasterCategory;
