'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Gift, 
  Users, 
  Mail, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Calendar, 
  DollarSign, 
  FileText,
  ShieldCheck,
  Send,
  Eye,
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    targetCount: 6,
    budget: '$20 USD',
    eventDate: '',
    adminEmail: '',
    adminPin: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Created Success Modal
  const [createdExchange, setCreatedExchange] = useState<{
    id: string;
    title: string;
    targetCount: number;
    pin: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  // Access Existing Exchange State
  const [accessId, setAccessId] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isAccessing, setIsAccessing] = useState(false);
  const [multipleExchanges, setMultipleExchanges] = useState<{ id: string; title: string; status: string }[] | null>(null);
  const [participantInfo, setParticipantInfo] = useState<{ message: string; exchanges: any[] } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear el sorteo');
      }

      if (data.exchange && typeof window !== 'undefined') {
        localStorage.setItem(`exchange_${data.exchange.id}`, JSON.stringify(data.exchange));
        localStorage.setItem(`admin_pin_${data.exchange.id}`, formData.adminPin.trim());
      }

      setCreatedExchange({
        id: data.exchange.id,
        title: data.exchange.title,
        targetCount: data.exchange.targetCount,
        pin: formData.adminPin.trim(),
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccessAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError('');
    setMultipleExchanges(null);
    setParticipantInfo(null);

    const cleanIdentifier = accessId.trim();
    const cleanPin = accessPin.trim();

    if (!cleanIdentifier) {
      setAccessError('Ingresa el ID del sorteo o tu correo de administrador.');
      return;
    }

    setIsAccessing(true);
    try {
      const res = await fetch('/api/exchanges/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdentifier, pin: cleanPin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo acceder al sorteo.');
      }

      if (data.type === 'participant') {
        setParticipantInfo({
          message: data.message,
          exchanges: data.exchanges || [],
        });
        return;
      }

      if (data.exchanges && data.exchanges.length === 1) {
        const targetExchange = data.exchanges[0];
        if (cleanPin) {
          localStorage.setItem(`admin_pin_${targetExchange.id}`, cleanPin);
        }
        router.push(`/admin/${encodeURIComponent(targetExchange.id)}`);
      } else if (data.exchanges && data.exchanges.length > 1) {
        setMultipleExchanges(data.exchanges);
      }
    } catch (err: any) {
      setAccessError(err.message || 'Error al buscar el sorteo.');
    } finally {
      setIsAccessing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'participant' | 'admin') => {
    navigator.clipboard.writeText(text);
    if (type === 'participant') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2500);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-16 py-4 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-festive-50 border border-festive-200 text-festive-800 text-xs sm:text-sm font-semibold shadow-sm">
          <Sparkles className="w-4 h-4 text-festive-600 animate-spin-slow" />
          <span>Intercambios con 3 opciones de regalo & correos automáticos</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Organiza tu Sorteo de Regalos{' '}
          <span className="bg-gradient-to-r from-festive-600 via-festive-500 to-pine-600 bg-clip-text text-transparent">
            Fácil, Elegante y Secreto
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Cada participante anota <strong>3 deseos de regalo</strong> y su correo. Al completarse los cupos, el sorteo se realiza automáticamente y cada persona recibe su resultado por correo. 
          <span className="block mt-1 font-medium text-slate-700">Solo tú como administrador podrás ver la lista completa.</span>
        </p>
      </section>

      {/* Main Creation Card */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/90 overflow-hidden">
          <div className="bg-gradient-to-r from-festive-600 via-festive-700 to-pine-800 p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-festive-200">
                  Paso 1 de 2
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center gap-2.5">
                  <Gift className="w-6 h-6 text-gold-300" />
                  Crear Nuevo Intercambio
                </h2>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs text-white/80">Configuración Rápida</span>
                <p className="text-sm font-semibold text-gold-200">Tarda menos de 1 min</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Nombre del Intercambio / Evento <span className="text-festive-600">*</span>
              </label>
              <div className="relative">
                <Gift className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ej. Navidad en Familia 2026, Amigo Secreto Oficina"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-festive-500 focus:border-transparent text-slate-800 font-medium placeholder:text-slate-400 bg-slate-50/50 hover:bg-white transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Target Count & Quick Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-800">
                  Número Total de Personas <span className="text-festive-600">*</span>
                </label>
                <span className="text-xs text-slate-500">Cupo para el sorteo automático</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="relative">
                  <Users className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="2"
                    max="100"
                    required
                    value={formData.targetCount}
                    onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value, 10) || 2 })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-festive-500 focus:border-transparent text-slate-800 font-bold text-base bg-slate-50/50 hover:bg-white transition-all"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[4, 6, 8, 10, 12, 15].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setFormData({ ...formData, targetCount: count })}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        formData.targetCount === count
                          ? 'bg-festive-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count} personas
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Presupuesto Sugerido <span className="text-xs font-normal text-slate-500">(opcional)</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ej. $20 USD, $300 MXN o Libre"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-festive-500 text-slate-800 text-sm bg-slate-50/50 hover:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Fecha del Evento <span className="text-xs font-normal text-slate-500">(opcional)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-festive-500 text-slate-800 text-sm bg-slate-50/50 hover:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Datos del Administrador (Para gestionar y ver los resultados)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu Correo Electrónico <span className="text-festive-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="admin@correo.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-festive-500 text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN / Clave de Administrador <span className="text-festive-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="ej. 1234 o secreto2026"
                      value={formData.adminPin}
                      onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-festive-500 text-sm bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-amber-800/80">
                🔒 Solo con este PIN podrás ver la lista final de amigos secretos y gestionar a los participantes.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Reglas o Notas Adicionales <span className="text-xs font-normal text-slate-500">(opcional)</span>
              </label>
              <div className="relative">
                <FileText className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <textarea
                  rows={2}
                  placeholder="ej. La entrega de regalos será en la cena navideña. ¡Recuerden traer el regalo envuelto!"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-festive-500 text-slate-800 text-sm bg-slate-50/50 hover:bg-white resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-festive-600 via-festive-500 to-pine-600 hover:from-festive-700 hover:to-pine-700 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-festive-600/30 hover:shadow-festive-600/50 transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Creando sorteo...</span>
              ) : (
                <>
                  <span>Crear Sorteo y Generar Enlace</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* SUCCESS MODAL AFTER CREATION */}
      {createdExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-slate-100">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-pine-100 text-pine-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                ¡Tu Sorteo está Listo! 🎉
              </h3>
              <p className="text-sm text-slate-600">
                Sorteo: <strong>{createdExchange.title}</strong> ({createdExchange.targetCount} participantes)
              </p>
            </div>

            <div className="space-y-4">
              {/* Participant Share Link */}
              <div className="p-4 rounded-2xl bg-festive-50 border border-festive-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-festive-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Enlace para Participantes
                  </span>
                  <span className="text-xs text-festive-600 font-medium">Comparte por WhatsApp / Correo</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${origin}/sorteo/${createdExchange.id}`}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-festive-300 font-mono text-slate-800"
                  />
                  <button
                    onClick={() => copyToClipboard(`${origin}/sorteo/${createdExchange.id}`, 'participant')}
                    className="px-3 py-2 bg-festive-600 hover:bg-festive-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Admin Dashboard Link */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Enlace Privado de Administrador
                  </span>
                  <span className="text-xs font-bold text-amber-700">PIN: {createdExchange.pin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${origin}/admin/${createdExchange.id}`}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-amber-300 font-mono text-slate-800"
                  />
                  <button
                    onClick={() => copyToClipboard(`${origin}/admin/${createdExchange.id}`, 'admin')}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedAdmin ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  localStorage.setItem(`admin_pin_${createdExchange.id}`, createdExchange.pin);
                  router.push(`/admin/${createdExchange.id}`);
                }}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ir al Panel de Administrador
              </button>
              <button
                onClick={() => router.push(`/sorteo/${createdExchange.id}`)}
                className="py-3 px-4 bg-festive-100 hover:bg-festive-200 text-festive-800 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Página de Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it works section */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            ¿Cómo Funciona el Sorteo?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Diseñado para que nadie se quede sin su regalo preferido y el proceso sea 100% transparente y secreto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-festive-100 text-festive-700 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="font-bold text-slate-800 text-base">Creas el Evento</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Defines el nombre, cupo de personas y presupuesto sugerido.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="font-bold text-slate-800 text-base">3 Opciones de Regalo</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cada participante entra a su enlace e ingresa su correo y sus 3 opciones preferidas de regalo.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pine-100 text-pine-700 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="font-bold text-slate-800 text-base">Sorteo y Correos</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Al completarse el número de personas, se hace el sorteo y a cada quien le llega por correo su asignado y sus 3 opciones.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
              4
            </div>
            <h3 className="font-bold text-slate-800 text-base">Control de Administrador</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Solo tú como administrador puedes ver la lista completa de asignaciones y reenviar correos si es necesario.
            </p>
          </div>
        </div>
      </section>

      {/* Admin Access Box */}
      <section id="admin-login" className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-slate-800">
            <Lock className="w-5 h-5 text-pine-600" />
            <div>
              <h3 className="font-bold text-base">¿Ya creaste un sorteo? Acceder como Administrador</h3>
              <p className="text-xs text-slate-500">Ingresa tu correo de administrador (o ID del sorteo) y tu PIN</p>
            </div>
          </div>

          {accessError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              ⚠️ {accessError}
            </div>
          )}

          {participantInfo && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs rounded-2xl space-y-2">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Información para Participantes</span>
              </div>
              <p>{participantInfo.message}</p>
              <div className="space-y-1.5 pt-1">
                {participantInfo.exchanges.map((ex: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-800 font-bold">{ex.title}</strong>
                      <span className="text-[11px] text-slate-500">
                        {ex.status === 'completed' ? '🎉 Sorteo completado' : '⏳ En fase de registro'}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/sorteo/${ex.id}`)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Ver Sorteo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {multipleExchanges && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 text-xs rounded-2xl space-y-2">
              <span className="font-bold text-amber-900">Tienes varios sorteos asociados a este correo. Selecciona uno:</span>
              <div className="space-y-1.5">
                {multipleExchanges.map((ex) => (
                  <div key={ex.id} className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-800 font-bold">{ex.title}</strong>
                      <span className="text-[11px] text-slate-500">ID: {ex.id}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (accessPin.trim()) {
                          localStorage.setItem(`admin_pin_${ex.id}`, accessPin.trim());
                        }
                        router.push(`/admin/${encodeURIComponent(ex.id)}`);
                      }}
                      className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Abrir Panel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAccessAdmin} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Correo de Admin o ID del Sorteo
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. pilar@gmail.com o sorteo-xyz"
                  value={accessId}
                  onChange={(e) => setAccessId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-pine-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  PIN de Administrador
                </label>
                <input
                  type="password"
                  required
                  placeholder="PIN secreto"
                  value={accessPin}
                  onChange={(e) => setAccessPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-pine-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAccessing}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{isAccessing ? 'Buscando sorteo...' : 'Acceder al Panel de Control'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
