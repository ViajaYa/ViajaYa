const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('number', {
  value: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  selected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

},{timestamps:false});
};


