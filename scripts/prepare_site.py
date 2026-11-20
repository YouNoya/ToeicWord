import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DIST = BASE / 'dist'
data = json.loads((BASE / 'data/words.json').read_text(encoding='utf-8'))
assert [day['day'] for day in data] == list(range(1,31))
(DIST / 'words.js').write_text('globalThis.WORD_DAYS = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
html = (DIST / 'index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (DIST / 'style.css').read_text(encoding='utf-8') + '</style>')
scripts = '\n'.join((DIST / name).read_text(encoding='utf-8') for name in ['words.js', 'model.js', 'app.js'])
html = re.sub(r'  <script src="(?:words|model|app)\.js" defer></script>\n', '', html)
html = html.replace('</body>', '<script>' + scripts.replace('</script', '<\\/script') + '</script>\n</body>')
(BASE / 'index.html').write_text(html, encoding='utf-8')
print('Prepared word data and standalone index.html:',sum(len(day['words']) for day in data),'prompts; 30 Days.')
