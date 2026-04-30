// ============================================================
// Next.js proxy (Next 16+ の新ファイル規約。旧名 middleware.ts)
//
// /admin 以下のすべてのリクエストに Basic 認証をかける。
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, unauthorizedResponse } from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export function proxy(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!isAuthorized(auth)) {
    return unauthorizedResponse();
  }
  return NextResponse.next();
}
