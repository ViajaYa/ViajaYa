const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  sequelize.define('promo', {
    id:{
      type: DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    days:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fechas:{
      type: DataTypes.ARRAY(DataTypes.STRING)
    },
    details:{
        type: DataTypes.TEXT,
    },
  },{timestamps:false});
};
