import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex">
          <Logo size="sm" />
        </Link>
      </div>
    </header>
  );
}
