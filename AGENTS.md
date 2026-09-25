# Project instructions for Codex

Read `CLAUDE.md` and `docs/PROJECT-STATE.md` before changing this dashboard.

## Track updates for the site

For every user-visible dashboard change, add or revise a short entry under
**Pending publication** in `docs/UPDATE-QUEUE.md` during the same work session.
Write for a visitor: what changed and why it helps. Group related edits into
one entry and omit internal refactors, documentation-only edits, and routine
data housekeeping unless visitors would notice the result. Do not duplicate
an entry for later fixes to the same change; update the existing entry.

Keep entries pending through local edits, commits, and pushes. Once the owner
confirms the change is live on the site, fill in its **Live** date. Use live
pending entries to draft a concise **New update** block when asked. Move an
entry to **Published** only after the block is posted or the owner confirms it
does not need posting. A push alone does not mean the site is live.

`CHANGELOG.md` remains the technical release history; the update queue is the
source for visitor-facing announcements. Include the queue in handoff notes
when it contains pending entries.
