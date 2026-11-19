import { topics } from '../src/content/index';
const ids=process.argv.slice(2);
for (const t of topics as any[]) if(ids.includes(t.id)){ console.log('##',t.id, 'intro:',t.lesson.intro); for(const s of t.lesson.sections) console.log(' -',s.title,'::',s.body, s.figure?JSON.stringify(s.figure):''); }
