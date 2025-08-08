const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('asesoresCapacitacion', {
    url: {
        type: DataTypes.STRING,
        allowNull: false,
       
      },
  },{timestamps:false});
};