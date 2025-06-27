const { User } = require('../db');
const { USER_ROLES } = require('../helpers/rolesConst');
const bcrypt = require('bcrypt');

const assignInitialRoles = async () => {
  try {
    console.log('🔄 Verificando usuarios con roles...');

    // Verificar si existe admin
    let adminUser = await User.findOne({ where: { email: 'admin@viajaya.com' } });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      adminUser = await User.create({
        name: 'Admin',
        lastname: 'Sistema',
        email: 'admin@viajaya.com',
        password: hashedPassword,
        phone: '3000000000',
        role: USER_ROLES.ADMIN,
        documento_identidad: '00000000',
        tipo_documento: 'cedula',
        ciudad: 'Bogotá',
        is_active: true,
        email_verified: true
      });
      console.log('✅ Usuario Admin creado');
    } else {
      console.log('✅ Usuario Admin ya existe');
    }

    // Verificar si existe owner
    let ownerUser = await User.findOne({ where: { email: 'owner@viajaya.com' } });
    
    if (!ownerUser) {
      const hashedPassword = await bcrypt.hash('Owner123!', 10);
      ownerUser = await User.create({
        name: 'Owner',
        lastname: 'Propietario', 
        email: 'owner@viajaya.com',
        password: hashedPassword,
        phone: '3000000001',
        role: USER_ROLES.OWNER,
        documento_identidad: '00000001',
        tipo_documento: 'cedula',
        ciudad: 'Bogotá',
        is_active: true,
        email_verified: true
      });
      console.log('✅ Usuario Owner creado');
    } else {
      console.log('✅ Usuario Owner ya existe');
    }

    console.log('🎉 Verificación de roles completada');
    
  } catch (error) {
    console.error('❌ Error en asignación de roles:', error);
  }
};

module.exports = assignInitialRoles;