// ============================================================
// Victim mode types — /me dashboard
// "Me" = the authenticated user analyzing attacks against themselves
// ============================================================

import type { Severity, CategoryName, DominantEmotion } from "./diagnose-types";

export type AttackChannel = "mention" | "reply" | "dm";

export interface AttackItem {
  id: string;
  channel: AttackChannel;
  attacker: string; // attacker's @handle
  text: string;
  created_at: string;
  category: CategoryName | "該当なし";
  severity: Severity | "none";
  applicable_law: string;
  emotion?: DominantEmotion;
  reasoning: string;
  /** SHA-256 of `${id}|${created_at}|${text}` */
  hash: string;
  /** ISO timestamp when captured */
  capturedAt: string;
}

export interface AttackerSummary {
  username: string;
  displayName: string;
  attackCount: number;
  /** Worst severity observed from this attacker */
  worstSeverity: Severity;
  /** Their estimated S/A/B/C/D/E if you were to diagnose them */
  estimatedLevel: "S" | "A" | "B" | "C" | "D" | "E";
  dominantEmotion: DominantEmotion;
  firstSeen: string;
  lastSeen: string;
  /** Channel breakdown */
  channels: { mention: number; reply: number; dm: number };
}

export interface MeData {
  username: string;
  displayName: string;
  /** True when X account is actually connected via OAuth */
  connected: boolean;
  /** True if DMs were included in this fetch (requires dm.read scope) */
  includesDM: boolean;
  /** Aggregated counters */
  totals: {
    attacks: number;
    attackers: number;
    high: number;
    medium: number;
    low: number;
  };
  /** All attacks (sorted by severity desc, then date desc) */
  attacks: AttackItem[];
  /** Attacker leaderboard sorted by severity * count */
  attackers: AttackerSummary[];
  source: "x-api+claude" | "mock";
  analyzedAt: string;
}
