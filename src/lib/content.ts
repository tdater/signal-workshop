import { getCollection, type CollectionEntry } from 'astro:content';

// Public shapes: what pages may see after `internal` provenance is stripped.
export type Project = Omit<CollectionEntry<'projects'>['data'], 'internal'>;
export type Release = Omit<CollectionEntry<'releases'>['data'], 'internal'> & { id: string };
export type Guide = Omit<CollectionEntry<'guides'>['data'], 'internal'> & { body?: string };
export type Faq = Omit<CollectionEntry<'faqs'>['data'], 'internal'>;

// The single gate between content files and public output. Anything unpublished, and every
// `internal` field, stops here.
function stripInternal<T extends { internal?: unknown }>(item: T): Omit<T, 'internal'> {
  const { internal: _internal, ...rest } = item;
  return rest;
}

export async function getProjects() {
  const all = await getCollection('projects', ({ data }) => data.published);
  return all.map((e) => stripInternal(e.data)).sort((a, b) => a.order - b.order);
}

export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug);
}

export async function getReleases() {
  const projects = new Set((await getProjects()).map((p) => p.slug));
  const all = await getCollection(
    'releases',
    ({ data }) => data.publicationApproved && projects.has(data.project),
  );
  return all
    .map((e) => ({ ...stripInternal(e.data), id: e.id }))
    .sort((a, b) => b.date.localeCompare(a.date) || compareVersions(b.version, a.version));
}

export function compareVersions(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export async function getGuides() {
  const projects = new Set((await getProjects()).map((p) => p.slug));
  const all = await getCollection(
    'guides',
    ({ data }) => data.published && (!data.project || projects.has(data.project)),
  );
  return all
    .map((e) => ({ ...stripInternal(e.data), body: e.body }))
    .sort(
      (a, b) =>
        (a.project ?? 'zzz').localeCompare(b.project ?? 'zzz') || a.title.localeCompare(b.title),
    );
}

export async function getFaqs() {
  return (await getCollection('faqs', ({ data }) => data.published)).map((e) => e.data);
}

export function currentReleases(releases: Release[], project: string) {
  return releases.filter((r) => r.project === project && r.current);
}

export function editionName(project: Project | undefined, edition?: string) {
  if (!edition) return project?.title ?? '';
  if (edition === 'blackbox') return 'BLACKBOX';
  if (edition === 'blackbox-net') return 'BLACKBOX Net';
  return project?.editions.find((e) => e.id === edition)?.name ?? project?.title ?? edition;
}

export function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export const channelLabel: Record<Release['channel'], string> = {
  release: 'Current release',
  beta: 'Early release',
  experimental: 'Experimental',
  archived: 'Previous version',
};

export const stateLabel: Record<Project['state'], string> = {
  released: 'Released',
  'active-development': 'Active development',
  experimental: 'Experimental',
  archived: 'Archived',
  planned: 'Planned idea',
};

// Tiny, dependency-free Markdown for trusted, owner-written content: **bold**, *em*, `code`
// and [links](/path). Input is escaped first, so content can't inject markup.
export function inlineMd(text: string) {
  const esc = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return esc
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)/g, (_m, label, href) => {
      const ext = href.startsWith('https://');
      return `<a href="${href}"${ext ? ' rel="noopener noreferrer"' : ''}>${label}</a>`;
    });
}
