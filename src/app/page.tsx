import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Aanwezigheidsregistratie
        </h1>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Inloggen
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg border border-primary px-5 py-3 text-primary hover:bg-accent"
          >
            Registreren
          </Link>
        </div>
      </div>
    </main>
  );
}
