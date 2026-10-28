# Burlington, South Burlington, and Winooski Merger Study

Source for <https://burlington-south-burlington-winooski-merger-study.org>.

This README is the plan for how the site works. Rules for changing the repository are in [AGENTS.md](AGENTS.md). If you change how the site works, update this file in the same commit. It describes the current design, not the history of how we got here.

Sections marked **planned** describe what is not built yet.

## What the site is

Act 170 of 2026 (H.955, signed June 18, 2026) put the Burlington, South Burlington, and Winooski school districts in one merger committee (Chittenden Central, Group 18). The committee studies whether forming one unified union school district is advisable and makes a recommendation. It does not decide. Key dates, from Act 170 Sec. 13:

- By September 1, 2026: the Vermont Learning Collaborative hires seven regional facilitators and one lead facilitator.
- By September 15, 2026: each school board names at least one current member to its merger committee.
- By October 15, 2026: facilitators set the groups, and each merger committee holds its first meeting. Ours met on October 20, 2026.
- By September 1, 2027: the final report goes to the three school boards, the Secretary of Education, and the State Board of Education.
- By December 1, 2027: the Secretary recommends on any proposed merger. By December 15, 2027: the State Board issues findings.
- March 7, 2028 (Town Meeting Day), if a merger is proposed: voters in each district the plan names "necessary" or "advisable" vote. The new district forms only if every "necessary" district votes yes; an "advisable" district joins only if its own voters say yes (16 V.S.A. § 713(b)).

If voters approve, the articles of agreement set the date the new district takes over. Act 170 Sec. 13 sets no such date. The Act 170 page says July 1, 2029.

