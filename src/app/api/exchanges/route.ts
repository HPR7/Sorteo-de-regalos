import { NextRequest, NextResponse } from 'next/server';
import { getExchanges, saveExchange } from '@/lib/db';
import { Exchange } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, targetCount, budget, eventDate, adminEmail, adminPin, description } = body;

    if (!title || !targetCount || !adminEmail || !adminPin) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: título, cupo de personas, correo y PIN de administrador.' },
        { status: 400 }
      );
    }

    const count = parseInt(targetCount, 10);
    if (isNaN(count) || count < 2) {
      return NextResponse.json(
        { error: 'El número de participantes debe ser al menos 2 personas.' },
        { status: 400 }
      );
    }

    // Generate friendly ID
    const cleanTitle = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 20);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const id = `${cleanTitle || 'sorteo'}-${randomSuffix}`;

    const newExchange: Exchange = {
      id,
      title: title.trim(),
      description: description?.trim() || '',
      targetCount: count,
      budget: budget?.trim() || '',
      eventDate: eventDate?.trim() || '',
      adminEmail: adminEmail.trim(),
      adminPin: adminPin.trim(),
      status: 'registration',
      createdAt: new Date().toISOString(),
      smtpConfig: {
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        fromName: title.trim(),
        fromEmail: adminEmail.trim(),
        enabled: false,
      }
    };

    saveExchange(newExchange);

    return NextResponse.json({
      success: true,
      exchange: newExchange,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
