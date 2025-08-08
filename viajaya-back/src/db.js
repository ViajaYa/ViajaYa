require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DB_DEPLOY } = require("../src/config/envs")

//-------------------------------- CONFIGURACION PARA TRABAJAR LOCALMENTE-----------------------------------
// const sequelize = new Sequelize(
//     `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
//     {
//       logging: false, // set to console.log to see the raw SQL queries
//       native: false, // lets Sequelize know we can use pg-native for ~30% more speed
//     }
//   ); 

  //-------------------------------------CONFIGURACION PARA EL DEPLOY---------------------------------------------------------------------
  const sequelize = new Sequelize(DB_DEPLOY , {
    logging: false, // set to console.log to see the raw SQL queries
    native: false, // lets Sequelize know we can use pg-native for ~30% more speed
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    },
  }
);

const basename = path.basename(__filename);
const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, '/models'))
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach(model => model(sequelize));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
sequelize.models = Object.fromEntries(capsEntries);

const {  
  Pack, 
  Item, 
  User, 
  OrderReservation, 
  Quote, 
  Contract, 
  Payment, 
  PackagePurchase, 
  Commission, 
  SupportDocument, 
  AutoMessage, 
  Invoice,
  ContractItem,
  Purchase,
  UserDocument,
  Passenger,
  CommissionConfig,
  QuoteCalculation
} = sequelize.models;

// ===== RELACIONES ORGANIZADAS POR SECCIONES =====

// ✅ 1. RELACIONES BÁSICAS - PACK & ITEM
Item.belongsTo(Pack, { foreignKey: 'packId' });
Pack.hasMany(Item, { foreignKey: 'packId' });

// ✅ 2. RELACIONES DE REFERIDOS
User.hasMany(User, {
  as: 'Referrals', // Un usuario puede tener muchos referidos
  foreignKey: 'referred_by', // Este es el campo en la tabla que almacena el referral_code del referidor
  sourceKey: 'referral_code' // Esto conecta el referral_code del referidor con el referred_by del usuario referido
});

User.belongsTo(User, {
  as: 'Referrer', // Un usuario puede ser referido por un usuario
  foreignKey: 'referred_by', // Este campo almacena el código de referido del usuario que lo refirió
  targetKey: 'referral_code' // Conecta el referred_by con el referral_code
});

// ✅ 3. RELACIONES JERÁRQUICAS DE VENTAS
// LÍDER → ASESORES
User.hasMany(User, {
  as: 'AsesoresDirectos', // Un líder tiene muchos asesores
  foreignKey: 'lider_id',
  scope: { role: 2 } // Solo asesores
});

User.belongsTo(User, {
  as: 'LiderDirecto', // Un asesor pertenece a un líder
  foreignKey: 'lider_id'
});

// GERENTE → LÍDERES
User.hasMany(User, {
  as: 'LideresDirectos', // Un gerente tiene muchos líderes
  foreignKey: 'gerente_id',
  scope: { role: 3 } // Solo líderes
});

// GERENTE → ASESORES (indirectos, a través de líderes)
User.hasMany(User, {
  as: 'AsesoresIndirectos', // Un gerente ve todos los asesores de sus líderes
  foreignKey: 'gerente_id',
  scope: { role: 2 } // Solo asesores
});

User.belongsTo(User, {
  as: 'GerenteDirecto', // Líder o Asesor pertenece a un gerente
  foreignKey: 'gerente_id'
});

// ✅ 4. RELACIONES USER - COMPRAS/RESERVAS
User.hasMany(Item, {
  as: 'PurchasedItems',
  foreignKey: 'userId',
  sourceKey: 'id'
});

Item.belongsTo(User, {
  as: 'Buyer',
  foreignKey: 'userId',
  targetKey: 'id'
});

User.hasMany(OrderReservation, { 
  as: 'Reservations',
  foreignKey: 'userId' 
});

OrderReservation.belongsTo(User, { 
  as: 'Customer',
  foreignKey: 'userId' 
});

// ✅ 5. RELACIONES PACK - RESERVAS
Pack.hasMany(OrderReservation, { 
  as: 'Reservations',
  foreignKey: 'packId' 
});

OrderReservation.belongsTo(Pack, { 
  as: 'Package',
  foreignKey: 'packId' 
});

// ✅ 6. RELACIONES DE COTIZACIONES (QUOTE)
// Usuario como vendedor en diferentes roles
User.hasMany(Quote, { 
  as: 'QuotesAsAsesor', 
  foreignKey: 'asesor_id' 
});

User.hasMany(Quote, { 
  as: 'QuotesAsLider', 
  foreignKey: 'lider_id' 
});

User.hasMany(Quote, { 
  as: 'QuotesAsGerente', 
  foreignKey: 'gerente_id' 
});

// ✅ NUEVA RELACIÓN PARA ADMIN
User.hasMany(Quote, { 
  as: 'QuotesAsAdmin', 
  foreignKey: 'admin_id' 
});

