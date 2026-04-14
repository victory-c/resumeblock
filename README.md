# ResumeBlock

A local-first resume builder that stores experience as modular "blocks", matches them to job descriptions using a local LLM, and compiles them into a LaTeX PDF.

## Requirements

| Dependency | Version | Required |
|---|---|---|
| Node.js | ≥ 18.0.0 | Yes |
| Ollama | latest | Yes (for AI features) |
| pdflatex / TeX Live | any | Yes (for PDF compilation) |

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd resumeblock
npm install
```

`npm install` also runs `prisma generate` automatically (via `postinstall` script).

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if needed. The defaults work on most machines — just make sure `OLLAMA_MODEL` matches a model you have pulled (see step 4).

### 3. Set up the database

```bash
npm run db:migrate
```

This creates `./data/resumeblock.db` and applies all schema migrations.

### 4. Install Ollama (AI features)

Download from [ollama.com](https://ollama.com) or:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

Start the server and pull a model:

```bash
ollama serve          # keep running in a terminal tab
ollama pull qwen2     # or: llama3.1:8b, mistral, gemma3:4b, etc.
```

Set `OLLAMA_MODEL=qwen2` (or your model name) in `.env`.

### 5. Install pdflatex (PDF compilation)

```bash
# macOS — lightweight, no GUI apps
brew install --cask mactex-no-gui

# Ubuntu / Debian
sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra

# Windows
# Install MiKTeX: https://miktex.org/download
# Or TeX Live: https://tug.org/texlive/
```

After installing on macOS, open a new terminal (pdflatex will be at `/Library/TeX/texbin/pdflatex`).

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How it works

1. **Import** — Upload a PDF resume. The local LLM extracts structured work/education/award entries.
2. **Block Library** — Each entry becomes a "block". Blocks have "facets" — tailored versions with different bullets and skills for different roles.
3. **Applications** — Add a job description. The app scores and ranks your facets against the JD's requirements.
4. **Compile** — Pick a LaTeX template, select blocks, and generate a PDF resume.

---

## LaTeX Templates

Upload `.tex` files on the Templates page. Templates use `%%PLACEHOLDER%%` markers:

| Placeholder | Content |
|---|---|
| `%%HEADER%%` | Name, email, phone, links |
| `%%SUMMARY%%` | Professional summary paragraph |
| `%%EXPERIENCE%%` | Work and volunteer entries |
| `%%PROJECTS%%` | Project entries |
| `%%EDUCATION%%` | Education entries |
| `%%SKILLS%%` | Skills list |
| `%%CUSTOM:SECTIONNAME%%` | Any custom section |

Templates must use standard document classes (`article`, `report`, etc.) to compile locally. Templates using custom classes (like Deedy Resume's `deedy-resume-reversed`) need their `.cls` file or can be compiled via [Overleaf](https://overleaf.com).

---

## Data storage

All data is local — nothing leaves your machine:

| Path | Contents |
|---|---|
| `./data/resumeblock.db` | SQLite database (blocks, facets, JDs, templates) |
| `./data/output/` | Generated PDF files |
| `./data/templates/` | Uploaded LaTeX template files |
| `./data/uploads/` | Temporary PDF uploads |

These directories are in `.gitignore`. To migrate to a new machine, copy the `data/` folder alongside your `.env`.

---

## Migrating to a new machine

```bash
# On your old machine — pack up your data
tar -czf resumeblock-data.tar.gz data/ .env

# On the new machine — after clone + npm install + db:migrate:
tar -xzf resumeblock-data.tar.gz
```

---

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run db:migrate   # Apply database migrations
npm run db:studio    # Open Prisma Studio (visual DB browser)
```
