const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('user', {
    id:{
      type: DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image:{
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "https://cdn.landesa.org/wp-content/uploads/default-user-image.png"
    },
    email:{
      type: DataTypes.STRING,
    },
    phone:{
        type: DataTypes.STRING,
    },
    password:{
        type: DataTypes.STRING,
    },
    role:{
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    referral_code: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Genera un UUID automáticamente
      unique: true,
      allowNull: false,
    },
    referred_by: {
      type: DataTypes.UUID,
      allowNull: true, //// Código de referido del usuario que lo refirió
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Puntos que el usuario ha acumulado
    }
  },{timestamps:false});
};
