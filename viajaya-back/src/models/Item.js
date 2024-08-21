const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('item', {
    id:{
      type: DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    inicio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fin:{
      type: DataTypes.STRING
    },
    comprado:{
        type: DataTypes.STRING,
    },
    reserva:{
      type: DataTypes.BOOLEAN,
    },
    person:{
        type: DataTypes.INTEGER,
    },
    referral_code: {
      type: DataTypes.UUID, // Usamos UUID para almacenar el código de referido
      allowNull: true, // Puede ser null si no hubo un referidor
    },
    userId: {
      type: DataTypes.INTEGER, // Relación con el id del Usuario
      allowNull: false,
    }

  },{timestamps:false});
};