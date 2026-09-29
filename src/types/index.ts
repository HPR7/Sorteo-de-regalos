export interface Exchange {
  id: string;
  title: string;
  description?: string;
  targetCount: number;
  budget?: string;
  eventDate?: string;
  adminEmail: string;
  adminPin: string;
  status: 'registration' | 'completed';
  createdAt: string;
  drawnAt?: string | null;
  smtpConfig?: SmtpConfig;
}

export interface Participant {
  id: string;
  exchangeId: string;
  name: string;
  email: string;
  gift1: string;
  gift2: string;
  gift3: string;
  assignedToParticipantId?: string | null;
  emailSent?: boolean;
  emailSentAt?: string | null;
  createdAt: string;
}

export interface DrawVerification {
  isCompleted: boolean;
  totalParticipants: number;
  totalAssigned: number;
  allAssigned: boolean;
  derangementValid: boolean;
  emailsDeliveredCount: number;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

export interface EmailLog {
  id: string;
  exchangeId: string;
  recipientEmail: string;
  recipientName: string;
  assignedName: string;
  assignedGifts: [string, string, string];
  subject: string;
  htmlContent: string;
  status: 'sent' | 'simulated' | 'failed';
  errorMessage?: string;
  sentAt: string;
}
