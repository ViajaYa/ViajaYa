const bcrypt = require('bcrypt');
const { User } = require('../db');

/**
 * Script para migrar contraseñas en texto plano a contraseñas hasheadas
 * EJECUTAR SOLO UNA VEZ después de la actualización
 */
const migratePasswords = async () => {
    try {
        console.log('Iniciando migración de contraseñas...');
        
        // Obtener todos los usuarios
        const users = await User.findAll();
        
        console.log(`Encontrados ${users.length} usuarios para migrar`);
        
        for (const user of users) {
            // Verificar si la contraseña ya está hasheada (bcrypt hashes empiezan con $2b$)
            if (!user.password.startsWith('$2b$')) {
                console.log(`Migrando contraseña para usuario: ${user.email}`);
                
                // Hashear la contraseña
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                
                // Actualizar en la base de datos
                await User.update(
                    { 
                        password: hashedPassword,
                        password_changed_at: new Date(),
                        failed_login_attempts: 0,
                        account_locked_until: null,
                        is_active: true
                    },
                    { where: { id: user.id } }
                );
                
                console.log(`✓ Contraseña migrada para ${user.email}`);
            } else {
                console.log(`- Contraseña ya hasheada para ${user.email}`);
            }
        }
        
        console.log('✅ Migración de contraseñas completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    }
};

/**
 * Script para crear usuario administrador inicial
 */
const createInitialAdmin = async () => {
    try {
        console.log('Verificando usuario administrador...');
        
        // Verificar si ya existe un usuario Owner
        const existingOwner = await User.findOne({
            where: { role: 7 }
        });
        
        if (existingOwner) {
            console.log('✓ Usuario Owner ya existe:', existingOwner.email);
            return;
        }
        
        // Crear usuario Owner inicial
        const saltRounds = 12;
        const defaultPassword = 'Admin123!'; // CAMBIAR INMEDIATAMENTE
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
        
        const adminUser = await User.create({
            name: 'Administrador',
            lastname: 'Principal',
            email: 'admin@viajaya.com',
            password: hashedPassword,
            role: 7, // Owner
            phone: '1234567890',
            is_active: true,
            email_verified: true,
            password_changed_at: new Date()
        });
        
        console.log('✅ Usuario Owner creado exitosamente');
        console.log('📧 Email:', adminUser.email);
        console.log('🔑 Contraseña temporal:', defaultPassword);
        console.log('⚠️  IMPORTANTE: Cambiar la contraseña inmediatamente después del primer login');
        
    } catch (error) {
        console.error('❌ Error creando usuario administrador:', error);
    }
};

/**
 * Función principal
 */
const runMigration = async () => {
    console.log('🚀 Iniciando scripts de migración...\n');
    
    await migratePasswords();
    console.log('');
    await createInitialAdmin();
    
    console.log('\n✅ Scripts de migración completados');
    process.exit(0);
};

// Ejecutar si se llama directamente
if (require.main === module) {
    runMigration();
}

module.exports = {
    migratePasswords,
    createInitialAdmin,
    runMigration
};
