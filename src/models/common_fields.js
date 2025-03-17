const { DataTypes } = require("sequelize");
const Sequelize  = require("sequelize");

const common_fields = {
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deleted_by: {
    type: DataTypes.UUID,
    allowNull: true,
    defaultValue: Sequelize.NOW, 
  },
  
};

module.exports = common_fields;
