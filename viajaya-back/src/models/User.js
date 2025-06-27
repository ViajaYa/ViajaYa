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
  allowNull: false,
  validate: {
    isIn: [[1, 2, 3, 4, 5, 6, 7]] // Validar que solo sean estos valores
  },
  // 1: Cliente, 2: Asesor, 3: Líder, 4: Gerente, 5: Admin, 6: Contador, 7: Owner
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
    },
    // Nuevos campos para la jerarquía de ventas
    supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    commission_limit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 1400000.00, // Límite para documentos soporte
    },
    current_commission_used: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00, // Comisión usada en el período actual
    },
    commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true, // Porcentaje de comisión que recibe
    },
    // Información bancaria para comisiones
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
    },
    // Estado del vendedor
    is_active_seller: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fecha_ingreso: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Información adicional del cliente
    documento_identidad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipo_documento: {
      type: DataTypes.ENUM('cedula', 'passport', 'cedula_extranjeria'),
      allowNull: true,
    },
    fecha_nacimiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ciudad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pais: {
      type: DataTypes.STRING,
      defaultValue: 'Colombia',
    },
    // Campos de seguridad y autenticación
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    account_locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },{timestamps:false});
};
