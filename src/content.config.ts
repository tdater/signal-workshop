import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase-kebab-case slug');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

// Fields under `internal` are provenance for the owner. They are never rendered, indexed or
// shipped; scripts/postbuild-check.mjs fails the build if any of them appears in dist/.
const internal = z
  .object({
    sources: z.array(z.string()).default([]),
    verified: isoDate.optional(),
    notes: z.string().optional(),
  })
  .default({ sources: [] });

const media = z.object({
  kind: z.enum(['screenshot', 'video', 'banner']),
  src: z.string().startsWith('/media/'),
  thumb: z.string().startsWith('/media/').optional(),
  poster: z.string().startsWith('/media/').optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(8),
  caption: z.string().min(3),
  group: z.string().default('Screens'),
  // Honest labelling of how the capture was made, shown next to the gallery.
  evidence: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: z.object({
    slug,
    title: z.string(),
    tagline: z.string().max(140),
    published: z.boolean(),
    order: z.number().int(),
    state: z.enum(['released', 'active-development', 'experimental', 'archived', 'planned']),
    stateNote: z.string(),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    motif: z.enum(['scanner', 'crt', 'trace', 'orbit']),
    icon: z.object({ src: z.string().startsWith('/media/'), alt: z.string() }).optional(),
    category: z.array(z.string()).min(1),
    platforms: z.array(z.string()).min(1),
    tags: z.array(slug).min(1),
    summary: z.string(),
    audience: z.array(z.string()).min(1),
    problem: z.string(),
    why: z.string(),
    story: z
      .array(
        z.object({
          date: isoDate,
          title: z.string(),
          body: z.string(),
          evidence: z.string(),
        }),
      )
      .default([]),
    capabilities: z.array(z.object({ group: z.string(), items: z.array(z.string()).min(1) })),
    integrations: z.array(z.object({ name: z.string(), note: z.string() })).default([]),
    requirements: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
    permissions: z.array(z.object({ name: z.string(), why: z.string() })).default([]),
    limitations: z.array(z.string()).default([]),
    editions: z
      .array(
        z.object({ id: slug, name: z.string(), fit: z.string(), appId: z.string().optional() }),
      )
      .default([]),
    media: z.array(media).default([]),
    mediaNote: z.string().optional(),
    setupTrail: z
      .array(z.object({ id: slug, title: z.string(), detail: z.string(), guide: slug.optional() }))
      .default([]),
    support: z.string(),
    internal,
  }),
});

const releases = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/releases' }),
  schema: z
    .object({
      project: slug,
      edition: slug.optional(),
      version: z.string().regex(/^\d+\.\d+(\.\d+)?$/),
      channel: z.enum(['release', 'beta', 'experimental', 'archived']),
      date: isoDate,
      current: z.boolean(),
      availability: z.enum(['available', 'unavailable']),
      publicationApproved: z.boolean(),
      artifact: z
        .object({
          url: z
            .url({ protocol: /^https$/ })
            .refine(
              (u) => !/[?&](token|sig|signature|X-Amz-)/i.test(u),
              'no credential-bearing URLs',
            ),
          filename: z.string().regex(/\.apk$/, 'only directly installable .apk files are offered'),
          type: z.literal('Android APK'),
          bytes: z.number().int().positive(),
          sha256: z.string().regex(/^[0-9a-f]{64}$/),
          checksumSource: z.string(),
        })
        .optional(),
      minimum: z.string(),
      platforms: z.array(z.string()).min(1),
      notes: z.array(z.string()).min(1),
      releasePage: z.url({ protocol: /^https$/ }),
      internal,
    })
    .refine((r) => r.availability === 'unavailable' || r.artifact, {
      message: 'available releases need an artifact record',
    }),
});

const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guides' }),
  schema: z.object({
    slug,
    title: z.string(),
    summary: z.string(),
    published: z.boolean(),
    project: slug.optional(),
    topics: z.array(z.string()).min(1),
    appliesTo: z.string(),
    time: z.string().optional(),
    prerequisites: z.array(z.string()).default([]),
    steps: z
      .array(z.object({ title: z.string(), body: z.string(), expect: z.string().optional() }))
      .min(1),
    result: z.string(),
    verify: z.string(),
    troubleshooting: z.array(z.object({ symptom: z.string(), fix: z.string() })).default([]),
    cautions: z.array(z.string()).default([]),
    reviewed: isoDate,
    internal,
  }),
});

const faqs = defineCollection({
  loader: file('./src/content/faqs.yaml'),
  schema: z.object({
    id: slug,
    question: z.string(),
    answer: z.string(),
    projects: z.array(slug).default([]),
    topics: z.array(z.string()).min(1),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    reviewed: isoDate,
    published: z.boolean(),
  }),
});

export const collections = { projects, releases, guides, faqs };
