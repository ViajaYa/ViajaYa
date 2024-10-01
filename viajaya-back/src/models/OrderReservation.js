const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');  

module.exports = (sequelize) => {
  sequelize.define('orderReservation', {
    idOrder: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,  
      primaryKey: true,
    },
    userId: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', 
        key: 'id'
      }
    },
    packId: {  
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'packs', 
        key: 'id'
      }
    },
    bookingDate: {  // Fecha de la reserva
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    numberOfPeople: {  // Número de personas para el pack (cupos)
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalPrice: {  // Precio total calculado en base al pack y cupos
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    fechas: {  // Campo para las fechas en formato JSON
      type: DataTypes.JSON,
      allowNull: false,
    },
    isPaid: {  // Campo para confirmar si la reserva ha sido pagada
      type: DataTypes.BOOLEAN,
      defaultValue: false,  // Por defecto no está pagado
    }
  }, { timestamps: false });
};

