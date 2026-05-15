# hyr.mn — AGENTS.md

Personal blog/portfolio of Ben Hyrman. Built with Eleventy 3 + Tailwind CSS 4 + PostCSS. Deployed on Netlify.

## Commands

| Action | Command |
|--------|---------|
| Dev server | `npm run watch` (serves on :8080, polls for file changes via CHOKIDAR_USEPOLLING) |
| Build | `npm run build` → outputs to `dist/` |
| Production build | `npm run build-prod` (sets NODE_ENV=production, cleans dist/ first) |
| Clean | `npm run clean` (removes `dist/`) |

No test, lint, or typecheck scripts exist.

## Architecture

- **Content source**: `src/site/` — Eleventy `input` dir
- **Templates**: Nunjucks (`.njk`) with Markdown content
- **CSS pipeline**: `src/site/css/main.css` → PostCSS (`@tailwindcss/postcss`) via `src/site/css/style.11ty.js` (an Eleventy template), output as `/css/site.css`
- **Posts**: `src/site/posts/*.md` with frontmatter. `posts.json` sets layout `blog-entry.njk` and `permalink: "/{{ page.fileSlug | slug }}/"` — clean URLs like `/14-years/`
- **Post collection**: Tag `blogentries` in each post's frontmatter
- **Layout chain**: `layout.njk` (site chrome) ← `blog-entry.njk` (post chrome) ← individual posts
- **Dark mode**: `prefers-color-scheme: media` (system preference), uses `dark:` Tailwind variants
- **RSS feed**: `feed.njk` at `/feed.xml`, uses `@11ty/eleventy-plugin-rss`
- **Syntax highlighting**: `@11ty/eleventy-plugin-syntaxhighlight` with `prism.css`
- **Node**: 24 (`.nvmrc`)

## Deployment

- Netlify: `netlify.toml` — build command `npm run build`, publish dir `dist/`
- Netlify redirect: `/blog/:slug` → `/:slug` (200)
- No CI (no `.github/`)

## Notable

- Devcontainer forwards port 8080 (Eleventy server)
- Font Awesome icons loaded via CDN in `layout.njk`
- No README exists in repo
