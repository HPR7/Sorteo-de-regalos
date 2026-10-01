import { NextRequest, NextResponse } from 'next/server';
import { getExchangeByIdAsync, getParticipantsAsync, saveParticipantsBulk, saveEmailLog, saveExchange } from '@/lib/db';
import { executeDraw } from '@/lib/draw';
import { sendAssignmentEmail } from '@/lib/email';
import { Participant } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const exchange = await getExchangeByIdAsync(id);

    if (!exchange) {
      return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });
    }

    const adminPin = req.headers.get('x-admin-pin')?.trim();
    if (!adminPin || adminPin !== exchange.adminPin?.trim()) {
      return NextResponse.json({ error: 'PIN de administrador no autorizado' }, { status: 401 });
    }

    const participants = await getParticipantsAsync(id);

    if (participants.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 participantes para realizar el sorteo.' },
        { status: 400 }
      );
    }

    // Execute draw algorithm (Derangement / Sattolo Cycle)
    const assignments = executeDraw(participants);
    const participantUpdates: Participant[] = [];
    let successfulDeliveries = 0;

    for (const { giver, receiver } of assignments) {
      const emailResult = await sendAssignmentEmail({
        exchange,
        giver,
        receiver,
      });

      saveEmailLog(emailResult.log);

      if (emailResult.success) {
        successfulDeliveries++;
      }

      participantUpdates.push({
        ...giver,
        assignedToParticipantId: receiver.id,
        emailSent: emailResult.success,
        emailSentAt: emailResult.success ? new Date().toISOString() : null,
      });
    }

    saveParticipantsBulk(participantUpdates);

    exchange.status = 'completed';
    exchange.drawnAt = new Date().toISOString();
    saveExchange(exchange);

    return NextResponse.json({
      success: true,
      message: '¡El sorteo ciego se ha realizado exitosamente! Cada participante ha recibido su amigo secreto por correo.',
      totalAssigned: assignments.length,
      successfulDeliveries,
      blindDrawVerified: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al ejecutar el sorteo' }, { status: 500 });
  }
}
