import type { APIRoute } from 'astro';

// robots.txt only asks crawlers politely. Real protection for /admin is server-side auth.
export const GET: APIRoute = ({ site }) => {
  const lines = [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /feedback/received',
  ];
  if (site) lines.push(`Sitemap: ${new URL('/sitemap-index.xml', site).href}`);
  return new Response(lines.join('\n') + '\n', { headers: { 'content-type': 'text/plain' } });
};
