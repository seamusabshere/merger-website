# Rules for changing this repository

Read [README.md](README.md) before changing the site. If you change how the site works, update README.md in the same commit. If you change a rule, update this file. Describe the current design, not the history of how we got here.

## Rules, in priority order

1. **Accurate and current.** A wrong meeting time is worse than no site. Every date carries its time zone (America/New_York).
2. **Accessible.** Meet WCAG 2.1 AA (ADA Title II, 28 CFR 35.200). Meet WCAG 2.2 AA where it costs little.
3. **Neutral.** The committee has not decided, and the site does not argue for or against a merger. Show the evidence and the arguments on each side, with the source of each.
4. **Plain language.** Aim for an 8th-grade reading level. Define terms like "union school district" when they first appear.
5. **The posted file is the record.** An agenda or the minutes are the file the committee posts, usually a PDF. The meeting page links to that file. Do not summarize an agenda, the minutes, or any other document. Do not write them out on the page, and do not add a note that restates what they say. Under the Open Meeting Law, the site works in terms of the official agenda and the official minutes, not LLM-generated summaries.
6. **Attractive.** Get there through type, spacing, and layout. Never trade accessibility for looks.
7. **Do not judge the law.** You are not a lawyer. Do not say whether something is legal, illegal, or a breach. State the date, the statute section, and what the site does.

The law is new and dates may move. Check the [Agency of Education's page](https://education.vermont.gov/schools/school-governance/education-transformation) before changing them. The Act 170 page says July 1, 2029 as the date a new district would take over. Act 170 Sec. 13 sets no such date. Find a source for that date or remove it.

## Documents

When the user gives you a document, do not summarize it. This includes a PDF, a notice, an agenda, minutes, a memo, or text they paste.

Vermont's Open Meeting Law (1 V.S.A. § 312) is how this committee works. The official agenda and the official minutes are the record. Link those files. Do not restate what they say.

Do not:

- Write a summary in chat
- Add a `summary` field to a document. The schema rejects it
- Add agenda items, meeting notes, attendance, motions, or votes to a meeting file. The schema rejects them
- Describe what a file says in a commit message

Do not say a file is unchecked. Do not write "We have not checked this file for accessibility," or anything like it, on a page, in a summary, or in a commit message. If nobody has checked a file, set `accessibility` to `not-checked` and leave the page quiet. Write a note only when you know a file does not work (`not-accessible`).

## Deadlines

The posting duties are in README.md.

Do not put the committee's posting chores on the site. The site is for the public, not a to-do list for the committee. Do not list when an agenda or minutes are due, and do not write "Past due," "overdue," or "missed deadline." People post when they can. `pnpm check:deadlines` is a local reminder for them. It is not copy for the website. Continuous integration does not run it.

## Code

Pages and components work only with the domain classes in `src/domain/`, never with raw collection entries. A function whose main argument is one of these classes belongs on that class as a method. Function arguments use named options objects, not positional arguments.

Ship HTML and CSS. Add JavaScript only for a feature that works without it first.

Quote every date and time in YAML (`"2026-11-02"`), so no parser turns it into a different type.

Add a CMS only when a person who does not use git must post on deadline.

The only third-party script is the Google tag in `BaseLayout.astro` (measurement ID `G-WSHT3F890T`). Do not add any other analytics, cookies, or third-party scripts. Link to video hosts; do not embed their players.

Do not set `base` in `astro.config.mjs`. The custom domain serves the site from `/`.

Do not add a `CNAME` file, and do not set the Pages source back to a branch. A branch source makes GitHub run Jekyll on this repo, and Jekyll fails on the `---` lines in `.astro` files.

Do not commit video or large binaries. GitHub rejects files over 100 MB and limits a Pages site to 1 GB. Recordings live on a video host; the site links to them.

## Running locally

If more than one agent session is working in this repo, check whether something is already listening on port 4321 before you run `pnpm dev`. If it is, use that server. It reloads when files change, so the other session can use it too.

## Design

- One column for reading, about 65 characters wide. Body text at least 18px. Sizes in `rem` so user zoom works.
- Type: Libre Franklin for body text, self-hosted. It is the typeface vermont.gov uses. It covers Latin, Vietnamese, and Cyrillic. For another script, the browser falls back to the system font.
- Color: one strong accent, contrast at least 4.5:1 for text and 3:1 for controls. Color is never the only signal. Treat the three districts the same: same size, same weight, alphabetical order.
- Links look like links: underlined in body text.
- Visible focus on every control. Targets at least 24 by 24 CSS pixels.
- No carousels, autoplay, parallax, or motion that ignores `prefers-reduced-motion`.
- Navigation wraps on small screens. No hamburger menu unless the links stop fitting.
- Every page opens with a banner: the three district logos, small, then "Official website of the Act 170 Merger Committee" for the three districts, then "Here's how you know." Opening that shows the logos again, larger, and, for each district, "The district's official website links here." The link is the page on that district's site that links back here, from `pageThatLinksHere` in `districts.yaml`. When a district publishes the page, set `url` to that page and `published` to true. This is not the federal ".gov" banner. The proof is the three district websites. Borrowing other USWDS patterns (skip link, landmarks, form patterns) is fine.
- The home page reads like a public notice: the next meeting first, then how to take part, then the question under study.
- Use logical CSS properties (`margin-inline-start`, not `margin-left`) everywhere, and set `lang` and `dir` on every page.
- Every page shows a "last updated" date.

## Before a layout change

Automated checks are in README.md. By hand, before any change to layout or components:

- Use the page with only a keyboard. Focus is visible and in order.
- Read it with VoiceOver (macOS, iOS) and NVDA (Windows). Headings and landmarks make sense.
- Zoom to 200% and to a 320px-wide window. Nothing is cut off or scrolls sideways.
