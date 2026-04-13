import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { cookies } from "next/headers";
import { cache } from "react";
import { supabase } from "@crm/database/rest-client";

const SESSION_COOKIE_NAME = "crm_session";

function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export interface SessionUser {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  role: "admin" | "user" | "photographer" | "design_consultant" | "editor" | "customer_service";
}

interface SessionValidationResult {
  session: { id: string; expiresAt: Date } | null;
  user: SessionUser | null;
}

async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  if (!supabase) {
    return { session: null, user: null };
  }

  const sessionId = hashToken(token);

  const { data: sessionData } = await supabase
    .from("sessions")
    .select("id, user_id, expires_at")
    .eq("id", sessionId)
    .limit(1);

  if (!sessionData || sessionData.length === 0) {
    return { session: null, user: null };
  }

  const sessionRecord = sessionData[0];

  const { data: userData } = await supabase
    .from("users")
    .select("id, tenant_id, email, display_name, role, is_enabled")
    .eq("id", sessionRecord.user_id)
    .limit(1);

  if (!userData || userData.length === 0) {
    return { session: null, user: null };
  }

  const user = userData[0];

  if (!user.is_enabled) {
    return { session: null, user: null };
  }

  const expiresAt = new Date(sessionRecord.expires_at);

  if (Date.now() >= expiresAt.getTime()) {
    return { session: null, user: null };
  }

  return {
    session: { id: sessionId, expiresAt },
    user: {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    },
  };
}

export const getSession = cache(async (): Promise<SessionValidationResult> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { session: null, user: null };
  }
  return validateSessionToken(token);
});

export async function getSessionUser(): Promise<SessionUser> {
  const { user } = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
