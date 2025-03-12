const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Country = require("./Country");

const City = sequelize.define("City", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Country,
      key: "id"
    }
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name_de: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = City;
