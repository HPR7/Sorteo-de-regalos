import { NextRequest, NextResponse } from 'next/server';
import { getExchangeById, saveExchange, saveParticipant, getParticipants } from '@/lib/db';
import { Exchange, Participant } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { exchange, participants } = body;

    if (!exchange || !exchange.id) {
      return NextResponse.json({ error: 'Datos de sorteo inválidos' }, { status: 400 });
    }

    const existing = getExchangeById(exchange.id);
    if (!existing) {
      saveExchange(exchange as Exchange);
    }

    if (Array.isArray(participants)) {
      const currentParticipants = getParticipants(exchange.id);
      participants.forEach((p: Participant) => {
        if (!currentParticipants.some(cp => cp.id === p.id || cp.email === p.email)) {
          saveParticipant(p);
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Sorteo sincronizado en la instancia del servidor' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al sincronizar' }, { status: 500 });
  }
}
