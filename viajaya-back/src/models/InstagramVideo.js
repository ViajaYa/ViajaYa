const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('instagramVideo', {
    url: {
        type: DataTypes.STRING,
        allowNull: false,
       
      },
  },{timestamps:false});
};