export interface ApiKeyDocument {
  _id?: string;
  id: string;
  name: string;
  key: string;               // e.g. tm_live_...
  maskedKey: string;         // e.g. tm_live_••••••1234
  createdAt: Date;
  lastUsedAt?: Date;
  status: 'active' | 'inactive';
  rateLimitPerMin?: number;
  totalRequests: number;
}

export interface MailboxDocument {
  _id?: string;
  address: string;           // lowercase e.g. user123@domain.com
  username: string;          // user123
  domain: string;            // domain.com
  createdAt: Date;
  expiresAt: Date;           // TTL indexed by MongoDB
}

export interface MessageAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentBase64?: string;
  downloadUrl?: string;
}

export interface MessageDocument {
  _id?: string;
  id: string;
  mailboxAddress: string;    // lowercase recipient
  from: {
    address: string;
    name?: string;
  };
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  otpCode?: string;          // Extracted OTP (4-8 digits)
  verificationLinks?: string[]; // Extracted verification/activation URLs
  attachments?: MessageAttachment[];
  receivedAt: Date;
  expiresAt: Date;           // TTL indexed by MongoDB
  isRead: boolean;
}

export interface DomainDocument {
  _id?: string;
  domain: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export interface SystemSettingsDocument {
  _id?: string;
  key: 'system_settings';
  brandName: string;
  brandTagline: string;
  defaultDomain: string;
  ttlMinutes: number;        // Default email retention in minutes (e.g. 60 min)
  adminUsername: string;     // Default 'admin', customizable
  adminPassword: string;     // Default 'admin123', customizable
  masterAdminKey: string;    // Legacy fallback token
  webhookSecret: string;     // Secret shared between Cloudflare Worker & Vercel
  updatedAt: Date;
}
