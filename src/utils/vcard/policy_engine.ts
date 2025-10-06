/**
 * Opnli Policy Engine (MVP)
 * Produces a filtered view of a person's cards for a given audience.
 */

export type Scope = "private" | "one_to_one" | "group" | "community" | "public" | "agent";

interface FieldPolicy {
  path: string;             // e.g., data.dateOfBirth.year
  scope: Scope;
  recipients?: string[];    // user:*, group:* or agent:*
  purpose?: string | null;
  expires_at?: string | null;
}
interface ConsentBlock {
  default_scope?: Scope | null;
  recipients?: string[];
  expires_at?: string | null;
}

export interface CardEnvelope {
  card_id: string;
  owner_user_id: string;
  card_type: string;
  data: Record<string, any>;
  consent?: ConsentBlock;
  fieldPolicies?: FieldPolicy[];
}

export interface AudienceCtx {
  viewer_id?: string;           // e.g., user:abc
  groups?: string[];            // ["group:classParents2025"]
  role?: "owner" | "inviter" | "public" | "agent";
}

function recipientMatches(recips: string[] | undefined, aud: AudienceCtx): boolean {
  if (!recips || recips.length === 0) return false;
  if (aud.viewer_id && recips.includes(aud.viewer_id)) return true;
  if (aud.groups) for (const g of aud.groups) if (recips.includes(g)) return true;
  return false;
}

function scopeAllows(scope: Scope, aud: AudienceCtx, cons?: ConsentBlock): boolean {
  if (scope === "public") return true;
  if (scope === "community") return aud.role !== "public"; // any signed-in community member
  if (scope === "group") return recipientMatches(cons?.recipients ?? [], aud);
  if (scope === "one_to_one") return recipientMatches(cons?.recipients ?? [], aud);
  if (scope === "agent") return aud.role === "agent";
  return false; // private
}

export function filterCardForAudience(card: CardEnvelope, aud: AudienceCtx): CardEnvelope {
  const clone: CardEnvelope = JSON.parse(JSON.stringify(card));
  const defaultScope: Scope = (card.consent?.default_scope as Scope) ?? "private";

  // Default: if default scope disallows, clear all data
  if (!scopeAllows(defaultScope, aud, card.consent)) {
    clone.data = {};
  }

  // Apply field overrides
  for (const fp of card.fieldPolicies ?? []) {
    const allow = scopeAllows(fp.scope as Scope, aud, { recipients: fp.recipients ?? [] });
    if (!allow) {
      unset(clone.data, fp.path);
    }
  }
  return clone;
}

function unset(obj: any, path: string) {
  const parts = path.split('.'); const last = parts.pop()!;
  const tgt = parts.reduce((o, k) => (o ? o[k] : undefined), obj);
  if (tgt && Object.prototype.hasOwnProperty.call(tgt, last)) delete tgt[last];
}
