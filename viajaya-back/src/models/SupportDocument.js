const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('supportDocument', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    numero_documento: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    vendedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    vendedor_real_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // El vendedor real que debe recibir el pago
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    fecha_generacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('generated', 'approved', 'paid', 'rejected'),
      defaultValue: 'generated',
    },
    owner_approval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pagado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Control de límites
    limite_excedido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    monto_original: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // Si hubo redistribución por límite
    },
    documento_padre_id: {
      type: DataTypes.UUID,
      allowNull: true, // Para casos de documentos derivados por límite
    },
    // Archivos
    documento_pdf_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comprobante_pago_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Información bancaria
    banco: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero_cuenta: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipo_cuenta: {
      type: DataTypes.ENUM('ahorros', 'corriente'),
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
