import { NextRequest, NextResponse } from 'next/server';
import { getExchangeByIdAsync, getParticipantsAsync, saveParticipant, saveEmailLog } from '@/lib/db';
import { sendAssignmentEmail } from '@/lib/email';

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

    const { participantId } = await req.json();
    if (!participantId) {
      return NextResponse.json({ error: 'ID de participante no proporcionado' }, { status: 400 });
    }

    const participants = await getParticipantsAsync(id);
    const giver = participants.find(p => p.id === participantId);

    if (!giver) {
      return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });
    }

    if (!giver.assignedToParticipantId) {
      return NextResponse.json({ error: 'Este participante aún no tiene un amigo secreto asignado' }, { status: 400 });
    }

    const receiver = participants.find(p => p.id === giver.assignedToParticipantId);
    if (!receiver) {
      return NextResponse.json({ error: 'No se encontró el destinatario asignado' }, { status: 404 });
    }

    const emailResult = await sendAssignmentEmail({
      exchange,
      giver,
      receiver,
    });

    saveEmailLog(emailResult.log);

    giver.emailSent = emailResult.success;
    giver.emailSentAt = emailResult.success ? new Date().toISOString() : null;
    saveParticipant(giver);

    return NextResponse.json({
      success: emailResult.success,
      status: emailResult.status,
      message: emailResult.success
        ? `Correo reenviado correctamente a ${giver.email}`
        : `Error al enviar correo: ${emailResult.error || 'Fallo desconocido'}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al reenviar el correo' }, { status: 500 });
  }
}
