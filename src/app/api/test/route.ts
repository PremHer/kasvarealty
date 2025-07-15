import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Servidor funcionando correctamente' })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      message: 'POST funcionando',
      receivedData: body 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error en POST' }, { status: 500 })
  }
} 