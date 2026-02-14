import type { HomePayload } from "../../api/home";

type ContactSectionProps = {
  contact: HomePayload["contact"];
};

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">联系方式</h2>
      <p className="mt-2 text-slate-600">欢迎来信交流技术、效率与生活实践。</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          href={`mailto:${contact.email}`}
        >
          {contact.email}
        </a>
        <a
          className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
          href={contact.github}
          rel="noreferrer"
          target="_blank"
        >
          访问 GitHub
        </a>
      </div>
    </section>
  );
}
