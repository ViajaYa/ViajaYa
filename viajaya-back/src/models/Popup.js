
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('Popup', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
},
{timestamps:false});
};

