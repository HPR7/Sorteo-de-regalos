'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Gift,
  Users,
  Mail,
  User,
  CheckCircle2,
  Calendar,
  DollarSign,
  Share2,
  Copy,
  Sparkles,
  QrCode,
  Info,
  Clock,
  HeartHandshake
} from 'lucide-react';

interface ExchangeData {
  id: string;
  title: string;
  description?: string;
  targetCount: number;
  budget?: string;
  eventDate?: string;
  status: 'registration' | 'completed';
  createdAt: string;
}

export default function ParticipantRegistrationPage() {
  const params = useParams();
  const exchangeId = params.id as string;

  const [exchange, setExchange] = useState<ExchangeData | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [participantsList, setParticipantsList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gift1, setGift1] = useState('');
  const [gift2, setGift2] = useState('');
  const [gift3, setGift3] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [autoDrawCompleted, setAutoDrawCompleted] = useState(false);

  // Sharing & QR
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchExchange = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/exchanges/${exchangeId}`);
      if (!res.ok) {
        throw new Error('No se pudo encontrar el intercambio de regalos.');
      }
      const data = await res.json();
      setExchange(data.exchange);
      setParticipantCount(data.participantCount || 0);
      setParticipantsList(data.participantsList || []);
    } catch (err: any) {
      setFetchError(err.message || 'Error al cargar el sorteo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (exchangeId) {
      fetchExchange();
    }
  }, [exchangeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/exchanges/${exchangeId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          gift1,
          gift2,
          gift3,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al completar el registro.');
      }

      setRegisteredSuccess(true);
      if (data.autoDrawTriggered) {
        setAutoDrawCompleted(true);
      }

      // Fire festive confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#db4969', '#1d7b4e', '#fbbf24', '#ffffff'],
      });

      fetchExchange();
    } catch (err: any) {
      setSubmitError(err.message || 'Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎁 ¡Hola! Únete al sorteo de intercambio "${exchange?.title}". Entra aquí para registrar tus 3 opciones de regalo: ${currentUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-festive-200 border-t-festive-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Cargando sorteo...</p>
      </div>
    );
  }

  if (fetchError || !exchange) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-lg text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-800">Sorteo no disponible</h2>
        <p className="text-sm text-slate-600">{fetchError || 'El enlace no es válido o ha expirado.'}</p>
      </div>
    );
  }

  const isFull = participantCount >= exchange.targetCount;
  const isCompleted = exchange.status === 'completed' || autoDrawCompleted;
  const progressPercent = Math.min(100, Math.round((participantCount / exchange.targetCount) * 100));

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-2">
      {/* Header Info Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-festive-700 via-festive-600 to-pine-700 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                <Gift className="w-3.5 h-3.5 text-gold-300" />
                Intercambio de Regalos
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{exchange.title}</h1>
              {exchange.description && (
                <p className="text-xs sm:text-sm text-festive-100 max-w-xl">{exchange.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copyShareLink}
                className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5"
                title="Copiar enlace"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
              </button>
              <button
                onClick={shareWhatsApp}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5"
                title="Compartir en WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5"
                title="Ver QR"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap gap-2.5 mt-5 text-xs">
            {exchange.budget && (
              <span className="px-3 py-1 rounded-lg bg-black/20 text-white font-medium flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gold-300" /> Presupuesto: <strong>{exchange.budget}</strong>
              </span>
            )}
            {exchange.eventDate && (
              <span className="px-3 py-1 rounded-lg bg-black/20 text-white font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gold-300" /> Fecha: <strong>{exchange.eventDate}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="p-6 bg-slate-50/70 border-b border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-festive-600" />
              Cupo de Participantes
            </span>
            <span className="text-festive-700 font-extrabold text-sm sm:text-base">
              {participantCount} de {exchange.targetCount} registrados ({progressPercent}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isFull
                  ? 'bg-gradient-to-r from-pine-500 to-pine-600'
                  : 'bg-gradient-to-r from-festive-500 via-festive-600 to-pine-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isCompleted ? (
            <div className="p-3 bg-pine-50 border border-pine-200 text-pine-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-pine-600 shrink-0" />
              <span>¡El sorteo ya se ha completado! Revisa tu bandeja de entrada o spam.</span>
            </div>
          ) : isFull ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cupo completo. El sorteo está listo para ser generado por el administrador.</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Faltan <strong>{exchange.targetCount - participantCount}</strong> personas para completar el cupo del sorteo.
            </p>
          )}
        </div>
      </div>

      {/* Main Registration Form or Success Message */}
      {registeredSuccess ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 text-center space-y-6">
          <div className="w-20 h-20 bg-pine-100 text-pine-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12 animate-bounce-subtle" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ¡Registro Exitoso, {name}! 🎉
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
              Tus 3 opciones de regalo han sido guardadas. 
              {autoDrawCompleted ? (
                <span className="block mt-2 font-bold text-pine-700 bg-pine-50 p-3 rounded-xl border border-pine-200">
                  🎉 ¡El cupo se ha completado! El sorteo se acaba de realizar y tu amigo secreto fue enviado a <u>{email}</u>.
                </span>
              ) : (
                <span className="block mt-2 text-slate-700">
                  Tan pronto se complete el cupo de <strong>{exchange.targetCount} participantes</strong>, te llegará un correo con el nombre de a quién te toca regalar y sus 3 opciones preferidas.
                </span>
              )}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-festive-50/70 border border-festive-200 text-left max-w-md mx-auto space-y-2 text-xs">
            <span className="font-extrabold uppercase text-festive-800 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Tus opciones guardadas:
            </span>
            <ul className="space-y-1 text-slate-700 pl-2">
              <li>1️⃣ <strong>{gift1}</strong></li>
              <li>2️⃣ <strong>{gift2 || 'Sorpresa'}</strong></li>
              <li>3️⃣ <strong>{gift3 || 'Sorpresa'}</strong></li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={shareWhatsApp}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 mx-auto"
            >
              <Share2 className="w-4 h-4" />
              <span>Invitar a más amigos por WhatsApp</span>
            </button>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sorteo Cerrado</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Este sorteo ya ha sido realizado y los resultados fueron enviados por correo a cada participante.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/90 overflow-hidden">
          <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-festive-100 text-festive-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Formulario de Registro</h2>
              <p className="text-xs text-slate-500">Ingresa tus datos y tus 3 deseos de regalo</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {submitError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                ⚠️ {submitError}
              </div>
            )}

            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Tu Nombre Completo <span className="text-festive-600">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej. Carlos Rodríguez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-festive-500 text-slate-800 text-sm font-medium bg-slate-50/50 hover:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Tu Correo Electrónico <span className="text-festive-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="carlos@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-festive-500 text-slate-800 text-sm font-medium bg-slate-50/50 hover:bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Aquí te llegará el nombre y las 3 opciones de tu amigo secreto.
                </span>
              </div>
            </div>

            {/* 3 Gift Options Section */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-festive-50/70 via-gold-50/40 to-pine-50/60 border border-festive-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-festive-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Tus 3 Opciones de Regalo (Wishlist)
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Escribe 3 ideas o cosas que te gustaría recibir (ej. libros, audífonos, ropa con talla, etc.). La persona a la que le toques verá estas 3 opciones.
              </p>

              {/* Gift 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🎁 Opción 1 (Tu regalo favorito / primera opción) <span className="text-festive-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Termo de café Stanley o libro de ciencia ficción"
                  value={gift1}
                  onChange={(e) => setGift1(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-festive-300 focus:ring-2 focus:ring-festive-500 text-sm bg-white font-medium"
                />
              </div>

              {/* Gift 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🎁 Opción 2 (Segunda alternativa)
                </label>
                <input
                  type="text"
                  placeholder="ej. Audífonos inalámbricos o bufanda color negro"
                  value={gift2}
                  onChange={(e) => setGift2(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-festive-300 focus:ring-2 focus:ring-festive-500 text-sm bg-white font-medium"
                />
              </div>

              {/* Gift 3 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🎁 Opción 3 (Tercera alternativa)
                </label>
                <input
                  type="text"
                  placeholder="ej. Tarjeta de regalo de Amazon / chocolates finos"
                  value={gift3}
                  onChange={(e) => setGift3(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-festive-300 focus:ring-2 focus:ring-festive-500 text-sm bg-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-festive-600 via-festive-500 to-pine-600 hover:from-festive-700 hover:to-pine-700 text-white font-black text-base sm:text-lg shadow-lg shadow-festive-600/30 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Gift className="w-5 h-5" />
              <span>{isSubmitting ? 'Guardando registro...' : '¡Registrarme en el Sorteo!'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Participants who joined */}
      {participantsList.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Ya registrados ({participantsList.length}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {participantsList.map((p, idx) => (
              <span
                key={p.id || idx}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-pine-500"></span>
                {p.name}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            🔒 Por privacidad, los correos y las 3 opciones de regalo solo se revelarán a la persona asignada durante el sorteo.
          </p>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">Código QR del Sorteo</h3>
            <p className="text-xs text-slate-500">
              Escanea con la cámara de tu celular para abrir la página de registro:
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
