import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const targetUrl = `${origin}/sorteo/${id}`;

    const qrPng = await QRCode.toBuffer(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      }
    });

    return new Response(new Uint8Array(qrPng), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al generar código QR' }, { status: 500 });
  }
}
