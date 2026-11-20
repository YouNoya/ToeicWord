// Run as an async function body in the live app with browser evaluate_script.
// A close without a new return value models the native Escape dismissal.
async function resetThenCancelRegression() {
  const delay = () => new Promise(resolve => setTimeout(resolve, 30));
  document.querySelector('[data-day="1"]').click();
  document.getElementById('reset').click();
  document.getElementById('reset-dialog').close('reset');
  await delay();
  const input = document.getElementById('input-d1-1');
  input.value = '취소 후 유지';
  input.dispatchEvent(new Event('input', {bubbles: true}));
  document.getElementById('reset').click();
  document.getElementById('reset-dialog').close();
  await delay();
  if (document.getElementById('input-d1-1').value !== '취소 후 유지') {
    throw new Error('Cancel after prior confirmed reset deleted answers');
  }
  return {resetThenCancelPreservesAnswers: true};
}
