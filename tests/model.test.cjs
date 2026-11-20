const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const modelPath=require('node:path').join(__dirname,'../dist/model.js');
const source=fs.existsSync(modelPath)?fs.readFileSync(modelPath,'utf8'):'';
const context={};vm.createContext(context);vm.runInContext(source,context);
const M=context.StudyModel;
const words=[{id:'d1-1'},{id:'d1-2'},{id:'d2-1'}];

test('answers and review marks survive serialization without crossing Day IDs',()=>{
  assert.ok(M,'study model must exist');
  const state=M.empty();
  M.answer(state,'d1-1','이력서');M.answer(state,'d2-1','복장');
  M.mark(state,'d1-1','review');
  const restored=M.decode(JSON.stringify(state));
  assert.equal(restored.answers['d1-1'],'이력서');
  assert.equal(restored.answers['d2-1'],'복장');
  assert.equal(restored.marks['d1-1'],'review');
  M.answer(restored,'d1-1','새 답안');
  assert.equal(restored.marks['d1-1'],undefined,'editing invalidates an old self grade');
});
test('reset only touches the selected Day and corrupt storage recovers',()=>{
  assert.ok(M,'study model must exist');
  const s=M.decode('{broken');
  M.answer(s,'d1-1','이력서');M.answer(s,'d2-1','복장');M.mark(s,'d1-1','review');
  M.reset(s,['d1-1','d1-2']);
  assert.equal(s.answers['d1-1'],undefined);assert.equal(s.marks['d1-1'],undefined);
  assert.equal(s.answers['d2-1'],'복장');
  assert.equal(M.decode('{"answers":null,"marks":123}').answers['d1-1'],undefined);
});
test('review only contains explicitly marked prompts; shuffle preserves every identity',()=>{
  assert.ok(M,'study model must exist');
  const s=M.empty();M.mark(s,'d1-2','review');
  assert.deepEqual(Array.from(M.select(words,s,true),w=>w.id),['d1-2']);
  const shuffled=M.shuffle(words,()=>0);
  assert.equal(shuffled.length,3);assert.equal(new Set(shuffled.map(w=>w.id)).size,3);
  assert.equal(words[0].id,'d1-1','source order stays intact');
});
test('unsafe or malformed imported state is reduced to valid strings and known marks',()=>{
  assert.ok(M,'study model must exist');
  const s=M.decode('{"answers":{"d1-1":42,"d1-2":"정답"},"marks":{"d1-1":"review","d1-2":"oops"}}');
  assert.equal(s.answers['d1-1'],undefined);assert.equal(s.answers['d1-2'],'정답');
  assert.equal(s.marks['d1-1'],'review');assert.equal(s.marks['d1-2'],undefined);
});

test('Day 5-30 answers survive saving while invalid Day identifiers are rejected',()=>{
  const state=M.empty();M.answer(state,'d30-69','건강과 행복');M.mark(state,'d30-69','review');
  const restored=M.decode(JSON.stringify(state));
  assert.equal(restored.answers['d30-69'],'건강과 행복');assert.equal(restored.marks['d30-69'],'review');
  const bad=M.decode('{"answers":{"d31-1":"bad","d0-1":"bad"}}');
  assert.equal(Object.keys(bad.answers).length,0);
});

test('custom paste keeps phrasal verbs, deduplicates and links PDF meanings',()=>{
  assert.equal(typeof M.parseWords,'function');
  const days=[{words:[{word:'resume',meaning:'이력서'},{word:'take advantage of',meaning:'~을 이용하다'}]},{words:[{word:'resume',meaning:'재개하다'}]}];
  const parsed=M.parseWords('1. resume\ntake advantage of\nRESUME\nunknownword\napple 사과, 사과나무',days);
  assert.equal(parsed.words.length,4);
  assert.equal(parsed.words[0].word,'resume');
  assert.ok(parsed.words[0].meaning.includes('이력서'));assert.ok(parsed.words[0].meaning.includes('재개하다'));
  assert.equal(parsed.words[1].word,'take advantage of');
  assert.equal(parsed.words[2].meaning,'');
  assert.equal(parsed.words[3].meaning,'사과, 사과나무');
  assert.equal(parsed.duplicates,1);
  assert.equal(M.parseWords('resume, fatigue; public library',days).words.length,3);
});

test('custom sets and answers roundtrip, and deleting one test leaves all others alone',()=>{
  assert.equal(typeof M.addCustom,'function');
  const s=M.empty();
  const first=M.addCustom(s,'나의 단어장',[{word:'my phrase',meaning:'나의 표현'}],'cfixture01');
  const second=M.addCustom(s,'두 번째',[{word:'other',meaning:''}],'cfixture02');
  M.answer(s,first.words[0].id,'입력 답');M.answer(s,'d1-1','이력서');
  const restored=M.decode(JSON.stringify(s));
  assert.equal(restored.customSets.length,2);
  assert.equal(restored.customSets[0].words[0].meaning,'나의 표현');
  assert.equal(restored.answers[first.words[0].id],'입력 답');
  M.deleteCustom(restored,first.id);
  assert.equal(restored.customSets.length,1);assert.equal(restored.customSets[0].id,second.id);
  assert.equal(restored.answers[first.words[0].id],undefined);assert.equal(restored.answers['d1-1'],'이력서');
});

test('untrusted custom backup ids cannot inject markup or overwrite built-in Day entries',()=>{
  const s=M.decode(JSON.stringify({customSets:[{id:'d1',title:'bad',words:[{word:'bad',meaning:'bad'}]},{id:'cfixture01',title:'safe',words:[{id:'\" onclick=\"alert(1)',word:'<img src=x>',meaning:'test'}]}]}));
  assert.equal(s.customSets.length,1);
  assert.equal(s.customSets[0].words[0].id,'cfixture01-1');
});
