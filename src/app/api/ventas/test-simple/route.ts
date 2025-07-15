import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Endpoint de ventas funcionando' })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Datos recibidos en test:', body)
    
    return NextResponse.json({ 
      message: 'Datos recibidos correctamente',
      data: body 
    })
  } catch (error) {
    console.error('Error en test:', error)
    return NextResponse.json({ error: 'Error en test' }, { status: 500 })
  }
} 