// Problem-first Project Finder. Matching is deterministic: a problem lists project tags, and a
// project matches when it carries any of them. Edit freely; tags must exist on a project or the
// content test fails.
export const problems = [
  {
    id: 'stock-launcher',
    label: "My head unit's stock home screen is useless",
    tags: ['launcher'],
  },
  { id: 'car-data', label: 'I want live car data and fault codes on the dash', tags: ['obd2'] },
  { id: 'talk-to-car', label: 'I want to ask my car questions out loud', tags: ['voice'] },
  {
    id: 'retro-tv',
    label: 'I want retro games on my TV without setting up emulators',
    tags: ['games'],
  },
  { id: 'tv-remote', label: "My TV remote can't drive a web page", tags: ['tv'] },
  {
    id: 'scattered-notes',
    label: 'My troubleshooting notes are scattered everywhere',
    tags: ['troubleshooting'],
  },
  {
    id: 'agent-handoff',
    label: 'I keep re-explaining bugs to an AI coding agent',
    tags: ['handoff'],
  },
  { id: 'offline', label: 'It has to work without a signal', tags: ['offline'] },
  {
    id: 'ai-one-place',
    label: 'I want my AIs, notes and projects in one place on my own PC',
    tags: ['local-first'],
  },
] as const;

export const platformFilters = [
  { id: 'head-unit', label: 'Car head unit', match: 'Android head unit' },
  { id: 'tv', label: 'TV', match: ['Android TV', 'Google TV', 'Fire TV'] },
  { id: 'phone', label: 'Phone or foldable', match: ['Android phone', 'Foldable'] },
  { id: 'pc', label: 'Windows PC', match: 'Windows 11' },
] as const;
