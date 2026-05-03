// ============================================================
// LINE friend-add flow helpers
//
// ビジネス背景:
//   無料診断の先にあった「月額500円」の有料コンテンツは、
//   公式 LINE 友だち追加で解放する。
//
// 実装上の注意:
//   本実装は「LINE 追加ボタンをクリックしたらその時点で cookie/localStorage に
//   フラグを立てる」ソフトゲート。実際に LINE で友だち追加したかまでは検証
//   していない (技術的には LIFF / LINE Login / Messaging API webhook で
//   検証可能だが MVP では未実装)。UI 文言もこれに合わせて「登録済み判定」
//   ではなく「LINE を開いた」ベースで表現している。
// ============================================================

/** Cookie name used to remember that the user has opened the LINE add link. */
export const LINE_VERIFIED_COOKIE = "kaiji_line_opened";
/** Backward-compat: 旧 cookie 名 (廃止予定) */
export const LINE_VERIFIED_COOKIE_LEGACY = "kaiji_line_verified";

/** localStorage key — mirror of the cookie so client components can react without hitting the server. */
export const LINE_VERIFIED_STORAGE_KEY = "kaiji_line_opened_v1";

/** Value both places use so we can cheaply check equality. */
export const LINE_VERIFIED_VALUE = "1";

/** Read the public LINE add-friend URL from env. Falls back to the production URL. */
export function getLineAddUrl(): string {
  return (
    process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL ??
    "https://lin.ee/SKMMS4PJ"
  );
}