User.hasMany(Quote, { 
  as: 'QuotesAsCliente', 
  foreignKey: 'cliente_id' 
});

// Quote pertenece a usuarios en diferentes roles
Quote.belongsTo(User, { 
  as: 'Asesor', 
  foreignKey: 'asesor_id' 
});

Quote.belongsTo(User, { 
  as: 'Lider', 
  foreignKey: 'lider_id' 
});

Quote.belongsTo(User, { 
  as: 'Gerente', 
  foreignKey: 'gerente_id' 
});

// ✅ NUEVA RELACIÓN PARA ADMIN
Quote.belongsTo(User, { 
  as: 'Admin', 
  foreignKey: 'admin_id' 
});

Quote.belongsTo(User, { 
  as: 'Cliente', 
  foreignKey: 'cliente_id' 
});
Quote.belongsTo(User, { foreignKey: 'owner_id', as: 'Owner' });

// ✅ 7. RELACIONES QUOTE - QUOTE ITEMS
Contract.hasMany(ContractItem, { foreignKey: 'contract_id', as: 'Items' });
ContractItem.belongsTo(Contract, { foreignKey: 'contract_id', as: 'Contract' });

// Quote <-> ContractItem (opcional, si necesitas acceder desde la cotización)
Quote.hasMany(ContractItem, { foreignKey: 'quote_id', as: 'QuoteItems' });
ContractItem.belongsTo(Quote, { foreignKey: 'quote_id', as: 'Quote' });

// ✅ 8. RELACIONES QUOTE - CONTRACT
Quote.hasOne(Contract, { 
  as: 'Contract',
  foreignKey: 'quote_id' 
});

Contract.belongsTo(Quote, { 
  as: 'Quote',
  foreignKey: 'quote_id' 
});

// ✅ 9. RELACIONES CONTRACT - USER
User.hasMany(Contract, { 
  as: 'ContractsAsCliente', 
  foreignKey: 'cliente_id' 
});

Contract.belongsTo(User, { 
  as: 'Cliente', 
  foreignKey: 'cliente_id' 
});

// ✅ 10. RELACIONES CONTRACT - PAYMENTS
Contract.hasMany(Payment, { 
  as: 'Payments',
  foreignKey: 'contract_id' 
});

Payment.belongsTo(Contract, { 
  as: 'Contract',
  foreignKey: 'contract_id' 
});

// ✅ 11. RELACIONES CONTRACT - PACKAGE PURCHASES
Contract.hasMany(PackagePurchase, { 
  as: 'PackagePurchases',
  foreignKey: 'contract_id' 
});

PackagePurchase.belongsTo(Contract, { 
  as: 'Contract',
  foreignKey: 'contract_id' 
});

// ✅ 12. RELACIONES DE COMISIONES
Contract.hasMany(Commission, { 
  as: 'Commissions',
  foreignKey: 'contract_id' 
});

Commission.belongsTo(Contract, { 
  as: 'Contract',
  foreignKey: 'contract_id' 
});

User.hasMany(Commission, { 
  as: 'CommissionsAsVendedor', 
  foreignKey: 'vendedor_id' 
});

Commission.belongsTo(User, { 
  as: 'Vendedor', 
  foreignKey: 'vendedor_id' 
});

User.hasMany(Commission, { 
  as: 'CommissionsPagadas', 
  foreignKey: 'pagado_por' 
});

Commission.belongsTo(User, { 
  as: 'PagadoPor', 
  foreignKey: 'pagado_por' 
});

// ✅ 13. RELACIONES DE DOCUMENTOS DE SOPORTE
User.hasMany(SupportDocument, { 
  as: 'DocumentsAsVendedor', 
  foreignKey: 'vendedor_id' 
});

User.hasMany(SupportDocument, { 
  as: 'DocumentsAsVendedorReal', 
  foreignKey: 'vendedor_real_id' 
});

User.hasMany(SupportDocument, { 
  as: 'DocumentsAprobados', 
  foreignKey: 'aprobado_por' 
});

User.hasMany(SupportDocument, { 
  as: 'DocumentsPagados', 
  foreignKey: 'pagado_por' 
});

SupportDocument.belongsTo(User, { 
  as: 'Vendedor', 
  foreignKey: 'vendedor_id' 
});

SupportDocument.belongsTo(User, { 
  as: 'VendedorReal', 
  foreignKey: 'vendedor_real_id' 
});

SupportDocument.belongsTo(User, { 
  as: 'AprobadoPor', 
  foreignKey: 'aprobado_por' 
});

SupportDocument.belongsTo(User, { 
  as: 'PagadoPor', 
  foreignKey: 'pagado_por' 
});

// Relación recursiva para documentos derivados
SupportDocument.hasMany(SupportDocument, { 
  as: 'DocumentosDerivados', 
  foreignKey: 'documento_padre_id' 
});

SupportDocument.belongsTo(SupportDocument, { 
  as: 'DocumentoPadre', 
  foreignKey: 'documento_padre_id' 
});

