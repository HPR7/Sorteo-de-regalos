import { NextRequest, NextResponse } from 'next/server';
import { getExchanges, getParticipants } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { identifier, pin } = await req.json();

    if (!identifier?.trim()) {
      return NextResponse.json(
        { error: 'Por favor ingresa el ID del sorteo o tu correo de administrador.' },
        { status: 400 }
      );
    }

    const cleanId = identifier.trim();
    const cleanPin = pin ? pin.trim() : '';
    const exchanges = getExchanges();

    // 1. Check if identifier matches an Exchange ID
    const byId = exchanges.find(e => e.id.toLowerCase() === cleanId.toLowerCase());
    if (byId) {
      if (cleanPin && byId.adminPin.trim() !== cleanPin) {
        return NextResponse.json(
          { error: 'El PIN de administrador ingresado es incorrecto para este sorteo.' },
          { status: 401 }
        );
      }
      return NextResponse.json({
        success: true,
        type: 'admin',
        exchanges: [{ id: byId.id, title: byId.title, status: byId.status }],
      });
    }

    // 2. Check if identifier is an Admin Email
    const byAdminEmail = exchanges.filter(
      e => e.adminEmail.trim().toLowerCase() === cleanId.toLowerCase()
    );

    if (byAdminEmail.length > 0) {
      if (cleanPin) {
        const matchingPin = byAdminEmail.filter(e => e.adminPin.trim() === cleanPin);
        if (matchingPin.length === 0) {
          return NextResponse.json(
            { error: 'El PIN de administrador no coincide con los sorteos creados con este correo.' },
            { status: 401 }
          );
        }
        return NextResponse.json({
          success: true,
          type: 'admin',
          exchanges: matchingPin.map(e => ({ id: e.id, title: e.title, status: e.status })),
        });
      }

      return NextResponse.json({
        success: true,
        type: 'admin',
        exchanges: byAdminEmail.map(e => ({ id: e.id, title: e.title, status: e.status })),
      });
    }

    // 3. Check if identifier is a Participant Email (helping participants check their status)
    const allParticipants = getParticipants();
    const participantMatches = allParticipants.filter(
      p => p.email.trim().toLowerCase() === cleanId.toLowerCase()
    );

    if (participantMatches.length > 0) {
      return NextResponse.json({
        success: true,
        type: 'participant',
        message: 'Eres participante en uno o más sorteos. Los resultados de amigos secretos se envían directamente a tu correo electrónico al completarse el sorteo.',
        exchanges: participantMatches.map(p => {
          const ex = exchanges.find(e => e.id === p.exchangeId);
          return {
            id: p.exchangeId,
            title: ex ? ex.title : 'Sorteo',
            status: ex ? ex.status : 'registration',
            emailSent: p.emailSent,
          };
        }),
      });
    }

    return NextResponse.json(
      { error: `No se encontró ningún sorteo registrado con el ID o correo "${cleanId}".` },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en la búsqueda' }, { status: 500 });
  }
}
