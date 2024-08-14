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
  },{timestamps:false});
};