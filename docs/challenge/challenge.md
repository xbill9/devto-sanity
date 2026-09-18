<!-- Source: https://dev.to/challenges/sanity-2026-09-16 (fetched 2026-09-18; converted from HTML) -->

# Sanity Challenge (DEV, 2026-09-16)

Build an AI agent on structured content, or vibe-code an app with Sanity behind it. $2,500 in prizes.

Sanity is the AI Content Operating System. Your content lives in the Content Lake as JSON documents, with schemas you define in TypeScript and query with GROQ.

## Key dates

| Event | Date |
|---|---|
| Contest start | September 18, 2026 (9:00 AM PDT per the rules) |
| Submissions due | October 4, 2026, 11:59 PM PDT |
| Winners announced | October 22, 2026 |

Badges: Sanity Challenge Winner Badge, Sanity Challenge Completion Badge.

Launch post (questions and ideas): https://dev.to/devteam/join-the-sanity-challenge-2500-in-prizes-for-five-winners-514m — saved as [launch-post.md](launch-post.md).

## Path One: Ship an Agent That Queries Real Content

Build an agent, then point it at a Sanity Context MCP endpoint backed by a Knowledge Base. Any agent framework, hosted anywhere.

Build anything that needs an answer it can't afford to get wrong. A board game companion that knows the errata contradicts the rulebook. A better interface to your favorite open-source docs. A eurorack planner that knows what actually fits in your case. An award-travel agent that untangles which transfer partner story is current. A car repair agent? A camera gear-head compendium? The sky is the limit.

Point Sanity Context at a website, a set of files, or your own Sanity content, and it distills a navigable Knowledge Base your agent reads through MCP. Every entry stays linked to the source it came from. When two sources contradict each other, both claims surface side by side with their sources, and the decision you make carries across future builds. It all lives in your Sanity Dashboard.

The strongest submissions will show an agent that only works because the content was structured. If a keyword search would have gotten you the same answer, aim higher.

**Judging criteria**

- Meaningful use of Sanity Context and structured content
- Technical implementation and code quality
- Use of Knowledge Bases
- Usability

Template: [submission-template-path-1.md](submission-template-path-1.md)

## Path Two: Vibe-Code Something Strange

Prompt your way to a working app. Any AI-native IDE, Next.js or Astro on the front, Sanity behind it.

This one is judged on the build as much as the result. How deep did you get into Sanity's features? Did you customize the interface? Build a new component to turn videos into gifs? Create a workflow that kicks off an external API call? A rough app with an honest writeup beats a polished one with three sentences.

Bonus points for reaching past the Studio. Two things we'd especially like to see prompted into existence:

- **App SDK**: build a custom app on top of your content, with real-time data and your own interface, instead of another read-only frontend.
- **Workflows**: model a process (content reviews, translations, and so on) as data next to the content, so an agent can move a draft forward and a person can approve it through the same transitions.

Neither is required. A submission that uses one well will stand out from a pile of blog templates.

**Judging criteria**

- Quality and honesty of the build process writeup
- Functionality of the finished app
- Thoughtfulness of the schema behind it
- Creativity and originality

Template: [submission-template-path-2.md](submission-template-path-2.md)

## How to participate

- Publish a post on DEV using the submission templates, with the required tag `#sanitychallenge`. You may submit to both paths, but each needs a separate post. Only one submission per path.
- If your app requires logging in, provide testing credentials and/or instructions for judges.
- **Every submission needs your Sanity project ID or a link to a public dataset URL.** Submissions without it may be considered incomplete.
- Optional but encouraged: embed an agent session (Claude Code, Gemini CLI, Codex, GitHub Copilot CLI, or Pi) via https://dev.to/agent_sessions/new. Uploads are unlisted by default — press **Make Public** or judges can't open it. Check the transcript for keys and sensitive data first.

## FAQ highlights

- Teams of up to four; list teammates' DEV handles in the post; one submission per team. DEV does not split prizes.
- 18+ only. Eligibility: https://dev.to/page/official-hackathon-rules
- Open source may be used, but changes must be significant, and any non-generic, non-trivial prior work must be credited.
- Non-English submissions get a completion badge but are not eligible for prizes.
- AI use is allowed.
- Ties go to the entry with the most positive reactions on its DEV post.
- Prize contact within 10 business days of announcement; affidavit/tax info due within 7 business days of first email.

Full rules: [contest-rules.md](contest-rules.md) and https://dev.to/page/official-hackathon-rules

## Resources (as linked by the challenge)

| Resource | Local copy |
|---|---|
| [Sanity Context](https://www.sanity.io/docs/ai/sanity-context) — required reading for the agent path | [../sanity/context/](../sanity/context/) |
| [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases) | [../sanity/context/sanity-context-knowledge-bases.md](../sanity/context/sanity-context-knowledge-bases.md) |
| [Workflows cookbook](https://www.sanity.io/docs/workflows/cookbook) | [../sanity/workflows/](../sanity/workflows/) |
| [App SDK](https://www.sanity.io/docs/app-sdk/sdk-introduction) — for the bonus path | [../sanity/app-sdk/](../sanity/app-sdk/) |
| [Day One with Sanity](https://sanity.io/learn) — guided course | not saved |
| [Sanity docs](https://sanity.io/docs) — schemas, GROQ, Studio | index: https://www.sanity.io/docs/llms.txt |
| Framework quickstarts: [Next.js](https://www.sanity.io/docs/next-js-quickstart), [Astro](https://www.sanity.io/docs/astro-quickstart), [Nuxt](https://www.sanity.io/docs/nuxt-js-quickstart), [React Router](https://www.sanity.io/docs/react-router-quickstart) | not saved |
| [Sanity Discord](https://snty.link/community) — includes a #mcp-server channel | — |
