(function () {
  'use strict';
  const M = StudyModel, DAYS = WORD_DAYS, KEY = 'toeic-meaning-day1-4-v1';
  const $ = id => document.getElementById(id);
  let storageOK = true, initial = null;
  try { initial = localStorage.getItem(KEY); } catch (_) { storageOK = false; }
  let state = M.decode(initial), dayIndex = 0, customId = null, reviewOnly = false, order = null, revealed = new Set();
  let toastTimer;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentDay = () => state.customSets.find(s => s.id === customId) || DAYS[dayIndex];
  const allTests = () => [...DAYS, ...state.customSets];
  function chooseTest(value) {
    if (value.startsWith('custom:')) { customId = value.slice(7); }
    else { customId = null; dayIndex = Math.max(0,DAYS.findIndex(d => d.day === Number(value))); }
    order = null; revealed.clear(); reviewOnly = false; renderDay();
  }
  function storageStatus() {
    $('save-status').textContent = storageOK ? '이 브라우저에 자동 저장' : '자동 저장 불가 · 답안을 백업하세요';
    $('save-status').classList.toggle('warning', !storageOK);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; }
    catch (_) { storageOK = false; }
    storageStatus();
  }
  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
  }
  function updateStats() {
    const words = currentDay().words;
    const answered = words.filter(w => state.answers[w.id]?.trim()).length;
    const correct = words.filter(w => state.marks[w.id] === 'correct').length;
    const review = words.filter(w => state.marks[w.id] === 'review').length;
    $('answered').textContent = answered; $('day-total').textContent = ` / ${words.length}`;
    $('correct-count').textContent = correct; $('review-count').textContent = review;
    $('review-badge').textContent = review; $('progress-fill').style.width = `${answered / words.length * 100}%`;
    for (const day of allTests()) {
      const count = day.words.filter(w => state.answers[w.id]?.trim()).length;
      const el = document.querySelector(day.custom ? `[data-custom="${day.id}"] .mini-count` : `[data-day="${day.day}"] .mini-count`);
      if (el) el.textContent = `${count} / ${day.words.length}`;
    }
  }
  function visibleWords() {
    const words = order || currentDay().words;
    return M.select(words, state, reviewOnly);
  }
  function updateRevealButton() {
    const words = visibleWords();
    $('reveal-all').textContent = words.length && words.every(w => revealed.has(w.id)) ? '정답 가리기' : '정답 확인';
    $('reveal-all').disabled = !words.length;
  }
  function renderList() {
    const words = visibleWords();
    $('word-list').innerHTML = words.map(w => {
      const open = revealed.has(w.id), mark = state.marks[w.id];
      const referenceLabel = !w.meaning ? '참고 뜻 미등록' : w.source === 'supplement' ? '보충 뜻' : w.source === 'custom' ? '직접 입력한 뜻' : 'PDF에 나온 뜻';
      const reference = w.meaning || '등록된 참고 뜻이 없어요. 시험지를 만들 때 단어 옆에 뜻도 함께 입력할 수 있어요.';
      return `<article class="word-row" data-id="${w.id}"><div class="row-main"><span class="number">${String(w.number).padStart(2,'0')}</span><div class="word-cell"><label class="english" for="input-${w.id}">${esc(w.word)}</label>${mark === 'review' ? '<span class="review-dot" aria-label="복습할 단어"></span>' : ''}</div><div class="entry"><input id="input-${w.id}" data-answer="${w.id}" type="text" value="${esc(state.answers[w.id] || '')}" placeholder="한국어 뜻을 적어보세요" aria-label="${esc(w.word)}의 한국어 뜻" maxlength="300" autocomplete="off" spellcheck="false"><button class="peek" data-peek="${w.id}" aria-expanded="${open}" aria-controls="answer-${w.id}">${open ? '닫기' : '확인'}</button></div></div><div class="answer-panel" id="answer-${w.id}" ${open ? '' : 'hidden'}><div class="answer-copy"><small>${referenceLabel}</small><span>${esc(reference)}</span></div><div class="grade" role="group" aria-label="${esc(w.word)} 기억 확인"><button data-grade="correct" data-word="${w.id}" class="${mark === 'correct' ? 'selected-correct' : ''}" aria-pressed="${mark === 'correct'}">맞았어요</button><button data-grade="review" data-word="${w.id}" class="${mark === 'review' ? 'selected-review' : ''}" aria-pressed="${mark === 'review'}">다시 복습</button></div></div></article>`;
    }).join('');
    $('empty').hidden = words.length > 0;
    document.querySelector('.column-head').hidden = !words.length;
    $('list-summary').textContent = `${reviewOnly ? '복습할 단어' : order ? '섞인 순서' : '번호 순서'} · ${words.length}문항`;
    $('all-mode').classList.toggle('active', !reviewOnly); $('all-mode').setAttribute('aria-pressed', String(!reviewOnly));
    $('review-mode').classList.toggle('active', reviewOnly); $('review-mode').setAttribute('aria-pressed', String(reviewOnly));
    updateStats(); updateRevealButton();
  }
  function renderDay() {
    const day = currentDay();
    $('day-title').innerHTML = day.custom ? esc(day.title) : `Day ${day.day} <span>${esc(day.title)}</span>`;
    $('total-chip').textContent = `${day.words.length}개 단어`;
    $('delete-custom').hidden = !day.custom;
    $('test-select').value = day.custom ? `custom:${day.id}` : String(day.day);
    for (const button of document.querySelectorAll('[data-day]')) {
      const active = !day.custom && Number(button.dataset.day) === day.day;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    }
    for (const button of document.querySelectorAll('[data-custom]')) {
      const active = day.custom && button.dataset.custom === day.id;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    }
    renderList();
  }
  function renderLibrary() {
    $('test-select').innerHTML = `<optgroup label="PDF Day 1–30">${DAYS.map(d => `<option value="${d.day}">Day ${d.day} · ${esc(d.title)} (${d.words.length}개)</option>`).join('')}</optgroup>` + (state.customSets.length ? `<optgroup label="나만의 시험지">${state.customSets.map(s => `<option value="custom:${s.id}">${esc(s.title)} (${s.words.length}개)</option>`).join('')}</optgroup>` : '');
    $('custom-tests').innerHTML = state.customSets.map(s => `<button class="day-button" data-custom="${s.id}"><span class="custom-name">${esc(s.title)}</span><span class="mini-count">0 / ${s.words.length}</span></button>`).join('');
    $('no-custom').hidden = !!state.customSets.length;
  }
  $('days').innerHTML = DAYS.map(d => `<button class="day-button" data-day="${d.day}"><span class="day">Day ${d.day}</span><span class="topic">${esc(d.title)}</span><span class="mini-count">0 / ${d.words.length}</span></button>`).join('');
  $('days').addEventListener('click', e => {
    const button = e.target.closest('[data-day]'); if (!button) return;
    chooseTest(button.dataset.day);
    window.scrollTo({top: 0, behavior: 'instant'});
  });
  $('test-select').onchange = e => chooseTest(e.target.value);
  $('custom-tests').onclick = e => { const button = e.target.closest('[data-custom]'); if (button) chooseTest(`custom:${button.dataset.custom}`); };
  $('open-creator').onclick = () => {
    $('creator-error').hidden = true;
    if (!$('custom-title').value.trim()) $('custom-title').value = `나만의 시험지 ${state.customSets.length+1}`;
    $('creator-dialog').showModal();
  };
  $('cancel-creator').onclick = () => $('creator-dialog').close();
  function previewCustom() {
    try {
      const result = M.parseWords($('custom-words').value,DAYS);
      const linked = result.words.filter(w => w.meaning).length;
      $('custom-preview').textContent = result.words.length ? `${result.words.length}개 단어 · 참고 뜻 ${linked}개 · 중복 제외 ${result.duplicates}개${result.skipped ? ` · 입력 확인 필요 ${result.skipped}개` : ''}` : '단어를 입력하면 개수를 확인할 수 있어요.';
    } catch (error) { $('custom-preview').textContent = error.message; }
  }
  $('custom-words').addEventListener('input',previewCustom);
  $('creator-form').onsubmit = e => {
    e.preventDefault();
    try {
      const result = M.parseWords($('custom-words').value,DAYS);
      const set = M.addCustom(state,$('custom-title').value,result.words);
      save(); renderLibrary(); chooseTest(`custom:${set.id}`); $('creator-dialog').close();
      $('creator-form').reset();previewCustom();toast(`${set.words.length}개 단어로 시험지를 만들었어요.`);
      window.scrollTo({top:0,behavior:'instant'});
    } catch(error) { $('creator-error').textContent=error.message;$('creator-error').hidden=false; }
  };
  $('delete-custom').onclick = () => { $('delete-dialog').returnValue='';$('delete-dialog').showModal(); };
  $('delete-dialog').addEventListener('close',() => {
    if($('delete-dialog').returnValue!=='delete'||!customId)return;
    M.deleteCustom(state,customId);save();renderLibrary();chooseTest('1');toast('나만의 시험지를 삭제했어요.');
  });
  $('word-list').addEventListener('input', e => {
    if (!e.target.matches('[data-answer]')) return;
    const id = e.target.dataset.answer;
    M.answer(state, id, e.target.value); save(); updateStats();
    const row = e.target.closest('.word-row');
    row.querySelector('.review-dot')?.remove();
    for (const button of row.querySelectorAll('[data-grade]')) {
      button.classList.remove('selected-correct', 'selected-review'); button.setAttribute('aria-pressed','false');
    }
  });
  $('word-list').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229 || !e.target.matches('[data-answer]')) return;
    e.preventDefault();
    const inputs = [...document.querySelectorAll('[data-answer]')];
    const next = inputs[inputs.indexOf(e.target) + 1];
    if (next) { next.focus(); next.scrollIntoView({block:'center',behavior:'smooth'}); }
    else { e.target.blur(); toast('마지막 칸이에요. 정답을 확인하고 복습해보세요.'); }
  });
  $('word-list').addEventListener('click', e => {
    const peek = e.target.closest('[data-peek]');
    if (peek) {
      const id = peek.dataset.peek, open = !revealed.has(id);
      if (open) revealed.add(id); else revealed.delete(id);
      $(`answer-${id}`).hidden = !open; peek.textContent = open ? '닫기' : '확인';
      peek.setAttribute('aria-expanded',String(open)); updateRevealButton(); return;
    }
    const grade = e.target.closest('[data-grade]');
    if (!grade) return;
    const id = grade.dataset.word, row = grade.closest('.word-row');
    M.mark(state,id,grade.dataset.grade); save();
    if (reviewOnly && grade.dataset.grade === 'correct') { renderList(); return; }
    for (const button of row.querySelectorAll('[data-grade]')) {
      const selected = state.marks[id] === button.dataset.grade;
      button.classList.toggle('selected-correct',selected && button.dataset.grade === 'correct');
      button.classList.toggle('selected-review',selected && button.dataset.grade === 'review');
      button.setAttribute('aria-pressed',String(selected));
    }
    row.querySelector('.review-dot')?.remove();
    if (grade.dataset.grade === 'review') {
      const dot=document.createElement('span');dot.className='review-dot';dot.setAttribute('aria-label','복습할 단어');row.querySelector('.word-cell').append(dot);
    }
    updateStats();
  });
  $('all-mode').onclick = $('back-all').onclick = () => { reviewOnly = false; renderList(); };
  $('review-mode').onclick = () => { reviewOnly = true; renderList(); };
  $('shuffle').onclick = () => { order = M.shuffle(currentDay().words); revealed.clear(); renderList(); toast('단어 순서를 섞었어요. 적어둔 뜻은 그대로 있어요.'); };
  $('reveal-all').onclick = () => {
    const words = visibleWords(), hide = words.every(w => revealed.has(w.id));
    for (const w of words) { if (hide) revealed.delete(w.id); else revealed.add(w.id); }
    renderList();
  };
  $('reset').onclick = () => { $('reset-dialog').returnValue = ''; $('reset-dialog').showModal(); };
  $('reset-dialog').addEventListener('close', () => {
    if ($('reset-dialog').returnValue !== 'reset') return;
    M.reset(state,currentDay().words.map(w => w.id)); revealed.clear(); save(); renderList(); toast('이 시험지의 답안과 복습 표시를 지웠어요.');
  });
  $('print').onclick = () => window.print();
  $('export').onclick = () => {
    const blob = new Blob([JSON.stringify({format:'toeic-meaning-day1-30-v2',savedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=`toeic-tests-answers-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('전체 시험지와 답안을 백업 파일로 저장했어요.');
  };
  $('import').onclick = () => $('import-file').click();
  $('import-file').addEventListener('change',async e => {
    const file=e.target.files[0];if (!file) return;
    try {
      if(file.size>10000000) throw new Error('too large');
      const raw=await file.text(), parsed=JSON.parse(raw);
      if(!['toeic-meaning-day1-4-v1','toeic-meaning-day1-30-v2'].includes(parsed.format)||!parsed.answers||!parsed.marks) throw new Error('wrong format');
      const imported=M.decode(raw);
      const newCount=imported.customSets.filter(s=>!state.customSets.some(existing=>existing.id===s.id)).length;
      if(state.customSets.length+newCount>100) throw new Error('too many tests');
      for(const set of imported.customSets){
        M.deleteCustom(state,set.id);state.customSets.push(set);
      }
      for(const day of allTests())for(const w of day.words){
        if(typeof imported.answers[w.id]==='string') { state.answers[w.id]=imported.answers[w.id];delete state.marks[w.id]; }
        if(imported.marks[w.id])state.marks[w.id]=imported.marks[w.id];
      }
      save();renderLibrary();renderDay();toast('백업한 시험지와 답안을 불러왔어요.');
    } catch(_) {toast('이 학습장에서 저장한 답안 백업 파일을 선택해주세요.');}
    e.target.value='';
  });
  document.querySelector('.brand').onclick=e=>{e.preventDefault();chooseTest('1');window.scrollTo(0,0);};
  renderLibrary();storageStatus();renderDay();
})();
