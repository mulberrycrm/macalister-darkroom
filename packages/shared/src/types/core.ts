export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "admin" | "user";
  isEnabled: boolean;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}
