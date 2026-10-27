# Burlington, South Burlington, and Winooski Merger Study

Source for <https://burlington-south-burlington-winooski-merger-study.org>.

This README is the plan for how the site works. Read it before changing anything. If you change how the site works, update this file in the same commit. It describes the current design, not the history of how we got here.

Sections marked **planned** describe what is not built yet.

## What the site is

Act 170 of 2026 (H.955, signed June 18, 2026) put the Burlington, South Burlington, and Winooski school districts in one merger committee (Chittenden Central, Group 18). The committee studies whether forming one unified union school district is advisable and makes a recommendation. It does not decide. Key dates, from Act 170 Sec. 13:

- By October 15, 2026: each merger committee holds its first meeting. Ours met on October 20, 2026.
- By September 1, 2027: the final report goes to the three school boards, the Secretary of Education, and the State Board of Education.
- By December 1, 2027: the Secretary recommends on any proposed merger. By December 15, 2027: the State Board issues findings.
- March 7, 2028 (Town Meeting Day), if a merger is proposed: voters in each district the plan names "necessary" or "advisable" vote. The new district forms only if every "necessary" district votes yes; an "advisable" district joins only if its own voters say yes (16 V.S.A. § 713(b)).

If voters approve, the articles of agreement set the date the new district takes over. Act 170 Sec. 13 sets no such date. The Act 170 page says July 1, 2029; find a source for that date or remove it.

