const { google } = require('googleapis');
require('dotenv').config();

async function testGoogleDriveConnection() {
  console.log('🔍 Probando conexión con Google Drive...\n');

  // Verificar variables de entorno
  console.log('=== VERIFICACIÓN DE VARIABLES DE ENTORNO ===');
  console.log('GOOGLE_DRIVE_CLIENT_EMAIL:', process.env.GOOGLE_DRIVE_CLIENT_EMAIL ? '✅ Configurado' : '❌ No configurado');
  console.log('GOOGLE_DRIVE_CLIENT_ID:', process.env.GOOGLE_DRIVE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado');
  console.log('GOOGLE_DRIVE_PRIVATE_KEY:', process.env.GOOGLE_DRIVE_PRIVATE_KEY ? '✅ Configurado' : '❌ No configurado');
  
  if (process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
    console.log('Private Key starts with:', process.env.GOOGLE_DRIVE_PRIVATE_KEY.substring(0, 50) + '...');
    console.log('Contains BEGIN:', process.env.GOOGLE_DRIVE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----'));
    console.log('Contains END:', process.env.GOOGLE_DRIVE_PRIVATE_KEY.includes('-----END PRIVATE KEY-----'));
  }
  console.log('');

  if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
    console.error('❌ Faltan credenciales de Google Drive');
    return;
  }

  try {
    // Configurar autenticación
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: privateKey,
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Probar conexión listando archivos
    console.log('=== PROBANDO CONEXIÓN ===');
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)',
    });

    console.log('✅ Conexión exitosa con Google Drive');
    console.log('Archivos encontrados:', response.data.files?.length || 0);
    
    // Probar subida de archivo de prueba
    console.log('\n=== PROBANDO SUBIDA DE ARCHIVO ===');
    const testContent = 'Este es un archivo de prueba para verificar la conexión con Google Drive';
    const testBuffer = Buffer.from(testContent, 'utf-8');
    
    const fileMetadata = {
      name: `test-${Date.now()}.txt`,
    };

    const media = {
      mimeType: 'text/plain',
      body: require('stream').Readable.from(testBuffer),
    };

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id,name,webViewLink',
    });

    console.log('✅ Archivo de prueba subido exitosamente');
    console.log('ID del archivo:', uploadResponse.data.id);
    console.log('Nombre:', uploadResponse.data.name);
    console.log('URL:', uploadResponse.data.webViewLink);

    // Eliminar archivo de prueba
    await drive.files.delete({
      fileId: uploadResponse.data.id,
    });
    console.log('✅ Archivo de prueba eliminado');

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('Las credenciales de Google Drive están configuradas correctamente.');

  } catch (error) {
    console.error('\n❌ Error al conectar con Google Drive:');
    console.error('Mensaje:', error.message);
    
    if (error.code === 'ERR_OSSL_UNSUPPORTED') {
      console.error('\n💡 SOLUCIÓN: Este error indica un problema con OpenSSL.');
      console.error('Asegúrate de que estás ejecutando con NODE_OPTIONS=--openssl-legacy-provider');
    }
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 SOLUCIÓN: Error de autenticación. Verifica:');
      console.error('1. Que la cuenta de servicio tenga permisos de Editor en Google Drive');
      console.error('2. Que las credenciales estén correctamente copiadas');
    }
    
    console.error('\nStack trace:', error.stack);
  }
}

testGoogleDriveConnection(); 