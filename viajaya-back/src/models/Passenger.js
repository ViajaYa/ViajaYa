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
      allowNull: true, // ✅ PERMITIR NULL para pasajeros no titulares que completarán después
    },
    tipo_documento: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ PERMITIR NULL para pasajeros no titulares
      defaultValue: 'cc', // ✅ CORREGIDO: Usar minúsculas para consistencia con User model
    },
    fecha_nacimiento: {
      type: DataTypes.DATE,
      allowNull: true, // ✅ PERMITIR NULL para pasajeros no titulares que completarán después
    },
    titular: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
    // ✅ NOTA: Los campos documento_identidad, tipo_documento y fecha_nacimiento 
    // pueden ser null para pasajeros no titulares durante la captura inicial.
    // Se validará que estén completos al momento de generar el contrato.
    // Puedes agregar más campos si lo necesitas
  }, {
    tableName: 'passengers',
    timestamps: false
  });
};