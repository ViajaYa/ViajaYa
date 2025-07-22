module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  sequelize.define('passenger', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quote_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quotes',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    documento_identidad: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo_documento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha_nacimiento: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    titular: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
    // Puedes agregar más campos si lo necesitas
  }, {
    tableName: 'passengers',
    timestamps: false
  });
};