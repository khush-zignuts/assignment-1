
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");
const master_country = require("./master_country");

const master_country_trans = sequelize.define(
  "master_country_trans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    master_country_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: master_country,
        key: "id",
      },
    },
    translations: {
      type: DataTypes.JSONB, // Store both name & lang as JSON
      allowNull: false,
    },
    ...common_fields,
  },
  {
    timestamps: true,
  }
);

module.exports = master_country_trans;
