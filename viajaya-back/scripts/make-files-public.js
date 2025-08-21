const cloudinary = require('../src/config/cloudinaryConfig');
const { Purchase } = require('../src/models');

// Script para hacer públicos los archivos existentes
async function makeExistingFilesPublic() {
  try {
    console.log('🔄 Buscando compras con comprobantes...');
    
    const purchases = await Purchase.findAll({
      where: {
        comprobante_url: {
          [require('sequelize').Op.not]: null
        }
      }
    });

    console.log(`📋 Encontradas ${purchases.length} compras con comprobantes`);

    for (const purchase of purchases) {
      try {
        // Extraer public_id de la URL
        const url = purchase.comprobante_url;
        const match = url.match(/\/raw\/upload\/v\d+\/(.+)\.pdf$/);
        
        if (match) {
          const publicId = match[1];
          console.log(`🔧 Haciendo público: ${publicId}`);
          
          // Actualizar archivo para que sea público
          const result = await cloudinary.uploader.update_access_mode(publicId, {
            access_mode: 'public'
          });
          
          console.log(`✅ Actualizado: ${result.public_id}`);
        } else {
          console.log(`⚠️ No se pudo extraer public_id de: ${url}`);
        }
      } catch (error) {
        console.error(`❌ Error al actualizar comprobante ${purchase.id}:`, error.message);
      }
    }

    console.log('🎉 Proceso completado');
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

makeExistingFilesPublic();
