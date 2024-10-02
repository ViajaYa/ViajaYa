
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('Popup', {

    title:{
      type: DataTypes.STRING,
      allowNull: false,
    },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  boton: {
    type: DataTypes.STRING,
    allowNull: false,
  },


  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
},
{timestamps:false});
};

