// ============================================================
// Victim-mode mock data generator
// Used when the user has not connected X (or in dev without keys)
// ============================================================

import { createHash } from "crypto";
import type { MeData, AttackItem, AttackerSummary, AttackChannel } from "./me-types";

function hashOf(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

const NOW = new Date();
function isoMinusDays(days: number, hour = 22, minute = 14): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const RAW: Array<Omit<AttackItem, "id" | "hash" | "capturedAt"> & { _i: number }> = [
  {
    _i: 1, channel: "reply", attacker: "anonymous_hate_01",
    text: "お前みたいな奴が表舞台に立つこと自体が不愉快。早く消えてほしい、誰も求めてない。",
    created_at: isoMinusDays(1, 23, 47),
    category: "侮辱", severity: "medium", applicable_law: "刑法231条",
    emotion: "contempt",
    reasoning: "事実摘示なく対象を侮辱する公然性のある投稿。",
  },
  {
    _i: 2, channel: "reply", attacker: "anonymous_hate_01",
    text: "こいつ前に不倫してたって聞いたぞ。子供がかわいそう。",
    created_at: isoMinusDays(2, 1, 22),
    category: "名誉毀損", severity: "high", applicable_law: "刑法230条",
    emotion: "anger",
    reasoning: "未確認の事実を摘示し、社会的評価を低下させる内容。",
  },
  {
    _i: 3, channel: "mention", attacker: "anonymous_hate_01",
    text: "@you 出てくんなブス。嫌いだから視界に入ってくるな。",
    created_at: isoMinusDays(3, 22, 8),
    category: "侮辱", severity: "medium", applicable_law: "刑法231条",
    emotion: "contempt",
    reasoning: "事実摘示なく相手の容姿を侮辱する表現。",
  },
  {
    _i: 4, channel: "dm", attacker: "anonymous_hate_01",
    text: "次イベント来たら本当に何かするからな。覚悟しとけ。住所知ってるんだよ。",
    created_at: isoMinusDays(4, 2, 41),
    category: "脅迫", severity: "high", applicable_law: "刑法222条",
    emotion: "threat",
    reasoning: "身体や生活への害悪を明確に告知する内容で、脅迫罪の構成要件に該当する可能性が高い。",
  },
  {
    _i: 5, channel: "reply", attacker: "darkside_user_99",
    text: "馬鹿すぎて話にならない。生きてる価値あるの？",
    created_at: isoMinusDays(5, 0, 14),
    category: "侮辱", severity: "medium", applicable_law: "刑法231条",
    emotion: "contempt",
    reasoning: "対象の存在価値を否定する公然性のある侮辱的表現。",
  },
  {
    _i: 6, channel: "reply", attacker: "darkside_user_99",
    text: "事務所も終わりだな。こんな奴を抱えてるなんて。",
    created_at: isoMinusDays(6, 23, 30),
    category: "名誉毀損", severity: "low", applicable_law: "刑法230条",
    emotion: "mockery",
    reasoning: "業務上の信用を低下させる可能性のある表現だが、内容は具体性に欠ける。",
  },
  {
    _i: 7, channel: "mention", attacker: "darkside_user_99",
    text: "@you ファンビジネスってラクでいいよな笑　みんな騙されてるのに気づいてない",
    created_at: isoMinusDays(7, 18, 42),
    category: "名誉毀損", severity: "medium", applicable_law: "刑法230条",
    emotion: "mockery",
    reasoning: "ファンを「騙されている」とし、対象の業務への信用を低下させる。",
  },
  {
    _i: 8, channel: "reply", attacker: "throwaway_xyz",
    text: "本名△△で住所も○○だってバレてるよ。気をつけたほうがいい。",
    created_at: isoMinusDays(8, 12, 8),
    category: "プライバシー侵害", severity: "high", applicable_law: "民法709条",
    emotion: "threat",
    reasoning: "個人情報の暴露と威迫を含む。プライバシー侵害および脅迫的要素。",
  },
  {
    _i: 9, channel: "dm", attacker: "throwaway_xyz",
    text: "あなたのこと毎日見張ってる。次は実家にも行くよ。",
    created_at: isoMinusDays(9, 3, 11),
    category: "脅迫", severity: "high", applicable_law: "刑法222条",
    emotion: "threat",
    reasoning: "つきまとい・威迫を示唆する内容で、ストーカー規制法の適用可能性もある。",
  },
  {
    _i: 10, channel: "reply", attacker: "haterbot_2024",
    text: "顔も性格もブスとか終わってる",
    created_at: isoMinusDays(10, 19, 55),
    category: "侮辱", severity: "low", applicable_law: "刑法231条",
    emotion: "contempt",
    reasoning: "短文だが対象を特定可能な状態での侮辱的表現。",
  },
];

function buildAttacks(): AttackItem[] {
  const capturedAt = NOW.toISOString();
  return RAW.map((r) => {
    const id = `mock_atk_${String(r._i).padStart(3, "0")}`;
    return {
      ...r,
      id,
      hash: hashOf([id, r.created_at, r.text]),
      capturedAt,
      _i: undefined as never,
    } as AttackItem;
  });
}

function buildAttackerSummaries(attacks: AttackItem[]): AttackerSummary[] {
  const map = new Map<string, AttackerSummary>();
  for (const a of attacks) {
    const cur = map.get(a.attacker) ?? {
      username: a.attacker,
      displayName: a.attacker,
      attackCount: 0,
      worstSeverity: "low" as const,
      estimatedLevel: "C" as const,
      dominantEmotion: a.emotion ?? "anger",
      firstSeen: a.created_at,
      lastSeen: a.created_at,
      channels: { mention: 0, reply: 0, dm: 0 },
    };
    cur.attackCount += 1;
    cur.channels[a.channel] += 1;
    if (a.severity === "high") cur.worstSeverity = "high";
    else if (a.severity === "medium" && cur.worstSeverity !== "high") cur.worstSeverity = "medium";
    if (a.created_at < cur.firstSeen) cur.firstSeen = a.created_at;
    if (a.created_at > cur.lastSeen) cur.lastSeen = a.created_at;
    map.set(a.attacker, cur);
  }
  // Estimate level from attack count + worst severity
  const out = Array.from(map.values()).map((s) => {
    let level: AttackerSummary["estimatedLevel"] = "C";
    if (s.worstSeverity === "high" && s.attackCount >= 3) level = "S";
    else if (s.worstSeverity === "high") level = "A";
    else if (s.worstSeverity === "medium" && s.attackCount >= 3) level = "B";
    else if (s.worstSeverity === "medium") level = "C";
    else level = "D";
    return { ...s, estimatedLevel: level };
  });
  return out.sort((a, b) => {
    const sevWeight = { high: 100, medium: 30, low: 5 };
    return (sevWeight[b.worstSeverity] ?? 0) * b.attackCount
         - (sevWeight[a.worstSeverity] ?? 0) * a.attackCount;
  });
}

export function generateMockMe(username = "your_account"): MeData {
  const attacks = buildAttacks();
  const attackers = buildAttackerSummaries(attacks);
  const totals = {
    attacks: attacks.length,
    attackers: attackers.length,
    high: attacks.filter((a) => a.severity === "high").length,
    medium: attacks.filter((a) => a.severity === "medium").length,
    low: attacks.filter((a) => a.severity === "low").length,
  };
  return {
    username,
    displayName: `${username}（あなた）`,
    connected: false,
    includesDM: true,
    totals,
    attacks: attacks.sort((a, b) => {
      const sw = { high: 3, medium: 2, low: 1, none: 0 };
      const d = (sw[b.severity] ?? 0) - (sw[a.severity] ?? 0);
      if (d !== 0) return d;
      return b.created_at.localeCompare(a.created_at);
    }),
    attackers,
    source: "mock",
    analyzedAt: NOW.toISOString(),
  };
}
