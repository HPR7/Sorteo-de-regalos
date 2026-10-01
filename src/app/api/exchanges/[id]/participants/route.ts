import { NextRequest, NextResponse } from 'next/server';
import { getExchangeByIdAsync, getParticipantsAsync, saveParticipant, deleteParticipant, saveParticipantsBulk, saveEmailLog, saveExchange } from '@/lib/db';
import { Participant } from '@/types';
import { executeDraw } from '@/lib/draw';
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

    if (exchange.status === 'completed') {
      return NextResponse.json(
        { error: 'El sorteo ya ha sido realizado. No se aceptan más registros.' },
        { status: 400 }
      );
    }

    const currentParticipants = await getParticipantsAsync(id);
    if (currentParticipants.length >= exchange.targetCount) {
      return NextResponse.json(
        { error: `El cupo máximo de participantes (${exchange.targetCount}) ya se ha completado.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, email, gift1, gift2, gift3 } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Nombre y correo electrónico son obligatorios.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Por favor ingresa un correo electrónico válido.' },
        { status: 400 }
      );
    }

    // Check if email already registered in this exchange
    const normalizedEmail = email.trim().toLowerCase();
    const alreadyRegistered = currentParticipants.some(
      p => p.email.toLowerCase() === normalizedEmail
    );
    if (alreadyRegistered) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado en este sorteo.' },
        { status: 400 }
      );
    }

    const newParticipant: Participant = {
      id: 'part_' + Math.random().toString(36).substring(2, 9),
      exchangeId: id,
      name: name.trim(),
      email: normalizedEmail,
      gift1: gift1?.trim() || 'Cualquier detalle',
      gift2: gift2?.trim() || 'Sorpresa',
      gift3: gift3?.trim() || 'Sorpresa',
      emailSent: false,
      createdAt: new Date().toISOString(),
    };

    saveParticipant(newParticipant);

    const updatedParticipants = [...currentParticipants, newParticipant];
    let autoDrawTriggered = false;

    // Check if target count is reached to trigger auto-draw
    if (updatedParticipants.length === exchange.targetCount) {
      try {
        const assignments = executeDraw(updatedParticipants);
        const participantUpdates: Participant[] = [];

        for (const { giver, receiver } of assignments) {
          const emailResult = await sendAssignmentEmail({
            exchange,
            giver,
            receiver,
          });

          saveEmailLog(emailResult.log);

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

        autoDrawTriggered = true;
      } catch (drawErr) {
        console.error('Error in auto draw:', drawErr);
      }
    }

    return NextResponse.json({
      success: true,
      participant: {
        id: newParticipant.id,
        name: newParticipant.name,
      },
      currentCount: updatedParticipants.length,
      targetCount: exchange.targetCount,
      autoDrawTriggered,
      message: autoDrawTriggered
        ? '¡Cupo completado! El sorteo se ha realizado y se han enviado los correos.'
        : '¡Te has registrado con éxito!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al registrar participante' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const exchange = await getExchangeByIdAsync(id);

    if (!exchange) {
      return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });
    }

    const adminPin = req.headers.get('x-admin-pin');
    if (!adminPin || adminPin !== exchange.adminPin) {
      return NextResponse.json({ error: 'PIN de administrador no autorizado' }, { status: 401 });
    }

    if (exchange.status === 'completed') {
      return NextResponse.json(
        { error: 'No se pueden eliminar participantes después de haber realizado el sorteo.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json({ error: 'ID de participante no especificado' }, { status: 400 });
    }

    deleteParticipant(participantId);

    return NextResponse.json({ success: true, message: 'Participante eliminado' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar participante' }, { status: 500 });
  }
}