The law is new and dates may move. Check the [Agency of Education's page](https://education.vermont.gov/schools/school-governance/education-transformation) before changing them.

The site has three jobs, in this order:

1. Tell people how to take part: when the next meeting is, how to attend in person or by phone or video, and how to comment.
2. Keep the public record: agendas, minutes, recordings, and documents.
3. Explain the study in plain language.

## Status: the committee's official website

This is the official website of the Act 170 merger study committee for Burlington, South Burlington, and Winooski. Every page says so in the banner at the top and in the footer.

Vermont's Open Meeting Law (1 V.S.A. § 312) attaches posting duties to "a website, if one exists, that the public body maintains or designates as the official website of the body." So this site carries legal deadlines:

- Agendas must be on this site at least 48 hours before a regular meeting and 24 hours before a special meeting.
- Minutes must be on this site within 5 calendar days of the meeting.
- Minutes must stay on this site for at least 1 year. Approved minutes may replace drafts.

A missed deadline here is a breach of the law, not a website bug. Treat it that way.

## Who it is for

- Parents and guardians in three districts, many reading on a phone.
- Families who read English as a second language or not at all. Burlington's district employs liaisons for Nepali, Somali and Maay Maay, Swahili, Kirundi, Kinyarwanda, French, Arabic, Vietnamese, Karen, Burmese, Bosnian, and Spanish.
- Voters in March 2028 who want the facts in one place.
- Reporters and committee members looking for a specific record.
- People using screen readers, magnifiers, keyboards, or voice control.

## Rules, in priority order

1. **Accurate and current.** A wrong meeting time is worse than no site. Every date carries its time zone (America/New_York).
2. **Accessible.** WCAG 2.1 AA is the legal floor (ADA Title II). Meet WCAG 2.2 AA where it costs little.
3. **Neutral.** The committee has not decided, and the site does not argue for or against a merger. Show the evidence and the arguments on each side, with the source of each.
4. **Plain language.** Aim for an 8th-grade reading level. Define terms like "union school district" when they first appear.
5. **Minutes and summaries on the page.** Minutes and document summaries are HTML. An agenda is the file the committee posts, usually a Google Doc exported to PDF. The meeting page links to that file. Writing the agenda out as HTML is optional, and not every agenda will be.
6. **Attractive.** Get there through type, spacing, and layout. Never trade accessibility for looks.

## Legal duties the site must support

From 1 V.S.A. § 312, as amended through 2026. Read the statute when in doubt; it changes.

| Item | Rule |
| --- | --- |
| Agenda, regular meeting | Posted at least 48 hours before |
| Agenda, special meeting | Posted at least 24 hours before |
| Executive session on an agenda | Listed as "proposed executive session" with the nature of the business |
| Remote or phone access | The agenda or notice includes what someone needs to join, including by phone |
| Minutes | Posted within 5 calendar days; kept at least 1 year |
| Minutes content | Members present, other active participants, every motion and its result, vote results, and each member's vote on a roll call |
| Recording | Every meeting is recorded. Link the recording from the meeting page and keep it up at least 30 days after the minutes are posted. We keep them up indefinitely. |
| Public comment | A reasonable chance to speak at each meeting |
| Request for access | A resident, member, or reporter may ask in writing, 2 business days ahead, for a physical location or phone or video access to one regular meeting (§ 312(j)) |

The ADA web rule (28 CFR 35.200) requires WCAG 2.1 AA. A school district is not a "special district government" under the rule. It uses its city's population. Burlington, South Burlington, and Winooski each have fewer than 50,000 people, so the deadline is April 26, 2028. Build to the standard now regardless.

## Stack

- **pnpm** installs dependencies. The version is `packageManager` in `package.json`. GitHub Actions installs from `pnpm-lock.yaml`. The deploy action detects that lockfile and uses the same pnpm version.
- **Astro**, static output only. No server, no client framework. Ship HTML and CSS. Add JavaScript only for a feature that works without it first.
- **Content collections** with Zod schemas hold the content in `src/content/`.
- **GitHub Pages**, deployed by GitHub Actions with `withastro/action` (`.github/workflows/deploy.yml`). Pages say "upcoming" or "past" as of build time, so the workflow also rebuilds every hour.
- **No CMS** to start. Someone posts an agenda by opening a pull request. Add a CMS only when a person who does not use git must post on deadline.
- **No analytics, cookies, or third-party scripts.** Link to video hosts; do not embed their players.
- **Pagefind** for search, added once the archive is big enough to need it.

### Domain and deploy

Set `site` in `astro.config.mjs` to `https://burlington-south-burlington-winooski-merger-study.org`. Do not set `base`; the custom domain serves the site from `/`.

Pages publishes with the GitHub Actions workflow in `.github/workflows/deploy.yml`. The custom domain and HTTPS live in repository Settings, then Pages. Do not add a `CNAME` file, and do not set the Pages source back to a branch. A branch source makes GitHub run Jekyll on this repo, and Jekyll fails on the `---` lines in `.astro` files.

Do not commit video or large binaries. GitHub rejects files over 100 MB and limits a Pages site to 1 GB. Recordings live on a video host; the site links to them.

## Run locally

You need Node 24 or newer and pnpm 11.23.0.

```sh
pnpm install
pnpm dev
```

Open <http://localhost:4321>. Saving a page, a content file, or a component reloads the browser.

`pnpm install` installs a pre-commit hook that runs `pnpm check`. The hook uses the `pnpm` found at that time. If you move `pnpm`, run `pnpm run prepare` again.

## Domain model

Content files are storage. `src/persistence/AstroContent.ts` loads them at build time into domain classes in `src/domain/`; `src/persistence/FileContent.ts` does the same outside Astro, for scripts. Pages and components work only with these classes, never with raw collection entries. Each class holds its data and the rules about it. Schemas live in `src/domain/schemas.ts` and are shared by both loaders.

Times are `VermontTime` (an instant, shown in America/New_York), dates are `VermontCalendarDay`, months are `VermontCalendarMonth`, and a time of day with no date (like 4:00 p.m.) is `VermontClockTime`. Write times in content files with their UTC offset: `-04:00` in summer, `-05:00` in winter. Deadlines count real hours, so the agenda deadline for a meeting just after the November clock change lands an hour later on the clock.

| Class | Holds | Knows how to |
| --- | --- | --- |
| `Committee` | Name, chair, `Facilitator`, districts, members, meetings, documents, `ProportionalRepresentation`, `RegularMeetingSchedule`, `StateDeadline`s | Find the next meeting, list past meetings, list overdue duties, name its chair, build its `Calendar` |
| `RegularMeetingSchedule` | The week and weekday (like the first Monday), the start time, the first and last month, cancelled months, the date it last changed | Describe itself, list an `ExpectedMeeting` for each month with no regular meeting on file |
| `ExpectedMeeting` | A start time from the schedule | Say it has no notice yet |
| `OpenMeetingLaw` | The posting rules of 1 V.S.A. § 312 | Compute agenda and minutes deadlines for any meeting kind |
| `PostingDeadline` | A `Meeting`, agenda or minutes, the deadline, the posted record if any | Say whether it is overdue. Used by `pnpm check:deadlines`, not by the public calendar |
| `StateDeadline` | A date, whether it is "on" or "on or before", what happens, the section of Act 170, the date it last changed | Label its date ("By September 1, 2027"), link to its source |
| `Calendar` | Meetings, expected meetings, and state deadlines, in time order | Drop what is over |
| `ProportionalRepresentation` | The meeting that set each district's votes, and a `DistrictVotes` for each district | Say how many votes each district has |
| `DistrictVotes` | A `District` and its vote count | Say "3 votes" or "1 vote" |
| `District` | Name, city, website, phone, logo, the page on the district site that links here, student count with source | Sort alphabetically |
| `DistrictDelegation` | A `District`, its votes, and its members and alternates | Name the district's contact |
| `Member` | Name, appointing `District`, member or alternate, whether they chair the committee, board role | Show name and role |
| `Facilitator` | Name, title, organization, email, phone, source | Give a phone link |
| `Meeting` | Kind (regular, special, emergency), start time, `PhysicalLocation`, `ElectronicAccess`, `Agenda`, `Minutes`, `Recording` | Compute `agendaDeadline`, `minutesDeadline`, `minutesKeepUntil`; say whether it has ended; report what is overdue |
| `PhysicalLocation` | Name, address, access notes (entrance, parking, elevator) | Render an address |
| `ElectronicAccess` | Meeting link, phone number, meeting ID, passcode | Render join instructions that work without the link |
| `Agenda` | The posted file (a `Document`, usually a PDF), the time it was posted, and `AgendaItem`s only when someone has also written the agenda on the page | Point to the posted file |
| `AgendaItem` | Title, description, whether it is a proposed executive session, linked `Document`s | Name a proposed executive session the way the law requires |
| `Minutes` | Status (draft or approved), members present, other participants, `Motion`s, posted time | Show draft status plainly |
| `Motion` | Text, mover, seconder, result, `Vote` | Render itself |
| `Vote` | Result, and each member's vote if by roll call | Render a roll call table |
| `Recording` | URL, host, posted time, captions available | Say how long it must stay up |
| `Document` | Title, summary, date, `DocumentFile`s | Give the page that describes the file |
| `DocumentFile` | Language, format, size, whether accessible, URL | Label the link with type and size |
| `Page` | Title, description, last updated date, rendered body | Plain prose pages |
| `Question` (planned) | Question, answer, date answered, date revised | Show when the answer last changed |
| `Translation` (planned) | Language, translator (person or machine), date, source version | Tell the reader if it is out of date |

Function arguments use named options objects, not positional arguments. A function whose main argument is one of these classes belongs on that class as a method.

## Content layout

```text
src/
  content/
    committee.yaml               # the committee, its facilitator, and its regular meeting schedule
    districts.yaml
    state-deadlines.yaml         # upcoming dates set by Act 170 Sec. 13
    members.yaml
    meetings/2026-11-02.yaml     # one file per meeting, named by date
    documents/<slug>.yaml        # one file per record: summary and files
    pages/en/<slug>.md           # prose pages: Act 170, CESA, history, participate, accessibility
    questions/<slug>.md          # planned
  domain/                        # classes listed above, and schemas.ts
  persistence/                   # loaders from content files to domain objects
  pages/                         # thin Astro routes that load domain objects
  components/
scripts/
  check-deadlines.ts             # fails if an agenda or minutes is past its legal deadline
public/
  logos/                         # district logos, one file per district id
  documents/                     # small PDFs and slides only
```

Quote every date and time in YAML (`"2026-11-02"`), so no parser turns it into a different type.

## Pages

- **Home** (`/`): the next meeting with join details, then a plain account of the study. The state requires the study and voters decide. The page names the questions the committee is working through, the meeting schedule, the final report deadline and the vote date (both from `state-deadlines.yaml`), and what "necessary" and "advisable" mean. It links to the calendar for every other date.
- **Public meetings** (`/meetings/`): a table of upcoming meetings, then a table of past meetings. One page per meeting (`/meetings/<date>/`) with join details, agenda, minutes, recording, and records. Once the meeting has ended, the video and phone rows both name the platform, such as Google Meet or Zoom, and leave off the link, the phone number, and the PIN. A meeting with no end time counts as ended at the end of that calendar day. Each meeting offers an `.ics` calendar file (`/meetings/<date>.ics`) until it starts. Anything not yet known or posted, such as a location, link, agenda, minutes, or recording, shows "TBD".
- **Calendar** (`/calendar/`): everything still to come, in time order, with no month headings. It lists meetings on file, an "expected" meeting for each month of the regular schedule that has no meeting file yet, and the dates in `state-deadlines.yaml`. An entry leaves the page once it is over. An expected meeting never shows a place or a join link; it says the notice is not out yet. The calendar is for the public. Do not list when an agenda or minutes are due.
- **Public records** (`/records/`): a file table with two tabs. The first tab, shown by default, lists files the committee wrote. The second lists useful public records from other sources. Agendas and minutes are left off. They are on the meeting page. Each file still has its own page, with a plain summary, the original files labeled by type and size, which meetings used it, and how to ask for another format.
- **How to participate** (`/participate/`): how to attend, speak, send a written comment, ask for access, another format, or a record.
- **History of school mergers** (`/history/`): from 1892 to Act 170, every claim with a source.
- **Act 170 of 2026** (`/act-170/`): what the law asks of the committee, what the report must contain, the timeline, how a vote works, and what the law does not do.
- **Difference from the CESA** (`/cesa/`): why the committee's official name includes "Chittenden Central CESA", and how the committee differs from the CESA in members, votes, job, and lifespan.
- **Committee members** (`/members/`): members and alternates by district, who appointed them and when, with sources, and the facilitator.
- **Accessibility** (`/accessibility/`): our target, known gaps, and how to report a problem.
- **Contact us** (`/contact/`): the facilitator and one contact per district. Use only official work addresses that the person has agreed to publish.
- **Questions** (planned): answers in HTML, dated, revised in place with the revision date shown.

Do not describe the home page's four questions (educational opportunity, governance, money and operations, long-term sustainability) as words from the law. They are the committee's plain-language summary. The law's required report contents are in Act 170 Sec. 13(b)(4).

Every page shows a "last updated" date.

## Languages (planned)

English is the source. Translate in this order:

1. How to take part, the next meeting, and the one-page summary of the study. People translate these, not machines.
2. Question answers and document summaries, as the committee is able.
3. Agendas and minutes stay in English unless the committee provides translations. Each meeting page says, in each supported language, how to get help.

Choose the first languages with the districts' multilingual liaisons, not from census tables. Arabic is right-to-left. Use logical CSS properties (`margin-inline-start`, not `margin-left`) everywhere, and set `lang` and `dir` on every page. A translated page names its translator and the English version it came from, and says so when the English has changed since.

Routes: English at `/`, other languages at `/<language code>/` (for example `/ne/`, `/so/`, `/sw/`, `/ar/`).

## Design

- One column for reading, about 65 characters wide. Body text at least 18px. Sizes in `rem` so user zoom works.
- Type: Libre Franklin for body text, self-hosted. It is the typeface vermont.gov uses. It covers Latin, Vietnamese, and Cyrillic. For another script, the browser falls back to the system font.
- Color: one strong accent, contrast at least 4.5:1 for text and 3:1 for controls. Color is never the only signal. Treat the three districts the same: same size, same weight, alphabetical order.
- Links look like links: underlined in body text.
- Visible focus on every control. Targets at least 24 by 24 CSS pixels.
- No carousels, autoplay, parallax, or motion that ignores `prefers-reduced-motion`.
- Navigation wraps on small screens. No hamburger menu unless the links stop fitting.
- Every page opens with a banner: the three district logos, small, then "Official website of the Act 170 Merger Committee" for the three districts, then "Here's how you know." Opening that shows the logos again, larger, and a link to the page on each district site that links back here. Those links live on `pageThatLinksHere` in `districts.yaml`. While `published` is false, the link text says it is a placeholder. When a district publishes the page, set `url` to that page and `published` to true. This is not the federal ".gov" banner. The proof is the three district websites. Borrowing other USWDS patterns (skip link, landmarks, form patterns) is fine.
- The home page reads like a public notice: the next meeting first, then how to take part, then the question under study.

## Accessibility testing

Automated checks catch some problems, not all. `.github/workflows/checks.yml` runs on every pull request and on every push to `main`:

- `pnpm check` (`astro check`). The pre-commit hook runs this same command.
- `pnpm build`

`pnpm check:deadlines` loads every `Meeting`, prints how many hours are left for upcoming agendas, and exits with an error if an agenda or minutes are past their deadline, or if an expected meeting has passed with no meeting file (add the file, or add the month to `cancelledMonths`). It is a local reminder. A missed deadline is a breach of the law, not a failed build, so continuous integration does not run it.

Planned: HTML validation (`html-validate`), axe-core on every built page with zero violations, an internal link check, and a reading level report for English pages.

By hand, before any change to layout or components:

- Use the page with only a keyboard. Focus is visible and in order.
- Read it with VoiceOver (macOS, iOS) and NVDA (Windows). Headings and landmarks make sense.
- Zoom to 200% and to a 320px-wide window. Nothing is cut off or scrolls sideways.
- Check an Arabic page if one exists.

## Common updates

**Add a meeting.** Copy a file in `src/content/meetings/`, name it by the meeting date, and fill in the time with its UTC offset, the place, and the video and phone details. Leave out what you do not know; the page says it is coming.

**Change the regular schedule.** Edit `regularMeetingSchedule` in `committee.yaml` and update its `updatedOn`. A regular meeting file in a month replaces that month's expected meeting, even on another day, so moving a meeting needs only the new meeting file. To cancel a month's meeting, add the month (like `"2027-07"`) to `cancelledMonths`.

**Change a state deadline.** Edit `state-deadlines.yaml` and update that entry's `updatedOn`. The home page and calendar read from it. The Act 170 page and the key dates at the top of this file are written out by hand, so change them too.

**Post an agenda.** Export the Google Doc to PDF and put it in `public/documents/`. Add that PDF as a record in `src/content/documents/`, with its path (like `/documents/2026-10-20-agenda.pdf`) and its size. Set `createdByTheCommittee` to `true`. In the meeting file, set `agenda.documentId` to that record and set `postedAt`. Do not also put it in `documentIds`. The records page leaves agendas off. Merge before the deadline. `pnpm check:deadlines` says how much time is left. Writing the items out in the meeting file is optional.

**Do not say a file is unchecked.** Do not write "We have not checked this file for accessibility," or anything like it, on a page, in a summary, or in a commit message. If nobody has checked a file, set `accessibility` to `not-checked` and leave the page quiet. Write a note only when you know a file does not work (`not-accessible`).

**Do not put the committee's posting chores on the site.** The site is for the public, not a to-do list for the committee. Do not list when an agenda or minutes are due, and do not write "Past due," "overdue," or "missed deadline." People post when they can. `pnpm check:deadlines` is a local reminder for them. It is not copy for the website.

**Post minutes.** Add `minutes` to the meeting file with status `draft`. Members present and roll call votes use member ids from `members.yaml`. When the committee approves them, change the status to `approved`, set `approvedOn`, and edit the text. If the minutes are also a file under `src/content/documents/`, set `createdByTheCommittee` to `true` and set `minutes.documentId` to that record. The records page leaves minutes off. Never delete posted minutes within one year of the meeting.

**Post a recording.** Add `recording` to the meeting file with its host and caption status.

**Add a record.** Add a file to `src/content/documents/`. Write the summary in plain language first. Set `createdByTheCommittee` to `true` only when the committee wrote it. Add each file with its type and size in bytes. Link it from a meeting with `documentIds`. The public records page lists committee files, and skips agendas and minutes.

**Change members.** Edit `members.yaml` and update `membersUpdatedOn` in `committee.yaml`. The committee's chair is `chairMemberId` in `committee.yaml`, and it must be one member's id.

**When a district page links here.** In `districts.yaml`, set that district's `pageThatLinksHere.url` to the page and `published` to `true`.

**Correct a mistake.** Fix it and add a dated note to the page that says what changed. Do not erase errors in the public record silently.

## Open questions

- The October 20, 2026 notice says agendas, minutes, and recordings "will be housed on the websites of participating districts." The committee should vote to designate this site as its official website, so it is clear which site carries the posting deadlines.
- Who receives written comments, access requests, and records requests? The contact page sends them to the facilitator or a district contact until the committee decides.
- Who posts agendas and minutes, and who backs them up when that person is away?
- Which languages first, and who translates?
- Where are recordings hosted, and do they have captions?

## Sources

- [1 V.S.A. § 312, Vermont Open Meeting Law](https://legislature.vermont.gov/statutes/section/01/005/00312)
- [Agency of Education: Open Meeting Law and Public Records Act](https://education.vermont.gov/sites/aoe/files/edu-the-open-meeting-law-and-public-records-act.pdf)
- [ADA.gov: Title II web accessibility rule](https://www.ada.gov/resources/2024-03-08-web-rule/)
- [Winooski: Merger Study Committee background and timeline](https://www.winooskivt.gov/AgendaCenter/ViewFile/Item/13619?fileID=19366)
- [Winooski School District: Act 170](https://www.wsdvt.org/project/act170/)
- [Burlington School District: Department of Multilingual Learners](https://www.bsdvt.org/district/department-of-multilingual-learners/)
- [Astro: Deploy to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub: Managing a custom domain for Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Minneapolis: document gateway pages](https://www.minneapolismn.gov/website-guidelines-branch/website-guidelines/content-types/gateway-content-types/gateway---document/)
- [Center for Civic Design: Designing Election Websites](https://electionexcellence.org/wp-content/uploads/2025/08/Designing-Election-Websites.pdf)
