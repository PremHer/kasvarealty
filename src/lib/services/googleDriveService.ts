import { google } from 'googleapis';
import { Readable } from 'stream';

// Configurar Node.js para usar el algoritmo de firma compatible
process.env.NODE_OPTIONS = '--openssl-legacy-provider';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink?: string;
}

export class GoogleDriveService {
  private drive;

  constructor() {
    // Debug: Verificar variables de entorno
    console.log('=== DEBUG GOOGLE DRIVE CONFIG ===')
    console.log('Client Email:', process.env.GOOGLE_DRIVE_CLIENT_EMAIL ? '✅ Configurado' : '❌ No configurado')
    console.log('Client ID:', process.env.GOOGLE_DRIVE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado')
    console.log('Private Key:', process.env.GOOGLE_DRIVE_PRIVATE_KEY ? '✅ Configurado' : '❌ No configurado')
    
    if (process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
      console.log('Private Key starts with:', process.env.GOOGLE_DRIVE_PRIVATE_KEY.substring(0, 50) + '...')
      console.log('Private Key contains BEGIN:', process.env.GOOGLE_DRIVE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----'))
      console.log('Private Key contains END:', process.env.GOOGLE_DRIVE_PRIVATE_KEY.includes('-----END PRIVATE KEY-----'))
    }
    console.log('================================')

    // Configurar la autenticación con Google Drive
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY
    
    if (!privateKey || !process.env.GOOGLE_DRIVE_CLIENT_EMAIL) {
      throw new Error('Las credenciales de Google Drive no están configuradas correctamente')
    }
    
    // Limpiar y formatear la clave privada
    let formattedPrivateKey = privateKey
    
    // Remover comillas si las tiene
    formattedPrivateKey = formattedPrivateKey.replace(/^["']|["']$/g, '')
    
    // Asegurar que tenga los saltos de línea correctos
    if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('Error: La clave privada no tiene el formato correcto')
      throw new Error('Formato de clave privada inválido')
    }
    
    // Reemplazar \n literales con saltos de línea reales
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n')

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
          private_key: formattedPrivateKey,
          client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive Service inicializado correctamente')
    } catch (error) {
      console.error('❌ Error al inicializar Google Drive Service:', error)
      throw new Error('Error al configurar Google Drive Service')
    }
  }

  async uploadFile(
    fileName: string,
    mimeType: string,
    buffer: Buffer,
    folderId?: string
  ): Promise<GoogleDriveFile> {
    try {
      // Crear el stream de lectura desde el buffer
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      // Configurar los metadatos del archivo
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      // Configurar los medios
      const media = {
        mimeType,
        body: stream,
      };

      // Subir el archivo
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id,name,mimeType,size,webViewLink,webContentLink',
      });

      const file = response.data;

      if (!file.id || !file.name || !file.mimeType || !file.webViewLink) {
        throw new Error('Error al subir archivo a Google Drive');
      }

      // Establecer permisos públicos para que el archivo sea accesible
      try {
        await this.drive.permissions.create({
          fileId: file.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
        console.log(`✅ Permisos públicos establecidos para archivo: ${file.name}`);
      } catch (permissionError) {
        console.error('⚠️ Error al establecer permisos públicos:', permissionError);
        // Continuar aunque falle la configuración de permisos
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: parseInt(file.size || '0'),
        webViewLink: file.webViewLink || '',
        webContentLink: file.webContentLink || undefined,
      };
    } catch (error) {
      console.error('Error al subir archivo a Google Drive:', error);
      throw new Error('Error al subir archivo a Google Drive');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      });
    } catch (error) {
      console.error('Error al eliminar archivo de Google Drive:', error);
      throw new Error('Error al eliminar archivo de Google Drive');
    }
  }

  async getFileInfo(fileId: string): Promise<GoogleDriveFile | null> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,webViewLink,webContentLink',
      });

      const file = response.data;

      if (!file.id || !file.name || !file.mimeType || !file.webViewLink) {
        return null;
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: parseInt(file.size || '0'),
        webViewLink: file.webViewLink || '',
        webContentLink: file.webContentLink || undefined,
      };
    } catch (error) {
      console.error('Error al obtener información del archivo:', error);
      return null;
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      console.error('Error al descargar archivo de Google Drive:', error);
      throw new Error('Error al descargar archivo de Google Drive');
    }
  }

  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: undefined,
        fields: 'id',
      });

      if (!response.data.id) {
        throw new Error('Error al crear carpeta en Google Drive');
      }

      return response.data.id;
    } catch (error) {
      console.error('Error al crear carpeta en Google Drive:', error);
      throw new Error('Error al crear carpeta en Google Drive');
    }
  }

  async setPublicPermissions(fileId: string): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      console.log(`✅ Permisos públicos establecidos para archivo: ${fileId}`);
    } catch (error) {
      console.error('Error al establecer permisos públicos:', error);
      throw new Error('Error al establecer permisos públicos');
    }
  }
}

// Instancia singleton del servicio
export const googleDriveService = new GoogleDriveService(); 