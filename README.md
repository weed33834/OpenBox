# OpenBox

> A unified open-source toolbox combining **FreeAPI** (a free AI-API navigator built with React + Vite + Supabase) and **FreeNode** (a Python pipeline that discovers, crawls, deduplicates and publishes free network nodes).

OpenBox merges two formerly separate projects into a single flat repository:

| Component | Stack | What it does |
|-----------|-------|--------------|
| **FreeAPI** (`src/`, `public/`, `supabase/`) | TypeScript · React · Vite · Supabase | A web app that aggregates and navigates free AI API endpoints, with filtering, comparison, favorites, health checks and i18n. |
| **FreeNode** (`scripts/`, `nodes/`, `docs/`, `tests/`) | Python | A pipeline that crawls public node sources, deduplicates and verifies them, then builds a Jekyll status site and exports Clash/V2Ray configs. |

## Repository layout

```
openbox/
├── src/                 # FreeAPI — React app source
├── public/              # FreeAPI — static assets
├── supabase/            # FreeAPI — DB migrations
├── scripts/             # FreeNode — crawler / formatter / verifier (Python)
│   ├── adapters/        #   source adapters (git, rss, html, …)
│   └── ...
├── nodes/               # FreeNode — generated node output
├── docs/                # FreeNode — Jekyll status site
├── tests/               # FreeNode — pytest suite
├── config/              # FreeNode — source list
├── index.html           # FreeAPI — Vite entry
├── package.json         # FreeAPI — npm scripts
├── pyproject.toml       # FreeNode — Python project config
└── requirements.txt     # FreeNode — Python deps
```

## Quick start

### FreeAPI (frontend)
```bash
pnpm install
cp .env.example .env      # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
pnpm dev
```

### FreeNode (pipeline)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # adjust FREENODE_* vars
python scripts/update.py
```

See `CONTRIBUTING.md` for workflow details, and `.github/workflows/` for CI (`deploy.yml` for the frontend, `daily-update.yml` for the node pipeline).

## License

MIT — see [LICENSE](LICENSE).
