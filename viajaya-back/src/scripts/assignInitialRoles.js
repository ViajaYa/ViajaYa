const { User } = require('../db');
const { USER_ROLES } = require('../helpers/rolesConst');
const bcrypt = require('bcrypt');

const assignInitialRoles = async () => {
  try {
    console.log('🔄 Verificando usuarios con roles...');

    // ✅ Definir los usuarios por defecto para cada rol
    const defaultUsers = [
      {
        name: 'Carlos',
        lastname: 'Cliente',
        email: 'cliente@viajaya.com',
        password: 'Cliente123!',
        phone: '3001000001',
        role: USER_ROLES.CLIENTE,
        documento_identidad: '10000001',
        tipo_documento: 'cc',
        ciudad: 'Bogotá',
        description: 'Usuario Cliente de prueba'
      },
      {
        name: 'Ana',
        lastname: 'Asesora',
        email: 'asesor@viajaya.com',
        password: 'Asesor123!',
        phone: '3001000002',
        role: USER_ROLES.ASESOR,
        documento_identidad: '10000002',
        tipo_documento: 'cc',
        ciudad: 'Medellín',
        commission_percentage: 5.00,
        banco: 'Bancolombia',
        numero_cuenta: '123456789',
        tipo_cuenta: 'ahorros',
        fecha_ingreso: new Date(),
        description: 'Usuario Asesor de prueba'
      },
      {
        name: 'Luis',
        lastname: 'Líder',
        email: 'lider@viajaya.com',
        password: 'Lider123!',
        phone: '3001000003',
        role: USER_ROLES.LIDER,
        documento_identidad: '10000003',
        tipo_documento: 'cc',
        ciudad: 'Cali',
        commission_percentage: 7.50,
        banco: 'Banco de Bogotá',
        numero_cuenta: '987654321',
        tipo_cuenta: 'corriente',
        fecha_ingreso: new Date(),
        description: 'Usuario Líder de prueba'
      },
      {
        name: 'María',
        lastname: 'Gerente',
        email: 'gerente@viajaya.com',
        password: 'Gerente123!',
        phone: '3001000004',
        role: USER_ROLES.GERENTE,
        documento_identidad: '10000004',
        tipo_documento: 'cc',
        ciudad: 'Barranquilla',
        commission_percentage: 10.00,
        banco: 'Davivienda',
        numero_cuenta: '456789123',
        tipo_cuenta: 'corriente',
        fecha_ingreso: new Date(),
        description: 'Usuario Gerente de prueba'
      },
      {
        name: 'Admin',
        lastname: 'Sistema',
        email: 'admin@viajaya.com',
        password: 'Admin123!',
        phone: '3001000005',
        role: USER_ROLES.ADMIN,
        documento_identidad: '10000005',
        tipo_documento: 'cc',
        ciudad: 'Bogotá',
        description: 'Usuario Administrador del sistema'
      },
      {
        name: 'Laura',
        lastname: 'Contadora',
        email: 'contador@viajaya.com',
        password: 'Contador123!',
        phone: '3001000006',
        role: USER_ROLES.CONTADOR,
        documento_identidad: '10000006',
        tipo_documento: 'cc',
        ciudad: 'Bucaramanga',
        banco: 'Banco Popular',
        numero_cuenta: '789123456',
        tipo_cuenta: 'ahorros',
        description: 'Usuario Contador de prueba'
      },
      {
        name: 'Owner',
        lastname: 'Propietario',
        email: 'owner@viajaya.com',
        password: 'Owner123!',
        phone: '3001000007',
        role: USER_ROLES.OWNER,
        documento_identidad: '10000007',
        tipo_documento: 'cc',
        ciudad: 'Bogotá',
        description: 'Usuario Propietario del sistema'
      }
    ];

    // ✅ Crear cada usuario si no existe
    const createdUsers = [];
    
    for (const userData of defaultUsers) {
      let existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (!existingUser) {
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Crear el usuario
        const newUser = await User.create({
          name: userData.name,
          lastname: userData.lastname,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
          role: userData.role,
          documento_identidad: userData.documento_identidad,
          tipo_documento: userData.tipo_documento,
          ciudad: userData.ciudad,
          commission_percentage: userData.commission_percentage || null,
          banco: userData.banco || null,
          numero_cuenta: userData.numero_cuenta || null,
          tipo_cuenta: userData.tipo_cuenta || null,
          fecha_ingreso: userData.fecha_ingreso || null,
          is_active: true,
          email_verified: true,
          is_active_seller: userData.role >= USER_ROLES.ASESOR, // Solo vendedores activos para roles de ventas
        });

        createdUsers.push(newUser);
        console.log(`✅ Usuario ${userData.description} creado: ${userData.email} (ID: ${newUser.id})`);
      } else {
        createdUsers.push(existingUser);
        console.log(`✅ Usuario ${userData.description} ya existe: ${userData.email} (ID: ${existingUser.id})`);
      }
    }

    // ✅ Establecer jerarquía de ventas (después de crear todos los usuarios)
    console.log('🔗 Estableciendo jerarquía de ventas...');
    
    // ✅ CORRECCIÓN: Buscar usuarios recién creados por email, no por role
    const gerente = createdUsers.find(user => user.email === 'gerente@viajaya.com');
    const lider = createdUsers.find(user => user.email === 'lider@viajaya.com');
    const asesor = createdUsers.find(user => user.email === 'asesor@viajaya.com');

    if (gerente && lider && asesor) {
      try {
        // Asignar Líder al Gerente
        await User.update(
          { gerente_id: gerente.id },
          { where: { id: lider.id } }
        );
        console.log(`✅ Líder ${lider.name} (ID: ${lider.id}) asignado al Gerente ${gerente.name} (ID: ${gerente.id})`);

        // Asignar Asesor al Líder y Gerente
        await User.update(
          { 
            lider_id: lider.id,
            gerente_id: gerente.id 
          },
          { where: { id: asesor.id } }
        );
        console.log(`✅ Asesor ${asesor.name} (ID: ${asesor.id}) asignado al Líder ${lider.name} (ID: ${lider.id}) y Gerente ${gerente.name} (ID: ${gerente.id})`);
        
      } catch (hierarchyError) {
        console.error('❌ Error estableciendo jerarquía:', hierarchyError.message);
        // No lanzar el error para que el resto del script pueda continuar
      }
    } else {
      console.log('⚠️ No se pudieron encontrar todos los usuarios para establecer jerarquía');
      console.log(`Gerente: ${gerente ? 'Encontrado' : 'No encontrado'}`);
      console.log(`Líder: ${lider ? 'Encontrado' : 'No encontrado'}`);
      console.log(`Asesor: ${asesor ? 'Encontrado' : 'No encontrado'}`);
    }

    // ✅ Mostrar resumen final
    console.log('\n📋 RESUMEN DE USUARIOS CREADOS:');
    console.log('=====================================');
    
    const allUsers = await User.findAll({
      attributes: ['id', 'name', 'lastname', 'email', 'role', 'phone', 'lider_id', 'gerente_id'],
      order: [['role', 'ASC']]
    });

    const getRoleName = (roleNumber) => {
      const roleNames = {
        1: 'CLIENTE',
        2: 'ASESOR',
        3: 'LÍDER',
        4: 'GERENTE',
        5: 'ADMIN',
        6: 'CONTADOR',
        7: 'OWNER'
      };
      return roleNames[roleNumber] || 'DESCONOCIDO';
    };

    allUsers.forEach(user => {
      let hierarchyInfo = '';
      if (user.lider_id || user.gerente_id) {
        hierarchyInfo = ` | Líder: ${user.lider_id || 'N/A'} | Gerente: ${user.gerente_id || 'N/A'}`;
      }
      console.log(`👤 ${user.name} ${user.lastname} | ${getRoleName(user.role)} | ${user.email} | ID: ${user.id}${hierarchyInfo}`);
    });

    console.log('\n🎉 Verificación de roles completada exitosamente');
    console.log(`📊 Total de usuarios: ${allUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error en asignación de roles:', error);
    throw error;
  }
};

module.exports = assignInitialRoles;