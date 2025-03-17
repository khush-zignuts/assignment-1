
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");
const master_city = require("./master_city");

const master_city_trans = sequelize.define(
  "master_city_trans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    master_city_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: master_city,
          key: "id",
        },
      },
      name : {
        type: DataTypes.STRING(255),// Store both name & lang as JSON
        allowNull: false,
      },
      value : {
        type: DataTypes.STRING(12), // Store both name & lang as JSON
        allowNull: false,
      },
    ...common_fields,
  },
  {
    timestamps: true,
  }
);

module.exports = master_city_trans;
