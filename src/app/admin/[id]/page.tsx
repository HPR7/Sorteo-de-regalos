'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Users,
  Gift,
  Mail,
  RefreshCw,
  Trash2,
  PlusCircle,
  Copy,
  ExternalLink,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Settings,
  Lock,
  Search,
  Sparkles,
  MailCheck,
  Server,
  EyeOff,
  Share2
} from 'lucide-react';
import { Exchange, Participant, EmailLog, SmtpConfig, DrawVerification } from '@/types';

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const exchangeId = params.id as string;

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [verification, setVerification] = useState<DrawVerification | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verification' | 'participants' | 'emails' | 'settings'>('participants');
  
  // Actions state
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDrawConfirm, setShowDrawConfirm] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add participant modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    gift1: '',
    gift2: '',
    gift3: '',
  });

  // SMTP Settings State
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: '',
    fromEmail: '',
    enabled: false,
  });
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Check saved PIN on mount
  useEffect(() => {
    const savedPin = localStorage.getItem(`admin_pin_${exchangeId}`);
    if (savedPin) {
      setPin(savedPin);
      fetchAdminData(savedPin);
    } else {
      setIsLoading(false);
    }
  }, [exchangeId]);

  const fetchAdminData = async (pinToUse: string) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const cleanPin = pinToUse.trim();
      let res = await fetch(`/api/exchanges/${exchangeId}`, {
        headers: {
          'x-admin-pin': cleanPin,
        },
      });

      // If serverless instance was cold and returned 404, check if localStorage has exchange backup
      if (res.status === 404 && typeof window !== 'undefined') {
        const cachedStr = localStorage.getItem(`exchange_${exchangeId}`);
        if (cachedStr) {
          try {
            const cachedExchange = JSON.parse(cachedStr);
            await fetch('/api/exchanges/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ exchange: cachedExchange }),
            });
            // Retry fetch with admin pin
            res = await fetch(`/api/exchanges/${exchangeId}`, {
              headers: {
                'x-admin-pin': cleanPin,
              },
            });
          } catch {
            // ignore sync errors
          }
        }
      }

      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthError('El PIN ingresado es incorrecto.');
        setIsLoading(false);
        return;
      }

      if (res.status === 404) {
        setIsAuthenticated(false);
        setAuthError(`No se encontró el sorteo "${exchangeId}". Verifica que el ID sea el correcto.`);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al cargar datos del sorteo');
      }

      const data = await res.json();
      setExchange(data.exchange);
      setParticipants(data.participants || []);
      setVerification(data.verification || null);
      setEmailLogs(data.emailLogs || []);
      if (data.exchange.smtpConfig) {
        setSmtpForm(data.exchange.smtpConfig);
      }
      setIsAuthenticated(true);
      localStorage.setItem(`admin_pin_${exchangeId}`, cleanPin);
      
      if (data.exchange.status === 'completed' && activeTab === 'participants') {
        setActiveTab('verification');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error de conexión');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setAuthError('Por favor ingresa el PIN de administrador.');
      return;
    }
    fetchAdminData(pin.trim());
  };

  const handleExecuteDraw = async () => {
    setShowDrawConfirm(false);
    setIsDrawing(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/exchanges/${exchangeId}/draw`, {
        method: 'POST',
        headers: {
          'x-admin-pin': pin,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al ejecutar el sorteo.');
      }

      // Confetti celebration!
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });

      setActionFeedback({
        type: 'success',
        message: '🎉 ¡Sorteo realizado con éxito! Todos los participantes tienen a su pareja asignada y los correos fueron despachados.',
      });

      fetchAdminData(pin);
      setActiveTab('verification');
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Error al procesar el sorteo',
      });
    } finally {
      setIsDrawing(false);
    }
  };

  const handleResendEmail = async (participantId: string, participantName: string) => {
    setResendingId(participantId);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/exchanges/${exchangeId}/resend-email`, {
        method: 'POST',
        headers: {
          'x-admin-pin': pin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al reenviar correo.');
      }

      setActionFeedback({
        type: 'success',
        message: `Correo de asignación secreta reenviado a ${participantName}.`,
      });

      fetchAdminData(pin);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Error al reenviar correo.',
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleDeleteParticipant = async (participantId: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${name}" del sorteo?`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/exchanges/${exchangeId}/participants?participantId=${encodeURIComponent(participantId)}`,
        {
          method: 'DELETE',
          headers: {
            'x-admin-pin': pin,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar participante.');
      }

      setActionFeedback({
        type: 'success',
        message: `Participante "${name}" eliminado.`,
      });

      fetchAdminData(pin);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message,
      });
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/exchanges/${exchangeId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParticipant),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar participante.');
      }

      setShowAddModal(false);
      setNewParticipant({ name: '', email: '', gift1: '', gift2: '', gift3: '' });
      setActionFeedback({
        type: 'success',
        message: `Participante "${newParticipant.name}" agregado con éxito.`,
      });

      fetchAdminData(pin);
    } catch (err: any) {
      alert(err.message || 'Error al agregar');
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    try {
      const res = await fetch(`/api/exchanges/${exchangeId}`, {
        method: 'PUT',
        headers: {
          'x-admin-pin': pin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpConfig: smtpForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar configuración');
      }

      setActionFeedback({
        type: 'success',
        message: 'Configuración de correo (SMTP) guardada exitosamente.',
      });
      fetchAdminData(pin);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message,
      });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const participantUrl = `${origin}/sorteo/${exchangeId}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(participantUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎁 ¡Hola! Te invito a unirte a nuestro intercambio de regalos "${exchange?.title}". Entra a este enlace para registrarte y anotar tus 3 opciones de regalo:\n${participantUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // 1. LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="max-w-md mx-auto my-12 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Panel del Administrador</h1>
            <p className="text-xs text-slate-500">
              Ingresa el PIN de seguridad asignado al crear el sorteo <strong>{exchangeId}</strong>
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PIN de Administrador
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Ingresa tu PIN secreto"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-mono text-center tracking-widest text-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ver Panel de Control</span>
            </button>
          </form>

          <button
            onClick={() => router.push('/')}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium pt-2 block"
          >
            ← Volver a la página principal
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !exchange) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Cargando panel de administrador...</p>
      </div>
    );
  }

  const isCompleted = exchange.status === 'completed';
  const registeredCount = participants.length;
  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in py-2">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/40 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Panel de Administrador
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                isCompleted ? 'bg-pine-100 text-pine-800' : 'bg-festive-100 text-festive-800'
              }`}>
                {isCompleted ? '✅ Sorteo Realizado (100% Ciego)' : '⏳ En Registro'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{exchange.title}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ID del Sorteo: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{exchange.id}</code>
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={shareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Invitar a participantes por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Invitar por WhatsApp</span>
            </button>
            <button
              onClick={copyShareLink}
              className="px-3.5 py-2 bg-festive-600 hover:bg-festive-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Ver QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <a
              href={`/sorteo/${exchangeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Registro</span>
            </a>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500">Inscritos</span>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {registeredCount} <span className="text-sm font-semibold text-slate-400">/ {exchange.targetCount}</span>
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500">Parejas Asignadas</span>
            <p className="text-2xl font-black text-pine-700 mt-1">
              {verification ? `${verification.totalAssigned}/${verification.totalParticipants}` : (isCompleted ? registeredCount : 0)}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500">Privacidad</span>
            <p className="text-sm font-extrabold text-indigo-700 mt-2 flex items-center gap-1">
              <EyeOff className="w-4 h-4" /> 100% Ciego & Secreto
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500">Correos Notificados</span>
            <p className="text-2xl font-black text-pine-700 mt-1">
              {participants.filter(p => p.emailSent).length} <span className="text-sm font-semibold text-slate-400">/ {participants.length}</span>
            </p>
          </div>
        </div>

        {/* Action feedback message */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-pine-50 border border-pine-200 text-pine-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-pine-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* DRAW TRIGGER BANNER */}
        {!isCompleted && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-festive-500/15 to-pine-500/10 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-4 h-4 text-festive-600" />
                {registeredCount >= exchange.targetCount
                  ? '¡Cupo completado! Listo para realizar el sorteo'
                  : `Inscritos: ${registeredCount} de ${exchange.targetCount}`}
              </h3>
              <p className="text-xs text-slate-600">
                Al ejecutar el sorteo ciego, el sistema generará las parejas sin revelar quién le regala a quién, enviando los deseos directamente al correo de cada persona.
              </p>
            </div>

            <button
              onClick={() => setShowDrawConfirm(true)}
              disabled={registeredCount < 2 || isDrawing}
              className="px-6 py-3.5 bg-gradient-to-r from-festive-600 to-festive-700 hover:from-festive-700 hover:to-festive-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-festive-600/30 transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>{isDrawing ? 'Sorteando...' : '🎉 Realizar Sorteo Ciego'}</span>
            </button>
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-1">
        {isCompleted && (
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'verification'
                ? 'bg-festive-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>🛡️ Estado de Parejas & Asignaciones</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'participants'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participantes & 3 Deseos ({participants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'emails'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MailCheck className="w-4 h-4" />
          <span>Auditoría de Envíos ({emailLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración SMTP / Envío</span>
        </button>
      </div>

      {/* TAB 1: VERIFICATION OF PAIRS (BLIND DRAW STATUS) */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* Privacy Notice Banner */}
          <div className="p-5 bg-gradient-to-r from-pine-50 via-emerald-50 to-teal-50 border border-pine-200 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-pine-900 font-extrabold text-sm sm:text-base">
              <EyeOff className="w-5 h-5 text-pine-700" />
              <span>Garantía de Sorteo Ciego & Secreto</span>
            </div>
            <p className="text-xs sm:text-sm text-pine-800 leading-relaxed">
              El sorteo se ha completado con éxito. Como administrador, puedes verificar que <strong>el 100% de los participantes tienen su pareja asignada</strong> y que sus notificaciones fueron despachadas. Las identidades exactas de los pares están <strong>cifradas y ocultas</strong> para preservar la sorpresa total entre todos los participantes (¡incluyéndote a ti!).
            </p>
          </div>

          {/* Verification Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants.map((p, idx) => (
              <div
                key={p.id || idx}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                      <span>{p.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{p.email}</p>
                  </div>

                  <span className="px-2.5 py-1 bg-pine-100 text-pine-800 rounded-full font-extrabold text-[11px] flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pareja Asignada
                  </span>
                </div>

                {/* Blind Assignment Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      🔒
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-bold">Destinatario Asignado</span>
                      <span className="font-bold text-slate-700">Secreto enviado por correo</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-pine-700 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {p.emailSent ? 'Correo Despachado' : 'Pendiente'}
                  </span>
                </div>

                {/* His/Her 3 Registered Wishlist Options */}
                <div className="p-3 bg-festive-50/40 rounded-xl border border-festive-100 text-xs space-y-1">
                  <span className="font-bold text-festive-900 flex items-center gap-1">
                    <Gift className="w-3 h-3 text-festive-600" />
                    Sus 3 Opciones de Regalo Registradas:
                  </span>
                  <ul className="text-slate-600 space-y-0.5 pl-2 font-medium">
                    <li>1. {p.gift1}</li>
                    <li>2. {p.gift2 || '-'}</li>
                    <li>3. {p.gift3 || '-'}</li>
                  </ul>
                </div>

                {/* Resend Button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleResendEmail(p.id, p.name)}
                    disabled={resendingId === p.id}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendingId === p.id ? 'animate-spin' : ''}`} />
                    <span>{resendingId === p.id ? 'Reenviando...' : 'Reenviar Correo Secreto'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS LIST TABLE */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {!isCompleted && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={shareWhatsApp}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Invitar por WhatsApp</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Agregar Manualmente</span>
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Correo Electrónico</th>
                  <th className="p-3">3 Opciones de Regalo</th>
                  <th className="p-3">Pareja Asignada</th>
                  {!isCompleted && <th className="p-3 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredParticipants.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono text-slate-600">{p.email}</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div>1. <span className="font-semibold">{p.gift1}</span></div>
                        <div className="text-slate-500">2. {p.gift2 || '-'}</div>
                        <div className="text-slate-500">3. {p.gift3 || '-'}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      {isCompleted ? (
                        <span className="px-2 py-0.5 bg-pine-100 text-pine-800 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Asignada (Ciega)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold text-[10px]">
                          Pendiente Sorteo
                        </span>
                      )}
                    </td>
                    {!isCompleted && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteParticipant(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredParticipants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No hay participantes registrados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL DELIVERY AUDIT LOG */}
      {activeTab === 'emails' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">Auditoría de Envíos de Notificaciones</h3>
            <p className="text-xs text-slate-500">
              Registro del estado de entrega a cada participante. La identidad de las parejas no es mostrada para mantener el secreto.
            </p>
          </div>

          <div className="space-y-3">
            {emailLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{log.recipientName}</span>
                    <span className="text-xs text-slate-500 font-mono">({log.recipientEmail})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'sent'
                        ? 'bg-pine-100 text-pine-700'
                        : log.status === 'simulated'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status === 'sent' ? '✅ Enviado SMTP' : log.status === 'simulated' ? '📧 Notificación Generada' : '❌ Error'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Amigo Secreto Asignado: <strong>🔒 Secreto enviado al participante</strong></span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {emailLogs.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm">
                No hay notificaciones despachadas todavía. Al realizar el sorteo se generarán automáticamente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SMTP CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-festive-600" />
              Configuración del Servidor de Correo (SMTP)
            </h3>
            <p className="text-xs text-slate-600">
              Opcional: Si deseas que los correos salgan desde tu propia cuenta de Gmail, Outlook o servidor SMTP, configura las credenciales aquí. Si lo dejas deshabilitado, la aplicación funcionará en <strong>Modo Simulación</strong> para pruebas locales.
            </p>
          </div>

          <form onSubmit={handleSaveSmtp} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="smtpEnabled"
                checked={smtpForm.enabled}
                onChange={(e) => setSmtpForm({ ...smtpForm, enabled: e.target.checked })}
                className="w-4 h-4 text-festive-600 rounded"
              />
              <label htmlFor="smtpEnabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                Habilitar envío real de correos por SMTP
              </label>
            </div>

            {smtpForm.enabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Host SMTP</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Puerto</label>
                    <input
                      type="number"
                      placeholder="587"
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value, 10) || 587 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Usuario / Correo</label>
                    <input
                      type="text"
                      placeholder="tu_correo@gmail.com"
                      value={smtpForm.user}
                      onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña / App Password</label>
                    <input
                      type="password"
                      placeholder="Contraseña de aplicación"
                      value={smtpForm.pass}
                      onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Remitente</label>
                    <input
                      type="text"
                      placeholder="Sorteo Navideño"
                      value={smtpForm.fromName}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Remitente</label>
                    <input
                      type="email"
                      placeholder="noreply@midominio.com"
                      value={smtpForm.fromEmail}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingSmtp}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              {isSavingSmtp ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: CONFIRM DRAW */}
      {showDrawConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-festive-100 text-festive-600 rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">¿Realizar el Sorteo Ciego?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se sortearán las parejas entre los <strong>{participants.length} participantes</strong> registrados. Cada uno recibirá su resultado por correo. Ni los participantes ni el administrador sabrán las parejas de los demás.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDrawConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteDraw}
                className="flex-1 py-3 bg-gradient-to-r from-festive-600 to-festive-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-festive-600/30"
              >
                ¡Sí, Realizar Sorteo!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ADD PARTICIPANT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Agregar Participante</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">🎁 Opción de Regalo 1</label>
                <input
                  type="text"
                  required
                  value={newParticipant.gift1}
                  onChange={(e) => setNewParticipant({ ...newParticipant, gift1: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">🎁 Opción de Regalo 2</label>
                <input
                  type="text"
                  value={newParticipant.gift2}
                  onChange={(e) => setNewParticipant({ ...newParticipant, gift2: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">🎁 Opción de Regalo 3</label>
                <input
                  type="text"
                  value={newParticipant.gift3}
                  onChange={(e) => setNewParticipant({ ...newParticipant, gift3: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-pine-600 hover:bg-pine-700 text-white font-bold rounded-xl text-xs"
                >
                  Guardar Participante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">Código QR de Inscripción</h3>
            <p className="text-xs text-slate-500">
              Compártelo para que los participantes lo escaneen desde sus celulares:
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/exchanges/${exchangeId}/qr`}
                alt="QR Code"
                className="w-56 h-56 mx-auto rounded-lg shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
