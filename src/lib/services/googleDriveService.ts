import { google } from 'googleapis';
import { Readable } from 'stream';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

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
  private drive: any;
  private isDevelopment: boolean;
  private initialized: boolean = false;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private async initialize() {
    if (this.initialized) return;

    // Debug: Verificar variables de entorno
    console.log('=== DEBUG GOOGLE DRIVE CONFIG ===')
    console.log('Client Email:', process.env.GOOGLE_DRIVE_CLIENT_EMAIL ? '✅ Configurado' : '❌ No configurado')
    console.log('Client ID:', process.env.GOOGLE_DRIVE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado')
    console.log('Private Key:', process.env.GOOGLE_DRIVE_PRIVATE_KEY ? '✅ Configurado' : '❌ No configurado')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('================================')

    // En desarrollo, si no hay credenciales, usar modo simulado
    if (this.isDevelopment && (!process.env.GOOGLE_DRIVE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_CLIENT_EMAIL)) {
      console.log('⚠️  Modo desarrollo: Google Drive Service en modo simulado')
      this.drive = null
      this.initialized = true
      return
    }

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
      this.initialized = true
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
    await this.initialize(); // Ensure initialization happens before using the service

    // En modo desarrollo sin credenciales, guardar localmente
    if (this.isDevelopment && !this.drive) {
      console.log('📁 [DEV] Guardando archivo localmente:', fileName)
      
      // Crear directorio para archivos de desarrollo si no existe
      const devUploadsDir = join(process.cwd(), 'public', 'uploads', 'dev')
      if (!existsSync(devUploadsDir)) {
        mkdirSync(devUploadsDir, { recursive: true })
      }
      
      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substr(2, 9)
      const fileId = `dev-${timestamp}-${randomId}`
      const fileExtension = fileName.split('.').pop() || 'bin'
      const localFileName = `${fileId}.${fileExtension}`
      const filePath = join(devUploadsDir, localFileName)
      
      // Guardar archivo localmente
      writeFileSync(filePath, buffer)
      
      // URL local para acceder al archivo
      const localUrl = `/uploads/dev/${localFileName}`
      
      return {
        id: fileId,
        name: fileName,
        mimeType,
        size: buffer.length,
        webViewLink: localUrl,
        webContentLink: localUrl
      }
    }

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
    await this.initialize(); // Ensure initialization happens before using the service

    // En modo desarrollo sin credenciales, simular la eliminación
    if (this.isDevelopment && !this.drive) {
      console.log('🗑️ [DEV] Simulando eliminación de archivo:', fileId)
      return
    }

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
    await this.initialize(); // Ensure initialization happens before using the service

    // En modo desarrollo sin credenciales, buscar archivo local
    if (this.isDevelopment && !this.drive) {
      console.log('📄 [DEV] Buscando archivo local:', fileId)
      
      // Buscar archivo en el directorio de uploads de desarrollo
      const devUploadsDir = join(process.cwd(), 'public', 'uploads', 'dev')
      const files = require('fs').readdirSync(devUploadsDir, { withFileTypes: true })
      
      // Buscar archivo que coincida con el ID
      const file = files.find((f: any) => f.isFile() && f.name.startsWith(fileId))
      
      if (file) {
        const filePath = join(devUploadsDir, file.name)
        const stats = require('fs').statSync(filePath)
        const localUrl = `/uploads/dev/${file.name}`
        
        return {
          id: fileId,
          name: file.name,
          mimeType: this.getMimeTypeFromExtension(file.name),
          size: stats.size,
          webViewLink: localUrl,
          webContentLink: localUrl
        }
      }
      
      return null
    }

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
    await this.initialize(); // Ensure initialization happens before using the service

    // En modo desarrollo sin credenciales, simular la descarga
    if (this.isDevelopment && !this.drive) {
      console.log('⬇️ [DEV] Simulando descarga de archivo:', fileId)
      return Buffer.from('Contenido simulado del archivo')
    }

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
    await this.initialize(); // Ensure initialization happens before using the service

    // En modo desarrollo sin credenciales, simular la creación de carpeta
    if (this.isDevelopment && !this.drive) {
      console.log('📁 [DEV] Simulando creación de carpeta:', folderName)
      return `dev-folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

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
    await this.initialize(); // Ensure initialization happens before using the service

    // En modo desarrollo sin credenciales, simular la configuración de permisos
    if (this.isDevelopment && !this.drive) {
      console.log('🔓 [DEV] Simulando configuración de permisos públicos para archivo:', fileId)
      return
    }

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

  private getMimeTypeFromExtension(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav'
    }
    
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }
}

// Instancia singleton del servicio
export const googleDriveService = new GoogleDriveService(); 