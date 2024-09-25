const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('InstagramVideo', {
    url: {
        type: DataTypes.STRING,
        allowNull: false,
       
      },
  },{timestamps:false});
};