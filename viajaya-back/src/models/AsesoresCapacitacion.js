const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('AsesoresCapacitacion', {
    url: {
        type: DataTypes.STRING,
        allowNull: false,
       
      },
  },{timestamps:false});
};