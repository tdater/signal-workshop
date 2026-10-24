---
# Copy to src/content/guides/<slug>.md. The file name must equal `slug`.
slug: my-guide
title: Do the thing with My Project
summary: One sentence saying what the reader will have at the end.
published: false
project: my-project # omit for site-wide guides
topics: [Installation] # used by filters and search
appliesTo: My Project 1.0 · Android 10+
time: About 10 minutes
prerequisites:
  - What they need before starting.
steps:
  - title: Short imperative title
    body: What to do. Inline Markdown only (**bold**, `code`, [links](/downloads)).
    expect: What they should see when it worked.
result: The end state in one sentence.
verify: How to check it actually worked.
troubleshooting:
  - symptom: What goes wrong
    fix: What to do about it.
cautions: [] # safety notes, shown above the steps
reviewed: '2026-01-01' # bump when you re-check the steps
internal:
  sources: [Where the steps came from]
  verified: '2026-01-01'
---

Optional extra notes go here as plain paragraphs. They appear under the steps.
