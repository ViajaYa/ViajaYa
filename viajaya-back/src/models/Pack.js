const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "pack",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      destino: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cupos:{
        type: DataTypes.INTEGER,  
        allowNull: true,
      },
      days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isYapaya: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      detail: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created: {
        type: DataTypes.STRING,
      },
      lat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lng: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fechas: {
        type: DataTypes.JSON, 
        allowNull: false,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        allowNull: false,
      },
      chars: {
        type: DataTypes.ARRAY(DataTypes.STRING),  
        defaultValue: [],
        allowNull: false,
      },
    },
    { timestamps: false }
  );
};
