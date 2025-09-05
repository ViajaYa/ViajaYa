// Migración para agregar soporte de cuotas a compras
// Fecha: 2025-01-09

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = require('../src/config/envs');

// Crear conexión directa para la migración
const sequelize = new Sequelize(
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  {
    logging: console.log, // Mostrar las consultas SQL
    native: false,
  }
);

async function addInstallmentFieldsToPurchases() {
  console.log('🔄 Iniciando migración: agregar campos de cuotas a Purchase...');
  
  try {
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    const queryInterface = sequelize.getQueryInterface();

    // Verificar si las columnas ya existen
    const tableDescription = await queryInterface.describeTable('purchases');
    console.log('📋 Columnas existentes en purchases:', Object.keys(tableDescription));

    // Agregar campos solo si no existen
    const fieldsToAdd = [
      {
        name: 'tipo_pago',
        definition: {
          type: sequelize.Sequelize.DataTypes.ENUM('contado', 'cuotas'),
          defaultValue: 'contado',
          comment: 'Si es pago único o en cuotas'
        }
      },
      {
        name: 'numero_cuotas',
        definition: {
          type: sequelize.Sequelize.DataTypes.INTEGER,
          allowNull: true,
          comment: 'Total de cuotas acordadas'
        }
      },
      {
        name: 'cuotas_pagadas',
        definition: {
          type: sequelize.Sequelize.DataTypes.INTEGER,
          defaultValue: 0,
          comment: 'Número de cuotas ya pagadas'
        }
      },
      {
        name: 'saldo_pendiente',
        definition: {
          type: sequelize.Sequelize.DataTypes.DECIMAL(12, 2),
          allowNull: true,
          comment: 'Saldo pendiente por pagar'
        }
      }
    ];

    for (const field of fieldsToAdd) {
      if (!tableDescription[field.name]) {
        console.log(`➕ Agregando columna: ${field.name}`);
        await queryInterface.addColumn('purchases', field.name, field.definition);
        console.log(`✅ Columna ${field.name} agregada exitosamente`);
      } else {
        console.log(`⏭️  Columna ${field.name} ya existe, omitiendo...`);
      }
    }

    // Verificar si la tabla purchaseInstallments ya existe
    const tables = await queryInterface.showAllTables();
    console.log('📋 Tablas existentes:', tables);

    if (!tables.includes('purchaseInstallments')) {
      console.log('➕ Creando tabla purchaseInstallments...');
      
      // Crear tabla purchase_installments
      await queryInterface.createTable('purchaseInstallments', {
        id: {
          type: sequelize.Sequelize.DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        purchase_id: {
          type: sequelize.Sequelize.DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'purchases', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        numero_cuota: {
          type: sequelize.Sequelize.DataTypes.INTEGER,
          allowNull: false,
          comment: 'Número de la cuota (1, 2, 3, etc.)'
        },
        monto_cuota: {
          type: sequelize.Sequelize.DataTypes.DECIMAL(12, 2),
          allowNull: false,
          comment: 'Monto de esta cuota específica'
        },
        fecha_vencimiento: {
          type: sequelize.Sequelize.DataTypes.DATE,
          allowNull: false,
          comment: 'Fecha límite para pagar esta cuota'
        },
        fecha_pago: {
          type: sequelize.Sequelize.DataTypes.DATE,
          allowNull: true,
          comment: 'Fecha en que se pagó la cuota'
        },
        estado: {
          type: sequelize.Sequelize.DataTypes.ENUM('pendiente', 'pagado', 'vencido'),
          defaultValue: 'pendiente'
        },
        comprobante_pago_url: {
          type: sequelize.Sequelize.DataTypes.STRING,
          allowNull: true,
          comment: 'Comprobante específico de esta cuota'
        },
        cloudinary_public_id: {
          type: sequelize.Sequelize.DataTypes.STRING,
          allowNull: true
        },
        observaciones: {
          type: sequelize.Sequelize.DataTypes.TEXT,
          allowNull: true
        },
        metodo_pago: {
          type: sequelize.Sequelize.DataTypes.ENUM('transferencia', 'efectivo', 'cheque', 'tarjeta'),
          allowNull: true
        },
        createdAt: {
          type: sequelize.Sequelize.DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: sequelize.Sequelize.DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      console.log('✅ Tabla purchaseInstallments creada exitosamente');
    } else {
      console.log('⏭️  Tabla purchaseInstallments ya existe, omitiendo...');
    }

    // Migrar datos existentes solo si no han sido migrados antes
    console.log('🔄 Verificando si necesita migrar compras existentes...');
    
    const installmentCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM "purchaseInstallments"',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (installmentCount[0].count === '0') {
      console.log('� Migrando compras existentes...');
      
      const existingPurchases = await sequelize.query(
        'SELECT * FROM purchases',
        { type: sequelize.QueryTypes.SELECT }
      );

      for (const purchase of existingPurchases) {
        // Actualizar la compra existente solo si los campos están vacíos
        await sequelize.query(
          `UPDATE purchases SET 
           tipo_pago = COALESCE(tipo_pago, 'contado'), 
           numero_cuotas = COALESCE(numero_cuotas, 1), 
           cuotas_pagadas = COALESCE(cuotas_pagadas, CASE WHEN estado_pago = 'pagado' THEN 1 ELSE 0 END),
           saldo_pendiente = COALESCE(saldo_pendiente, CASE WHEN estado_pago = 'pagado' THEN 0 ELSE costo END)
           WHERE id = :id`,
          { 
            replacements: { id: purchase.id },
            type: sequelize.QueryTypes.UPDATE 
          }
        );

        // Crear una cuota equivalente
        const fechaVencimiento = purchase.fecha_vencimiento_pago || 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

        await sequelize.query(
          `INSERT INTO "purchaseInstallments" (
            purchase_id, numero_cuota, monto_cuota, fecha_vencimiento,
            fecha_pago, estado, comprobante_pago_url, cloudinary_public_id,
            observaciones, "createdAt", "updatedAt"
          ) VALUES (
            :purchase_id, 1, :monto, :fecha_vencimiento,
            :fecha_pago, :estado, :comprobante_url, :cloudinary_id,
            :observaciones, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )`,
          {
            replacements: {
              purchase_id: purchase.id,
              monto: purchase.costo || 0,
              fecha_vencimiento: fechaVencimiento,
              fecha_pago: purchase.estado_pago === 'pagado' ? purchase.fecha_compra : null,
              estado: purchase.estado_pago || 'pendiente',
              comprobante_url: purchase.comprobante_url,
              cloudinary_id: purchase.cloudinary_public_id,
              observaciones: purchase.observaciones
            },
            type: sequelize.QueryTypes.INSERT
          }
        );
      }

      console.log(`✅ ${existingPurchases.length} compras migradas exitosamente`);
    } else {
      console.log('⏭️  Las compras ya han sido migradas anteriormente');
    }

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

// Ejecutar migración si el archivo se ejecuta directamente
if (require.main === module) {
  addInstallmentFieldsToPurchases()
    .then(() => {
      console.log('✅ Migración ejecutada exitosamente');
      return sequelize.close();
    })
    .then(() => {
      console.log('✅ Conexión cerrada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando migración:', error);
      sequelize.close().then(() => process.exit(1));
    });
}

module.exports = { addInstallmentFieldsToPurchases };
