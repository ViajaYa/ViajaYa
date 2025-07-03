require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DB_DEPLOY } = require("../src/config/envs")

//-------------------------------- CONFIGURACION PARA TRABAJAR LOCALMENTE-----------------------------------
const sequelize = new Sequelize(
    `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
    {
      logging: false, // set to console.log to see the raw SQL queries
      native: false, // lets Sequelize know we can use pg-native for ~30% more speed
    }
  ); 

  //-------------------------------------CONFIGURACION PARA EL DEPLOY---------------------------------------------------------------------
//   const sequelize = new Sequelize(DB_DEPLOY , {
//     logging: false, // set to console.log to see the raw SQL queries
//     native: false, // lets Sequelize know we can use pg-native for ~30% more speed
//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false,
//       }
//     },
//   }
// );



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
  QuoteItem 
} = sequelize.models;

// Relaciones existentes
Item.belongsTo(Pack)
Pack.hasMany(Item)

// Relación entre usuarios para los referidos
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

// Relación jerárquica de supervisores
// User.hasMany(User, {
//   as: 'TeamMembers', // Un usuario puede tener muchos miembros en su equipo
//   foreignKey: 'supervisor_id'
// });

// User.belongsTo(User, {
//   as: 'Supervisor', // Un usuario puede tener un supervisor
//   foreignKey: 'supervisor_id'
// });

User.hasMany(User, {
  as: 'AsesoresDirectos', // Un líder tiene muchos asesores
  foreignKey: 'lider_id'
});
User.belongsTo(User, {
  as: 'LiderDirecto', // Un asesor pertenece a un líder
  foreignKey: 'lider_id'
});

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

// Relación entre Usuario y Compra (Item)
User.hasMany(Item, {
  foreignKey: 'userId', // Añadir la clave foránea userId a la tabla de Items
  sourceKey: 'id' // Conecta con el id del Usuario
});

Item.belongsTo(User, {
  foreignKey: 'userId', // Establece que cada Item pertenece a un Usuario
  targetKey: 'id' // Conecta con el id del Usuario
})

User.hasMany(OrderReservation, { foreignKey: 'userId' });
OrderReservation.belongsTo(User, { foreignKey: 'userId' });

// Relación entre Pack y Reserva
Pack.hasMany(OrderReservation, { foreignKey: 'packId' });
OrderReservation.belongsTo(Pack, { foreignKey: 'packId' });

// ===== NUEVAS RELACIONES PARA EL SISTEMA DE AGENCIA =====

// Relaciones de Quote
User.hasMany(Quote, { as: 'QuotesAsAsesor', foreignKey: 'asesor_id' });
User.hasMany(Quote, { as: 'QuotesAsLider', foreignKey: 'lider_id' });
User.hasMany(Quote, { as: 'QuotesAsGerente', foreignKey: 'gerente_id' });
User.hasMany(Quote, { as: 'QuotesAsCliente', foreignKey: 'cliente_id' });

Quote.belongsTo(User, { as: 'Asesor', foreignKey: 'asesor_id' });
Quote.belongsTo(User, { as: 'Lider', foreignKey: 'lider_id' });
Quote.belongsTo(User, { as: 'Gerente', foreignKey: 'gerente_id' });
Quote.belongsTo(User, { as: 'Cliente', foreignKey: 'cliente_id' });

// Relaciones de Contract
Quote.hasOne(Contract, { foreignKey: 'quote_id' });
Contract.belongsTo(Quote, { foreignKey: 'quote_id' });

Quote.hasMany(QuoteItem, { 
  foreignKey: 'quote_id', 
  as: 'items'
  
});
QuoteItem.belongsTo(Quote, { 
  foreignKey: 'quote_id', 
  as: 'quote' 
}); 
User.hasMany(Contract, { as: 'ContractsAsCliente', foreignKey: 'cliente_id' });
Contract.belongsTo(User, { as: 'Cliente', foreignKey: 'cliente_id' });

// Relaciones de Payment
Contract.hasMany(Payment, { foreignKey: 'contract_id' });
Payment.belongsTo(Contract, { foreignKey: 'contract_id' });

// Relaciones de PackagePurchase
Contract.hasMany(PackagePurchase, { foreignKey: 'contract_id' });
PackagePurchase.belongsTo(Contract, { foreignKey: 'contract_id' });

// Relaciones de Commission
Contract.hasMany(Commission, { foreignKey: 'contract_id' });
Commission.belongsTo(Contract, { foreignKey: 'contract_id' });

User.hasMany(Commission, { as: 'CommissionsAsVendedor', foreignKey: 'vendedor_id' });
Commission.belongsTo(User, { as: 'Vendedor', foreignKey: 'vendedor_id' });

User.hasMany(Commission, { as: 'CommissionsPagadas', foreignKey: 'pagado_por' });
Commission.belongsTo(User, { as: 'PagadoPor', foreignKey: 'pagado_por' });

// Relaciones de SupportDocument
User.hasMany(SupportDocument, { as: 'DocumentsAsVendedor', foreignKey: 'vendedor_id' });
User.hasMany(SupportDocument, { as: 'DocumentsAsVendedorReal', foreignKey: 'vendedor_real_id' });
User.hasMany(SupportDocument, { as: 'DocumentsAprobados', foreignKey: 'aprobado_por' });
User.hasMany(SupportDocument, { as: 'DocumentsPagados', foreignKey: 'pagado_por' });

SupportDocument.belongsTo(User, { as: 'Vendedor', foreignKey: 'vendedor_id' });
SupportDocument.belongsTo(User, { as: 'VendedorReal', foreignKey: 'vendedor_real_id' });
SupportDocument.belongsTo(User, { as: 'AprobadoPor', foreignKey: 'aprobado_por' });
SupportDocument.belongsTo(User, { as: 'PagadoPor', foreignKey: 'pagado_por' });

// Relación recursiva para documentos derivados
SupportDocument.hasMany(SupportDocument, { as: 'DocumentosDerivados', foreignKey: 'documento_padre_id' });
SupportDocument.belongsTo(SupportDocument, { as: 'DocumentoPadre', foreignKey: 'documento_padre_id' });

// Relación entre Commission y SupportDocument
SupportDocument.hasMany(Commission, { foreignKey: 'documento_soporte_id' });
Commission.belongsTo(SupportDocument, { as: 'DocumentoSoporte', foreignKey: 'documento_soporte_id' });

// Relaciones de AutoMessage
User.hasMany(AutoMessage, { as: 'MessagesAsCliente', foreignKey: 'cliente_id' });
User.hasMany(AutoMessage, { as: 'MessagesCreated', foreignKey: 'creado_por' });

AutoMessage.belongsTo(User, { as: 'Cliente', foreignKey: 'cliente_id' });
AutoMessage.belongsTo(User, { as: 'CreadoPor', foreignKey: 'creado_por' });

Contract.hasMany(AutoMessage, { foreignKey: 'contract_id' });
AutoMessage.belongsTo(Contract, { foreignKey: 'contract_id' });

// Relaciones de Invoice
Contract.hasMany(Invoice, { foreignKey: 'contract_id' });
Invoice.belongsTo(Contract, { foreignKey: 'contract_id' });

User.hasMany(Invoice, { as: 'InvoicesAsCliente', foreignKey: 'cliente_id' });
User.hasMany(Invoice, { as: 'InvoicesGenerated', foreignKey: 'generada_por' });
User.hasMany(Invoice, { as: 'InvoicesApproved', foreignKey: 'aprobada_por' });

Invoice.belongsTo(User, { as: 'Cliente', foreignKey: 'cliente_id' });
Invoice.belongsTo(User, { as: 'GeneradaPor', foreignKey: 'generada_por' });
Invoice.belongsTo(User, { as: 'AprobadaPor', foreignKey: 'aprobada_por' });

  module.exports = {
    ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
    conn: sequelize,     // para importart la conexión { conn } = require('./db.js');
  };