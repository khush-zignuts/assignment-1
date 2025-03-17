const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");

const master_category_trans = sequelize.define(
  "master_category_trans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    master_category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: master_category,
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

module.exports = master_category_trans;
