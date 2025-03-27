const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CommonFields = require("./CommonField");

const MasterCountry = sequelize.define(
  "MasterCountry",
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
    tableName: "master_country",
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = MasterCountry;
