# AGENTS.md

## Cursor Cloud specific instructions

This repository is a single static HTML page (`index.html`) — a Turkish "love letter" titled "Melike & Enez". There is no backend, build step, package manager, or test suite.

- **Run (dev):** Serve the static files from the repo root, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000/`. Opening `index.html` directly via `file://` also works but a static server avoids browser quirks.
- **Build:** None required.
- **Lint/Test:** No linters or tests are configured in the repo.
- **Caveat:** The page references an image and audio from external URLs (`i.hizliresim.com`, `dl.sndup.net`), so those assets only load with internet access; the page structure/text still renders without them.
