export default function Features() {
  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: "50-State Coverage",
      desc: "Detailed knowledge of service of process rules for every U.S. state and federal courts.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: "Instant Answers",
      desc: "Ask in plain English and get accurate, sourced answers about process serving law.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: "Find Professionals",
      desc: "Connect with verified, premium process servers in your area through our directory.",
    },
  ];

  return (
    <article className="mx-auto max-w-[960px] px-6 pb-16">
      <p className="mx-auto mb-7 max-w-[660px] text-center text-[12px] leading-relaxed text-[var(--c-muted)]">
        AskAServer.AI is the most comprehensive AI-powered platform for service of process law. Whether you need to serve a summons, subpoena, eviction notice, or any legal document, our tools and community of professional process servers are here to help.
      </p>
      <div className="grid gap-5 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-[var(--r-lg)] border border-[var(--c-divider)] border-t-[3px] border-t-[var(--c-navy)] bg-[var(--c-surface)] p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--sh-md)]"
          >
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--r-lg)] bg-[var(--c-navy)] text-white">
              {f.icon}
            </div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-[var(--c-navy)]">{f.title}</h3>
            <p className="mx-auto text-xs leading-relaxed text-[var(--c-muted)]">{f.desc}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
