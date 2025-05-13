const fs = require('fs')
const path = require('path')

const leafletDistPath = path.join(__dirname, '../node_modules/leaflet/dist/images')
const publicPath = path.join(__dirname, '../public')

// Asegurarse de que el directorio public existe
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true })
}

// Copiar los archivos de íconos
const files = [
  'marker-icon.png',
  'marker-icon-2x.png',
  'marker-shadow.png'
]

files.forEach(file => {
  fs.copyFileSync(
    path.join(leafletDistPath, file),
    path.join(publicPath, file)
  )
})

console.log('Archivos de íconos de Leaflet copiados exitosamente') 