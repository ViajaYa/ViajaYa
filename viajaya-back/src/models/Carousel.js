const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('Carousel', {
    src: {
        type: DataTypes.STRING,
        allowNull: false, // URL de la imagen en Cloudinary
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false, // Título del destino
      },
      description: {
        type: DataTypes.TEXT, // Descripción del destino
        allowNull: true,
      },
      destino:{
        type: DataTypes.TEXT, // Descripción del destino
        allowNull: true,
      }
  },{timestamps:false});
};