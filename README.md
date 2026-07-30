# ece499website

The showcase site for our ECE/BME 499 capstone project — a compact dual-axis 3D clinostat for
simulated microgravity in cell cultures. University of Victoria.

## How it is built

A single static page with no build step and no dependencies: `index.html`, `style.css`,
`script.js`, and `images/`. Vercel serves the repository root as-is, so a merge to the default
branch deploys with no project-settings change.

To work on it locally, serve the folder over HTTP (opening the file directly will break the
report's `fetch` check):

```bash
python3 -m http.server 4599
```

## Page structure

| Section | Anchor | Covers |
| --- | --- | --- |
| Hero | `#top` | Title, authors, headline result, live-app call to action |
| About the team | `#team` | Team photo and member cards |
| Background | `#background` | Why simulated microgravity matters and the problem statement |
| Design | `#design` | Objectives, drive trade study, mechanical, electrical and firmware |
| Results | `#results` | Recorded-run metrics, figures, conclusions, future work |
| Control software | `#software` | Live monitor link, application screenshots, desktop builds |
| Final report | `#report` | Embedded PDF and download |
| Acknowledgment | `#acknowledgment` | Thanks |
| References | `#references` | IEEE-style source list |

## Things still to fill in

Each item below has a matching `TODO (team)` comment in `index.html`.

1. **Final report PDF** — drop the file at `docs/ECE499-Final-Report.pdf`. The embed and the
   download button already point there, and the "not published yet" placeholder hides itself once
   the file resolves.
2. **Desktop builds** — replace the "coming soon" stubs in the Software section with real links
   once the macOS and Windows installers are signed. A GitHub Release on
   `clinostat-control-system` is the simplest stable host.
3. **Team blurbs** — each member card has a placeholder line under the name, ready for a
   one-liner about what you owned on the project.

## Live monitor link

The "Open the live web app" button points at a Cloudflare-hosted read-only monitor. The room ID in
that URL *is* the viewer credential — anyone with the link can watch the feed. It grants no control
whatsoever (no route accepts motor, experiment, or emergency-stop commands), but rotate the room if
you ever want the public link to stop working. The link lives in one place: the `#liveLink` anchor
in `index.html`.

## Where the content came from

- Copy and figures: the project poster and the ECE/BME 499 final report.
- Results figures: preserved hardware run `20260729_011743_engineering-test`, exported from
  `clinostat-control-system` (`docs/assets/presentation/`).
- Application screenshots: the desktop app's browser preview build, using demonstration data —
  labelled as such on the page.
