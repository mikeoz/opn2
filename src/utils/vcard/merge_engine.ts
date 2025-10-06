/**
 * Opnli Merge Engine (MVP)
 * Deterministic, field-level selection based on confidence, recency, precedence.
 */

export type Confidence = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;
export type Precedence = "self_asserted" | "invite_update" | "first_party" | "third_party";

export interface CardEnvelope {
  card_id: string;
  person_id: string;
  owner_user_id: string;
  card_type: string;
  data: Record<string, any>;
  provenance: {
    source_system: string;
    source_uid?: string | null;
    import_kind?: string | null;
    raw_ref?: string | null;
    imported_at: string; // ISO
    transformer_version?: string | null;
    precedence?: Precedence; // derived before merge
  };
  audit: { created_at: string; updated_at: string; version: number };
  quality?: { confidence?: number; normalized?: boolean };
}

export interface MergeResult {
  winner: CardEnvelope;
  losers: CardEnvelope[];
  conflicts: Array<{ path: string; candidates: CardEnvelope[] }>;
}

export function chooseWinner(a: CardEnvelope, b: CardEnvelope, path: string): CardEnvelope | "conflict" {
  const confA = a.quality?.confidence ?? 0.5;
  const confB = b.quality?.confidence ?? 0.5;
  if (confA !== confB) return confA > confB ? a : b;

  const precOrder: Precedence[] = ["self_asserted","invite_update","first_party","third_party"];
  const pa = a.provenance.precedence ?? "third_party";
  const pb = b.provenance.precedence ?? "third_party";
  const ai = precOrder.indexOf(pa);
  const bi = precOrder.indexOf(pb);
  if (ai !== bi) return ai < bi ? a : b;

  // recency
  const ta = Date.parse(a.audit.updated_at || a.provenance.imported_at);
  const tb = Date.parse(b.audit.updated_at || b.provenance.imported_at);
  if (ta !== tb) return ta > tb ? a : b;

  return "conflict";
}

/** Merge array of same-type cards; return the chosen canonical and conflicts. */
export function mergeSameType(cards: CardEnvelope[], fieldPaths: string[]): MergeResult {
  if (cards.length === 0) throw new Error("No cards to merge");
  let winner = cards[0];
  const losers: CardEnvelope[] = [];
  const conflicts: MergeResult["conflicts"] = [];

  for (let i = 1; i < cards.length; i++) {
    const c = cards[i];
    const res = chooseWinner(winner, c, "*");
    if (res === "conflict") {
      conflicts.push({ path: "*", candidates: [winner, c] });
      // keep existing winner but record conflict
    } else if (res !== winner) {
      losers.push(winner);
      winner = res;
    } else {
      losers.push(c);
    }
  }

  // field-level copy-through: adopt missing fields from losers if not present
  for (const l of losers) {
    for (const p of fieldPaths) {
      const valW = get(winner.data, p);
      const valL = get(l.data, p);
      if ((valW === undefined || valW === null) && (valL !== undefined && valL !== null)) {
        set(winner.data, p, valL);
      }
    }
  }

  return { winner, losers, conflicts };
}

// minimal get/set helpers for dotted paths
function get(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}
function set(obj: any, path: string, value: any) {
  const parts = path.split('.'); const last = parts.pop()!;
  const tgt = parts.reduce((o, k) => (o[k] ??= {}), obj);
  tgt[last] = value;
}
