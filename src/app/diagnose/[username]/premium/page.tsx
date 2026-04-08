import { PremiumClient } from "./client";

export default async function PremiumPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PremiumClient username={username} />;
}
