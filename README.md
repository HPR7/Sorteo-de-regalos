# 🎁 Sorteo de Regalos & Amigo Secreto

Aplicación web moderna, festiva e intuitiva para organizar sorteos e intercambios de regalos (Secret Santa) con recolección de 3 opciones de regalo por participante y notificaciones automáticas por correo electrónico.

---

## 🌟 Características Principales

1. **Creación de Sorteos Personalizados**:
   - Título del evento, número total de personas requerido, presupuesto sugerido, fecha del evento y notas adicionales.
   - Seguridad con **PIN de Administrador**.

2. **Página de Registro para Participantes (`/sorteo/[id]`)**:
   - Barra de progreso interactiva en tiempo real (*ej: 3 de 6 personas registradas*).
   - Formulario de inscripción claro:
     - 👤 Nombre Completo
     - 📧 Correo Electrónico
     - 🎁 **3 Opciones de Regalo (Wishlist)**
   - Animación de confeti al registrarse y soporte para compartir por WhatsApp o código QR.

3. **Sorteo Ciego Automático (Garantía de Privacidad 100%)**:
   - Algoritmo de ciclo de Sattolo que **garantiza que nadie se regale a sí mismo**.
   - **Sorteo 100% Ciego**: El administrador puede verificar que el 100% de las parejas fueron asignadas y que todos los correos fueron despachados, **mas no puede ver entre quiénes se regalan**, preservando la sorpresa total para todos (incluyendo al organizador).

4. **Notificaciones por Correo Electrónico**:
   - Plantilla HTML festiva y responsiva enviada a cada participante con el nombre de su amigo secreto y sus **3 opciones de regalo**.
   - Soporta **Modo Simulación** (para pruebas locales inmediatas sin credenciales) y **SMTP Real** (Gmail con contraseña de app, Outlook, Brevo, Sendgrid, etc.).

5. **Panel de Administrador (`/admin/[id]`)**:
   - **Verificación de Emparejamientos**: Confirmación de que todos tienen pareja asignada sin romper el secreto.
   - Reenvío de correos individuales en caso de que alguien no haya recibido su mensaje.
   - Auditoría de entregas.
   - Posibilidad de agregar o eliminar participantes manualmente antes del sorteo.

---

## 🚀 Inicio Rápido

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
