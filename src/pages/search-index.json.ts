import type { APIRoute } from 'astro';
import { getProjects, getReleases, getGuides, getFaqs, editionName } from '../lib/content';

// Built from published content only, through the same gate as the pages.
export const GET: APIRoute = async () => {
  const projects = await getProjects();
  const docs = [
    ...projects.map((p) => ({
      t: p.title,
      k: 'Project',
      u: `/projects/${p.slug}`,
      d: p.tagline,
      x: [
        p.summary,
        p.problem,
        ...p.capabilities.flatMap((c) => c.items),
        ...p.limitations,
        ...p.platforms,
        ...p.tags,
      ].join(' '),
    })),
    ...(await getGuides()).map((g) => ({
      t: g.title,
      k: 'Guide',
      u: `/guides/${g.slug}`,
      d: g.summary,
      x: [
        g.appliesTo,
        ...g.topics,
        ...g.steps.map((s) => `${s.title} ${s.body}`),
        ...g.troubleshooting.map((t) => `${t.symptom} ${t.fix}`),
      ].join(' '),
    })),
    ...(await getFaqs()).map((f) => ({
      t: f.question,
      k: 'FAQ',
      u: `/faq#${f.id}`,
      d: f.answer.slice(0, 160),
      x: `${f.answer} ${f.topics.join(' ')}`,
    })),
    ...(await getReleases())
      .filter((r) => r.current)
      .map((r) => {
        const p = projects.find((x) => x.slug === r.project);
        return {
          t: `${editionName(p, r.edition)} v${r.version}`,
          k: 'Release',
          u: `/downloads#passport-${r.id}`,
          d: r.notes[0],
          x: r.notes.join(' '),
        };
      }),
  ];
  return new Response(JSON.stringify(docs), { headers: { 'content-type': 'application/json' } });
};
