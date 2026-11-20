(function (root) {
  'use strict';
  const empty = () => ({answers: {}, marks: {}, customSets: []});
  const setIdPattern = /^c[a-z0-9]{8,40}$/;
  const normalize = text => text.trim().replace(/\s+/g, ' ').replace(/[’‘]/g,"'").toLowerCase();
  function cleanSet(input) {
    if (!input || !setIdPattern.test(input.id) || typeof input.title !== 'string' || !Array.isArray(input.words)) return null;
    const words = input.words.slice(0, 1000).filter(w => w && typeof w.word === 'string' && w.word.trim()).map((w, i) => ({
      id: `${input.id}-${i+1}`, number: i+1, word: w.word.trim().slice(0,180),
      meaning: typeof w.meaning === 'string' ? w.meaning.slice(0,1500) : '',
      source: ['custom','pdf','supplement','pdf-other-day'].includes(w.source) ? w.source : 'custom'
    }));
    return words.length ? {id: input.id, title: input.title.trim().slice(0,80) || '나만의 시험지', words, custom: true} : null;
  }
  function decode(raw) {
    const clean = empty();
    try {
      const parsed = JSON.parse(raw);
      const seen = new Set();
      for (const candidate of (Array.isArray(parsed?.customSets) ? parsed.customSets.slice(0,100) : [])) {
        const set = cleanSet(candidate);
        if (set && !seen.has(set.id)) { clean.customSets.push(set); seen.add(set.id); }
      }
      const customIds = new Set(clean.customSets.flatMap(s => s.words.map(w => w.id)));
      const validId = id => /^d(?:[1-9]|[12]\d|30)-[1-9]\d{0,3}$/.test(id) || customIds.has(id);
      for (const [id, value] of Object.entries(parsed?.answers || {})) {
        if (validId(id) && typeof value === 'string') clean.answers[id] = value.slice(0, 300);
      }
      for (const [id, value] of Object.entries(parsed?.marks || {})) {
        if (validId(id) && ['correct', 'review'].includes(value)) clean.marks[id] = value;
      }
    } catch (_) { /* A damaged backup must not stop the worksheet from opening. */ }
    return clean;
  }
  root.StudyModel = {
    empty, decode,
    parseWords(text, days) {
      const dictionary = new Map();
      for (const day of days) for (const entry of day.words) {
        const key = normalize(entry.word);
        if (!dictionary.has(key)) dictionary.set(key, []);
        if (entry.meaning && !dictionary.get(key).includes(entry.meaning)) dictionary.get(key).push(entry.meaning);
      }
      const words = [], seen = new Set(); let duplicates = 0, skipped = 0;
      const lines = text.replace(/\r/g,'').split('\n');
      for (const line of lines) {
        const tokens = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(line) ? [line] : line.split(/[,;]+/);
        for (let token of tokens) {
          token = token.trim().replace(/\\$/, '').replace(/^(?:\d+[.)]?\s+|[-*•]\s+)/,'').trim();
          if (!token) continue;
          const korean = token.search(/[가-힣ㄱ-ㅎㅏ-ㅣ]/);
          let word = korean < 0 ? token : token.slice(0,korean).replace(/[\s=:|~(]+$/g,'').trim();
          let meaning = korean < 0 ? '' : token.slice(korean).trim();
          word = word.replace(/[=:|]+$/,'').trim();
          if (!/[a-z]/i.test(word) || word.length > 180) { skipped++; continue; }
          const key = normalize(word);
          if (seen.has(key)) { duplicates++; continue; }
          seen.add(key);
          const source = meaning ? 'custom' : 'pdf';
          if (!meaning) meaning = (dictionary.get(key) || []).join(' / ');
          words.push({word, meaning, source});
          if (words.length > 1000) throw new Error('시험지 하나에는 최대 1,000개까지 넣을 수 있어요.');
        }
      }
      return {words, duplicates, skipped};
    },
    addCustom(state, title, words, proposedId) {
      if (state.customSets.length >= 100) throw new Error('나만의 시험지는 최대 100개까지 저장할 수 있어요.');
      const id = proposedId || `c${Date.now().toString(36)}${Math.random().toString(36).slice(2,10)}`;
      if (state.customSets.some(s => s.id === id)) throw new Error('이미 존재하는 시험지입니다.');
      const set = cleanSet({id,title,words});
      if (!set) throw new Error('영단어를 한 개 이상 입력해주세요.');
      state.customSets.push(set); return set;
    },
    deleteCustom(state, id) {
      const set = state.customSets.find(s => s.id === id); if (!set) return;
      this.reset(state,set.words.map(w => w.id));
      state.customSets = state.customSets.filter(s => s.id !== id);
    },
    answer(state, id, value) { state.answers[id] = value; delete state.marks[id]; },
    mark(state, id, value) { if (['correct', 'review'].includes(value)) state.marks[id] = value; },
    reset(state, ids) { for (const id of ids) { delete state.answers[id]; delete state.marks[id]; } },
    select(words, state, review) { return review ? words.filter(w => state.marks[w.id] === 'review') : [...words]; },
    shuffle(words, random = Math.random) {
      const result = [...words];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }
  };
})(globalThis);
