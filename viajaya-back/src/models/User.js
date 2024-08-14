const { DataTypes } = require('sequelize');
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
    }
  },{timestamps:false});
};
