import { NextRequest, NextResponse } from 'next/server';
import { getExchangeById, getParticipants, getEmailLogs, saveExchange } from '@/lib/db';
import { DrawVerification } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const exchange = getExchangeById(id);

    if (!exchange) {
      return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });
    }

    const participants = getParticipants(id);
    const adminPin = req.headers.get('x-admin-pin')?.trim();
    const isAdmin = !!adminPin && adminPin === exchange.adminPin?.trim();

    if (adminPin && !isAdmin) {
      return NextResponse.json({ error: 'El PIN ingresado es incorrecto' }, { status: 401 });
    }

    if (isAdmin) {
      // Admin data: Verifies that everyone has an assignment and emails sent,
      // but strictly conceals "who gives to whom" so the surprise is preserved!
      const isCompleted = exchange.status === 'completed';
      const assignedCount = participants.filter(p => !!p.assignedToParticipantId).length;
      const assignedTargets = new Set(participants.map(p => p.assignedToParticipantId).filter(Boolean));
      
      const allAssigned = isCompleted && assignedCount === participants.length && participants.length >= 2;
      const derangementValid = isCompleted && participants.every(p => p.assignedToParticipantId && p.assignedToParticipantId !== p.id && assignedTargets.size === participants.length);
      const emailsDeliveredCount = participants.filter(p => p.emailSent).length;

      const verification: DrawVerification = {
        isCompleted,
        totalParticipants: participants.length,
        totalAssigned: assignedCount,
        allAssigned,
        derangementValid,
        emailsDeliveredCount,
      };

      // Mask secret pairing IDs from participant objects returned to admin
      const sanitizedParticipants = participants.map(p => ({
        id: p.id,
        exchangeId: p.exchangeId,
        name: p.name,
        email: p.email,
        gift1: p.gift1,
        gift2: p.gift2,
        gift3: p.gift3,
        hasAssignment: !!p.assignedToParticipantId,
        emailSent: !!p.emailSent,
        emailSentAt: p.emailSentAt || null,
        createdAt: p.createdAt,
      }));

      // Email logs for admin (Audit trail with secret recipient hidden)
      const rawEmailLogs = getEmailLogs(id);
      const sanitizedEmailLogs = rawEmailLogs.map(log => ({
        id: log.id,
        exchangeId: log.exchangeId,
        recipientEmail: log.recipientEmail,
        recipientName: log.recipientName,
        assignedName: '🔒 Oculto (Privacidad garantizada)',
        assignedGifts: ['🔒 Oculto', '🔒 Oculto', '🔒 Oculto'] as [string, string, string],
        subject: `🎁 Notificación de Amigo Secreto enviada a ${log.recipientName}`,
        htmlContent: '',
        status: log.status,
        errorMessage: log.errorMessage,
        sentAt: log.sentAt,
      }));

      return NextResponse.json({
        exchange,
        participants: sanitizedParticipants,
        verification,
        emailLogs: sanitizedEmailLogs,
        isAdmin: true,
      });
    }

    // Public view (For participants)
    return NextResponse.json({
      exchange: {
        id: exchange.id,
        title: exchange.title,
        description: exchange.description,
        targetCount: exchange.targetCount,
        budget: exchange.budget,
        eventDate: exchange.eventDate,
        status: exchange.status,
        createdAt: exchange.createdAt,
      },
      participantCount: participants.length,
      participantsList: participants.map(p => ({
        id: p.id,
        name: p.name,
      })),
      isAdmin: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener el sorteo' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const exchange = getExchangeById(id);

    if (!exchange) {
      return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });
    }

    const adminPin = req.headers.get('x-admin-pin')?.trim();
    if (!adminPin || adminPin !== exchange.adminPin?.trim()) {
      return NextResponse.json({ error: 'PIN de administrador incorrecto' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, targetCount, budget, eventDate, smtpConfig } = body;

    if (title) exchange.title = title.trim();
    if (description !== undefined) exchange.description = description.trim();
    if (targetCount) exchange.targetCount = parseInt(targetCount, 10);
    if (budget !== undefined) exchange.budget = budget.trim();
    if (eventDate !== undefined) exchange.eventDate = eventDate.trim();
    if (smtpConfig) {
      exchange.smtpConfig = {
        ...exchange.smtpConfig,
        ...smtpConfig,
      };
    }

    saveExchange(exchange);

    return NextResponse.json({ success: true, exchange });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar el sorteo' }, { status: 500 });
  }
}
