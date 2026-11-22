import { connection } from "next/server";
import { AppShell } from "@/components/AppShell";

/**
 * The per-request CSP nonce is only applied while dynamically rendering, so
 * this page must not be statically prerendered at build time.
 */
export default async function HomePage() {
  await connection();

  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <AppShell />
    </main>
  );
}