The law is new and dates may move. The current list is on the [Agency of Education's page](https://education.vermont.gov/schools/school-governance/education-transformation).

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

## Who it is for

- Parents and guardians in three districts, many reading on a phone.
- Families who read English as a second language or not at all. Burlington's district employs liaisons for Nepali, Somali and Maay Maay, Swahili, Kirundi, Kinyarwanda, French, Arabic, Vietnamese, Karen, Burmese, Bosnian, and Spanish.
- Voters in March 2028 who want the facts in one place.
- Reporters and committee members looking for a specific record.
- People using screen readers, magnifiers, keyboards, or voice control.

## Legal duties the site must support

From 1 V.S.A. § 312, as amended through 2026.

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

The ADA web rule (28 CFR 35.200) requires WCAG 2.1 AA. A school district is not a "special district government" under the rule. It uses its city's population. Burlington, South Burlington, and Winooski each have fewer than 50,000 people, so the deadline is April 26, 2028.

## Stack

- **pnpm** installs dependencies. The version is `packageManager` in `package.json`. GitHub Actions installs from `pnpm-lock.yaml`. The deploy action detects that lockfile and uses the same pnpm version.
- **Astro**, static output only. No server, no client framework. Ship HTML and CSS.
- **Content collections** with Zod schemas hold the content in `src/content/`.
- **GitHub Pages**, deployed by GitHub Actions with `withastro/action` (`.github/workflows/deploy.yml`). Pages say "upcoming" or "past" as of build time, so the workflow also rebuilds every hour.
- **No CMS.** Someone posts an agenda by opening a pull request.
- **Google Analytics** is the only third-party script. The tag is in `BaseLayout.astro`, measurement ID `G-WSHT3F890T`. Do not add any other analytics, cookies, or third-party scripts. Recordings are links to a video host.
- **Pagefind** for search, added once the archive is big enough to need it.
- **Sitemap** from `@astrojs/sitemap`. Each entry's `lastmod` is the page's own "Last updated" date. `BuiltPage` (`src/persistence/BuiltPage.ts`) reads it from the `<time>` element in the built HTML, so the sitemap and the page cannot disagree. Every page passes its own `title` and `description` to `BaseLayout`. A record page's description is its title, publisher, and date. Give a record a title that stands alone, like "Draft minutes of the October 20, 2026 meeting", not "Draft minutes".

### Domain and deploy

`site` in `astro.config.mjs` is `https://burlington-south-burlington-winooski-merger-study.org`. The custom domain serves the site from `/`.

Pages publishes with the GitHub Actions workflow in `.github/workflows/deploy.yml`. The custom domain and HTTPS live in repository Settings, then Pages.

Recordings live on a video host. The site links to them. GitHub rejects files over 100 MB and limits a Pages site to 1 GB.

## Run locally

You need Node 24 or newer and pnpm 11.23.0.

```sh
pnpm install
pnpm dev
```

Open <http://localhost:4321>. Saving a page, a content file, or a component reloads the browser.

`pnpm install` installs a pre-commit hook that runs `pnpm check`. The hook uses the `pnpm` found at that time. If you move `pnpm`, run `pnpm run prepare` again.

## Domain model

Content files are storage. `src/persistence/AstroContent.ts` loads them at build time into domain classes in `src/domain/`; `src/persistence/FileContent.ts` does the same outside Astro, for scripts. Pages and components work with these classes. Each class holds its data and the rules about it. Schemas live in `src/domain/schemas.ts` and are shared by both loaders.

Times are `VermontTime` (an instant, shown in America/New_York), dates are `VermontCalendarDay`, months are `VermontCalendarMonth`, and a time of day with no date (like 4:00 p.m.) is `VermontClockTime`. Write times in content files with their UTC offset: `-04:00` in summer, `-05:00` in winter. Deadlines count real hours, so the agenda deadline for a meeting just after the November clock change lands an hour later on the clock.

| Class | Holds | Knows how to |
| --- | --- | --- |
| `Committee` | Name, chair, `Facilitator`, districts, members, meetings, documents, `ProportionalRepresentation`, `RegularMeetingSchedule`, `StateDeadline`s | Find the next meeting, list upcoming public meetings (including expected meetings), list past meetings, list overdue duties, name its chair, build its `Deadlines` |
| `RegularMeetingSchedule` | The week and weekday (like the first Monday), the start time, the first and last month, cancelled months, the date it last changed | Describe itself, list an `ExpectedMeeting` for each month with no regular meeting on file |
| `ExpectedMeeting` | A start time from the schedule | Say the notice is not out yet |
| `OpenMeetingLaw` | The posting rules of 1 V.S.A. § 312 | Compute agenda and minutes deadlines for any meeting kind |
| `PostingDeadline` | A `Meeting`, agenda or minutes, the deadline, the posted record if any | Say whether it is overdue. Used by `pnpm check:deadlines`, not shown on the site |
| `StateDeadline` | A date, whether it is "on" or "on or before", what happens, the section of Act 170, the date it last changed | Label its date ("By September 1, 2027"), link to its source |
| `Deadlines` | State deadlines, in time order | Drop what is over. The public page lists every date, including ones that have passed |
| `ProportionalRepresentation` | The meeting that set each district's votes, and a `DistrictVotes` for each district | Say how many votes each district has |
| `DistrictVotes` | A `District` and its vote count | Say "3 votes" or "1 vote" |
| `District` | Name, city, website, phone, logo, the page on the district site that links here, student count with source | Sort alphabetically |
| `DistrictDelegation` | A `District`, its votes, and its members and alternates | Name the district's contact |
| `Member` | Name, appointing `District`, member or alternate, whether they chair the committee, board role | Show name and role |
| `Facilitator` | Name, title, organization, email, phone, source | Give a phone link |
| `Meeting` | Kind (regular, special, emergency), start time, `PhysicalLocation`, `ElectronicAccess`, `Agenda`, `Minutes`, `Recording` | Compute `agendaDeadline`, `minutesDeadline`, `minutesKeepUntil`; say whether it has ended; report what is overdue |
| `PhysicalLocation` | Name, address, access notes (entrance, parking, elevator) | Render an address |
| `ElectronicAccess` | Meeting link, phone number, meeting ID, passcode | Render join instructions that work without the link |
| `Agenda` | The posted file (a `Document`, usually a PDF) and the time it was posted | Point to the posted file |
| `Minutes` | Status (draft or approved), the date approved, the posted file (a `Document`), posted time | Show draft status plainly |
| `Recording` | URL, host, posted time, captions available | Say how long it must stay up |
| `Document` | Title, publisher, date, `DocumentFile`s. No summary: the schema rejects one | Give the page that describes the file |
| `DocumentFile` | Language, format, size, whether accessible, URL | Label the link with type and size |
| `Page` | Title, description, last updated date, rendered body | Plain prose pages |
| `Question` (planned) | Question, answer, date answered, date revised | Show when the answer last changed |
| `Translation` (planned) | Language, translator (person or machine), date, source version | Tell the reader if it is out of date |

## Content layout

```text
src/
  content/
    committee.yaml               # the committee, its facilitator, and its regular meeting schedule
    districts.yaml
    state-deadlines.yaml         # dates set by Act 170 Sec. 13
    members.yaml
    meetings/2026-11-02.yaml     # one file per meeting, named by date
    documents/<slug>.yaml        # one file per record
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

## Pages

- **Home** (`/`): the next meeting with join details, then a plain account of the study. The state requires the study and voters decide. The page names the questions the committee is working through, the meeting schedule, the final report deadline and the vote date (both from `state-deadlines.yaml`), and what "necessary" and "advisable" mean. It links to public meetings for every meeting, and to deadlines for the other dates.
- **Public meetings** (`/meetings/`): a table of upcoming meetings, then a table of past meetings. The upcoming table includes each meeting on file that has not started, and an expected meeting for each month of the regular schedule that has no meeting file yet. An expected meeting has no page. It says the notice is not out yet, and it leaves the table once that day is over. One page per noticed meeting (`/meetings/<date>/`) with join details, agenda, minutes, recording, and records. Once the meeting has ended, the video and phone rows both name the platform, such as Google Meet or Zoom, and leave off the link, the phone number, and the PIN. A meeting with no end time counts as ended at the end of that calendar day. Each meeting offers an `.ics` calendar file (`/meetings/<date>.ics`) until it starts. Anything not yet known or posted, such as a location, link, agenda, minutes, or recording, shows "TBD".
- **Deadlines** (`/deadlines/`): every date in `state-deadlines.yaml`, in time order, with no month headings, including dates that have passed. `/calendar/` redirects here. This page does not list meetings.
- **Public records** (`/records/`): a file table with two tabs. The first tab, shown by default, lists files from the committee, including files its facilitator made for it. The second lists useful public records from other sources. Agendas and minutes are left off. They are on the meeting page. Each file still has its own page, with the original files labeled by type and size, which meetings used it, and how to ask for another format.
- **How to participate** (`/participate/`): how to attend, speak, send a written comment, ask for access, another format, or a record.
- **History of school mergers** (`/history/`): from 1892 to Act 170, every claim with a source.
- **Act 170 of 2026** (`/act-170/`): what the law asks of the committee, what the report must contain, the timeline, how a vote works, and what the law does not do.
- **Difference from the CESA** (`/cesa/`): why the committee's official name includes "Chittenden Central CESA", and how the committee differs from the CESA in members, votes, job, and lifespan.
- **Committee members** (`/members/`): members and alternates by district, who appointed them and when, with sources, and the facilitator.
- **Accessibility** (`/accessibility/`): our target, known gaps, and how to report a problem.
- **Contact us** (`/contact/`): the facilitator and one contact per district.
- **Questions** (planned): answers in HTML, dated, revised in place with the revision date shown.

Every page shows a "last updated" date.

## Languages (planned)

English is the source. Translate in this order:

1. How to take part, the next meeting, and the one-page summary of the study. People translate these, not machines.
2. Question answers and document summaries, as the committee is able.
3. Agendas and minutes stay in English unless the committee provides translations. Each meeting page says, in each supported language, how to get help.

Choose the first languages with the districts' multilingual liaisons, not from census tables. Arabic is right-to-left. A translated page names its translator and the English version it came from, and says so when the English has changed since.

Routes: English at `/`, other languages at `/<language code>/` (for example `/ne/`, `/so/`, `/sw/`, `/ar/`).

## Design

Design rules are in [AGENTS.md](AGENTS.md).

## Accessibility testing

Automated checks catch some problems, not all. `.github/workflows/checks.yml` runs on every pull request and on every push to `main`:

- `pnpm check` (`astro check`). The pre-commit hook runs this same command.
- `pnpm build`

`pnpm check:deadlines` loads every `Meeting`, prints how many hours are left for upcoming agendas, and exits with an error if an agenda or minutes are past their deadline, or if an expected meeting has passed with no meeting file (add the file, or add the month to `cancelledMonths`). It is a local reminder. Continuous integration does not run it.

Planned: HTML validation (`html-validate`), axe-core on every built page with zero violations, an internal link check, and a reading level report for English pages.

Before a change to layout or components, do the checks in [AGENTS.md](AGENTS.md).

## Common updates

**Add a meeting.** Copy a file in `src/content/meetings/`, name it by the meeting date, and fill in the time with its UTC offset, the place, and the video and phone details. Leave out what you do not know; the page says it is coming.

**Change the regular schedule.** Edit `regularMeetingSchedule` in `committee.yaml` and update its `updatedOn`. A regular meeting file in a month replaces that month's expected meeting, even on another day, so moving a meeting needs only the new meeting file. To cancel a month's meeting, add the month (like `"2027-07"`) to `cancelledMonths`.

**Change a state deadline.** Edit `state-deadlines.yaml` and update that entry's `updatedOn`. The home page and deadlines page read from it. The Act 170 page and the key dates at the top of this file are written out by hand, so change them too.

**Post an agenda.** Export the Google Doc to PDF and put it in `public/documents/`. Add that PDF as a record in `src/content/documents/`, with its path (like `/documents/agenda-2026-10-20.pdf`) and its size. Set `createdByTheCommittee` to `true`. In the meeting file, set `agenda.documentId` to that record and set `postedAt`. Do not also put it in `documentIds`. The records page leaves agendas off. Merge before the deadline. `pnpm check:deadlines` says how much time is left.

**Post minutes.** Put the minutes file in `public/documents/` as `minutes-YYYY-MM-DD.pdf`, or `minutes-YYYY-MM-DD-draft.pdf` while it is a draft, and add it under `src/content/documents/`. In the meeting file, add `minutes` with status `draft`, `postedAt`, and `documentId`. Set `createdByTheCommittee` to `true`. The records page leaves minutes off. When the committee approves them, change the status to `approved` and set `approvedOn`. Never delete posted minutes within one year of the meeting.

**Post a recording.** Add `recording` to the meeting file with its host. Set `captions` when you know whether the video has them.

**Add a record.** Add a file to `src/content/documents/`. Set `createdByTheCommittee` to `true` when the committee or its facilitator made the file for this committee. Statewide materials stay `false`. Add each file with its type and size in bytes. Link it from a meeting with `documentIds`. The public records page lists committee files, and skips agendas and minutes.

**Change members.** Edit `members.yaml` and update `membersUpdatedOn` in `committee.yaml`. The committee's chair is `chairMemberId` in `committee.yaml`, and it must be one member's id.

**When a district page links here.** In `districts.yaml`, set that district's `pageThatLinksHere.url` to the page and `published` to `true`.

## Open questions

- The October 20, 2026 notice says agendas, minutes, and recordings "will be housed on the websites of participating districts." The committee should vote to designate this site as its official website, so it is clear which site carries the posting deadlines.
- Who receives written comments, access requests, and records requests? The contact page sends them to the facilitator or a district contact until the committee decides.
- Who posts agendas and minutes, and who backs them up when that person is away?
- Which languages first, and who translates?
- The October 20, 2026 recording is on Vimeo. We do not yet know if it has captions, or where later recordings will be hosted.

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
