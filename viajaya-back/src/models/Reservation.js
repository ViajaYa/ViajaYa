const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('Reservation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
   userId: {  // Clave foránea que referencia a User
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Nombre de la tabla del modelo User
        key: 'id',
      },
    },
    packId: {  // Clave foránea que referencia a Pack
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'packs', 
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending', // Estados posibles: pending, paid, cancelled
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true, // ID de la transacción de pago, si lo tienes
    },
  }, {
    timestamps: true, // Para que incluya createdAt y updatedAt
  });
};
