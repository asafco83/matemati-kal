/**
 * בונה את הקבצים שסוכן AI ("מורה פרטי") קורא כדי להתמצא באתר:
 * public/tutor.md (הוראות ומפת תוכנית הלימודים), public/llms.txt ו-public/curriculum.json.
 * רץ לפני כל build.
 */
import { writeFileSync } from 'node:fs';
import { topics, tracks } from '../src/content/index';
import { API_HELP } from '../src/lib/tutorGuide';

const SITE = 'https://matemati-kal.web.app';
const G = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'];
const list = topics.map((t) => ({
  id: t.id,
  title: t.title,
  track: tracks.find((x) => x.id === t.track)?.title ?? t.track,
  grades: t.grades,
  units: t.units ?? null,
  summary: t.summary,
  levels: t.levels,
  sections: t.lesson.sections.map((s) => s.title),
  prerequisites: t.lesson.before ?? [],
  url: `${SITE}/#/topic/${t.id}`,
}));
writeFileSync('public/curriculum.json', JSON.stringify({ site: SITE, language: 'he', grades: '1-12 (א-יב)', topics: list }, null, 1));

const rows = [...list]
  .sort((a, b) => a.grades[0] - b.grades[0] || a.grades[1] - b.grades[1])
  .map((t) => `| \`${t.id}\` | ${t.title} | ${G[t.grades[0]]}–${G[t.grades[1]]}${t.units ? ` (${t.units.join('/')} יח"ל)` : ''} | ${t.track} | ${t.levels.join(' · ')} |`)
  .join('\n');

const md = `# מתמטי-קל: guide for an AI private tutor ("מורה פרטי AI")

Site: ${SITE} — a Hebrew (RTL) app that teaches school math, grades 1-12, following the Israeli curriculum. It is also available in 10 more languages; teach in the language the student uses.

You were asked by a student to be their private tutor while they use this site. Read the rules first.

\`\`\`
${API_HELP}
\`\`\`

## How a session should go

1. Call \`mathTutor.context()\` to see the student's grade and what is on screen. If you cannot run JavaScript in the page, read the page instead and explain in the chat.
2. Map the request to a topic: "למד אותי חיבור של שברים" → \`mathTutor.curriculum({ query: 'שברים' })\` → \`fractions-add\`. Use the table below or \`${SITE}/curriculum.json\`.
3. Read \`mathTutor.lesson(id)\`. Check the prerequisites with one or two quick questions before you teach. If a prerequisite is missing, teach that first (it is usually another topic in the table).
4. Teach one section at a time: a short explanation, something on the board (\`mathTutor.board.show\`), then a question for the student. Wait for their answer.
5. Move to practice with \`mathTutor.open(id, 'practice')\`. The student types the answers. You give hints and check reasoning. To show a method, use \`mathTutor.example(id, level)\`, which is a different exercise.
6. End by asking the student to say the method in their own words.

Each topic page has three tabs: "למידה" (lesson: full and short explanation), "דוגמאות פתורות" (worked examples) and "תרגול" (practice in three levels; five correct answers in a row earn a star).

For open requests such as "איך אני ניגש לבעיות מילוליות": the topics \`word-problems-basic\` (grades 2-6) and \`word-problems\` (grades 7-10) teach a fixed method. Teach the method, then practice together.

## Board examples

\`\`\`js
mathTutor.board.show([
  { type: 'title', text: 'חיבור שברים עם מכנים שונים' },
  { type: 'text', text: 'קודם מביאים את שני השברים לאותו מכנה. למה אי אפשר לחבר $\\\\frac{1}{2}$ ו-$\\\\frac{1}{3}$ כמו שהם?' },
  { type: 'figure', figure: { type: 'fracbar', parts: 2, filled: 1 }, caption: 'חצי' },
  { type: 'figure', figure: { type: 'fracbar', parts: 3, filled: 1 }, caption: 'שליש' },
  { type: 'steps', steps: [{ tex: '\\\\frac{1}{2} = \\\\frac{3}{6}', why: 'מרחיבים ב-3' }, { tex: '\\\\frac{1}{3} = \\\\frac{2}{6}', why: 'מרחיבים ב-2' }] },
]);
mathTutor.board.add({ type: 'draw', width: 10, height: 6, origin: [1, 1], axes: true, shapes: [
  { kind: 'line', from: [0, 1], to: [4, 3], color: 'blue', label: 'y = 0.5x + 1' },
  { kind: 'point', at: [2, 2], label: 'A(2, 2)', color: 'red' },
] });
\`\`\`

## Curriculum map (${list.length} topics)

| id | topic | grades | track | practice levels |
|---|---|---|---|---|
${rows}
`;
writeFileSync('public/tutor.md', md);
writeFileSync('public/llms.txt', `# מתמטי-קל\n\n> A Hebrew app for learning and practicing school math, grades 1-12 (Israeli curriculum), in 11 languages.\n\nAI agents that help a student on this site act as a private tutor and must not give answers to practice exercises. Read the tutor guide before acting.\n\n- [Tutor guide, rules and page API](${SITE}/tutor.md)\n- [Curriculum map (JSON)](${SITE}/curriculum.json)\n`);
console.log(`tutor.md, llms.txt, curriculum.json: ${list.length} נושאים`);