// ✅ 14. RELACIONES COMMISSION - SUPPORT DOCUMENT
SupportDocument.hasMany(Commission, { 
  as: 'RelatedCommissions',
  foreignKey: 'documento_soporte_id' 
});

Commission.belongsTo(SupportDocument, { 
  as: 'DocumentoSoporte', 
  foreignKey: 'documento_soporte_id' 
});

// ✅ 14.1 RELACIONES COMMISSION CONFIG
CommissionConfig.belongsTo(User, {
  as: 'CreatedBy',
  foreignKey: 'created_by'
});

CommissionConfig.belongsTo(User, {
  as: 'UpdatedBy',
  foreignKey: 'updated_by'
});

User.hasMany(CommissionConfig, {
  as: 'CommissionConfigsCreated',
  foreignKey: 'created_by'
});

User.hasMany(CommissionConfig, {
  as: 'CommissionConfigsUpdated',
  foreignKey: 'updated_by'
});

// ✅ 15. RELACIONES DE MENSAJES AUTOMÁTICOS
User.hasMany(AutoMessage, { 
  as: 'MessagesAsCliente', 
  foreignKey: 'cliente_id' 
});

User.hasMany(AutoMessage, { 
  as: 'MessagesCreated', 
  foreignKey: 'creado_por' 
});

AutoMessage.belongsTo(User, { 
  as: 'Cliente', 
  foreignKey: 'cliente_id' 
});

AutoMessage.belongsTo(User, { 
  as: 'CreadoPor', 
  foreignKey: 'creado_por' 
});

Contract.hasMany(AutoMessage, { 
  as: 'AutoMessages',
  foreignKey: 'contract_id' 
});

AutoMessage.belongsTo(Contract, { 
  as: 'Contract',
  foreignKey: 'contract_id' 
});

// ✅ 16. RELACIONES DE FACTURAS
Contract.hasMany(Invoice, { 
  as: 'Invoices',
  foreignKey: 'contract_id' 
});

Invoice.belongsTo(Contract, { 
  as: 'Contract',
  foreignKey: 'contract_id' 
});

User.hasMany(Invoice, { 
  as: 'InvoicesAsCliente', 
  foreignKey: 'cliente_id' 
});

User.hasMany(Invoice, { 
  as: 'InvoicesGenerated', 
  foreignKey: 'generada_por' 
});

User.hasMany(Invoice, { 
  as: 'InvoicesApproved', 
  foreignKey: 'aprobada_por' 
});

Invoice.belongsTo(User, { 
  as: 'Cliente', 
  foreignKey: 'cliente_id' 
});

Invoice.belongsTo(User, { 
  as: 'GeneradaPor', 
  foreignKey: 'generada_por' 
});

ContractItem.hasMany(Purchase, 
  { foreignKey: 'contract_item_id', 
    as: 'Purchases' 
  });

Purchase.belongsTo(ContractItem, 
  { foreignKey: 'contract_item_id', 
    as: 'ContractItem' 
  });

Invoice.belongsTo(User, { 
  as: 'AprobadaPor', 
  foreignKey: 'aprobada_por' 
});

// ✅ 17. RELACIONES DE DOCUMENTOS DE USUARIO
// Un usuario puede tener muchos documentos
User.hasMany(UserDocument, { 
  as: 'DocumentsAsOwner', 
  foreignKey: 'user_id' 
});

// Un documento pertenece a un usuario propietario
UserDocument.belongsTo(User, { 
  as: 'Owner', 
  foreignKey: 'user_id' 
});

// Relación para el verificador (admin/supervisor que aprueba/rechaza)
User.hasMany(UserDocument, { 
  as: 'DocumentsAsVerifier', 
  foreignKey: 'verified_by' 
});

UserDocument.belongsTo(User, { 
  as: 'VerifiedBy', 
  foreignKey: 'verified_by' 
});

Passenger.belongsTo(Quote, { 
   as: 'Quote',
  foreignKey: 'quote_id' 
});

Quote.hasMany(Passenger, { 
  as: 'Passengers',
  foreignKey: 'quote_id'
});

// Un usuario puede tener muchos cálculos de cotización
User.hasMany(QuoteCalculation, { as: 'QuoteCalculations', foreignKey: 'user_id' });
QuoteCalculation.belongsTo(User, { as: 'User', foreignKey: 'user_id' });

// Un cálculo puede asociarse a una cotización final
Quote.hasOne(QuoteCalculation, { as: 'Calculation', foreignKey: 'quote_id' });
QuoteCalculation.belongsTo(Quote, { as: 'Quote', foreignKey: 'quote_id' });

QuoteCalculation.hasMany(ContractItem, { 
  foreignKey: 'quote_calculation_id', 
  as: 'GeneratedItems' 
});

ContractItem.belongsTo(QuoteCalculation, { 
  foreignKey: 'quote_calculation_id', 
  as: 'QuoteCalculation' 
});



module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize,     // para importart la conexión { conn } = require('./db.js');
};