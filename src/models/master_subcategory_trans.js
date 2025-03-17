const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");
const master_subcategory = require("./master_subcategory");

const master_subcategory_trans = sequelize.define(
  "master_subcategory_trans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    master_subcategory_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: master_subcategory,
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

module.exports = master_subcategory_trans;
