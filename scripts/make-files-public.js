const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');

const prisma = new PrismaClient();

// Configurar Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

async function setPublicPermissions(fileId) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    console.log(`✅ Permisos públicos establecidos para archivo: ${fileId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al establecer permisos para ${fileId}:`, error.message);
    return false;
  }
}

async function getFileInfo(fileId) {
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,size,webViewLink,webContentLink',
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error al obtener información del archivo ${fileId}:`, error.message);
    return null;
  }
}

async function makeAllFilesPublic() {
  try {
    console.log('🔍 Buscando todos los comprobantes de pago...');
    
    const comprobantes = await prisma.comprobantePago.findMany({
      select: {
        id: true,
        nombreArchivo: true,
        driveFileId: true,
        driveFileUrl: true,
        driveDownloadUrl: true,
      },
    });

    console.log(`📁 Encontrados ${comprobantes.length} comprobantes`);

    let successCount = 0;
    let errorCount = 0;

    for (const comprobante of comprobantes) {
      console.log(`\n📄 Procesando: ${comprobante.nombreArchivo} (ID: ${comprobante.driveFileId})`);
      
      try {
        // Establecer permisos públicos
        const permissionsSuccess = await setPublicPermissions(comprobante.driveFileId);
        
        if (permissionsSuccess) {
          // Obtener información actualizada del archivo
          const fileInfo = await getFileInfo(comprobante.driveFileId);
          
          if (fileInfo) {
            // Actualizar las URLs en la base de datos
            await prisma.comprobantePago.update({
              where: { id: comprobante.id },
              data: {
                driveFileUrl: fileInfo.webViewLink,
                driveDownloadUrl: fileInfo.webContentLink,
              },
            });
            
            console.log(`✅ Archivo actualizado en BD: ${comprobante.nombreArchivo}`);
            successCount++;
          } else {
            console.log(`⚠️ No se pudo obtener información del archivo: ${comprobante.nombreArchivo}`);
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error procesando ${comprobante.nombreArchivo}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`✅ Archivos procesados exitosamente: ${successCount}`);
    console.log(`❌ Archivos con errores: ${errorCount}`);
    console.log(`📁 Total de archivos: ${comprobantes.length}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  makeAllFilesPublic();
}

module.exports = { makeAllFilesPublic }; 