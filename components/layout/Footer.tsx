import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-col items-center gap-2.5 border-t border-[var(--c-divider)] px-6 py-5 text-center text-[11px] text-[var(--c-faint)]">
      <img
        src="/assets/banner-logo.svg"
        alt="AskAServer.AI"
        style={{ height: 28, width: "auto" }}
      />
      <p>&copy; {new Date().getFullYear()} AskAServer.AI</p>
      <div className="flex gap-4">
        <Link href="/privacy" className="text-[var(--c-muted)] hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-[var(--c-muted)] hover:underline">
          Terms of Use
        </Link>
      </div>
      <a
        href="https://www.askaserver.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        Powered by AskAServer.AI
      </a>
    </footer>
  );
}
