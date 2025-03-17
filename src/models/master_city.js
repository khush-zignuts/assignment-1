const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const common_fields = require("./common_fields");
const master_country = require("./master_country");

const master_city = sequelize.define("master_city", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: master_country,
      key: "id"
    }
  },
  ...common_fields, 
  },
  {
    timestamps: true,  
});

module.exports = master_city ;
