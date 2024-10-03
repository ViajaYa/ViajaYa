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

const {  Pack, Item, User, OrderReservation } = sequelize.models;




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

  module.exports = {
    ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
    conn: sequelize,     // para importart la conexión { conn } = require('./db.js');
  };