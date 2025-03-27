const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");

const MasterCategory = sequelize.define(
  "MasterCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    ...CommonFields,
  },
  {
    tableName: "master_category",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterCategory;
