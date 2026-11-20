import json
import re
import sys
from pathlib import Path


def split_row(line):
    parts = re.split(r'\s+(\d{2})\s*(?=[A-Za-z]|$)', line.strip(), maxsplit=1)
    first = re.match(r'^(\d+)\s+(.+)$', parts[0])
    result = [(int(first[1]), first[2].strip())] if first else []
    if len(parts) == 3 and parts[2].strip():
        result.append((int(parts[1]), parts[2].strip()))
    return result


def extract(text):
    chunks = re.split(r'=== PAGE (\d+) ===', text)
    pages = {int(chunks[i]): chunks[i+1] for i in range(1, len(chunks), 2)}
    specs = []
    for test_page, content in pages.items():
        match = re.search(r'DAY\s*(\d+)\s+TEST', content)
        if not match:
            continue
        day = int(match[1])
        source_pages = [1, 2] if day == 1 else [test_page-1]
        heading = re.search(r'DAY\s*\d+\.\s*(.+)', pages[source_pages[0]])
        title = heading[1].strip().replace('〮', '·')
        specs.append((day, title, source_pages, test_page))
    days = []
    for day, title, source_pages, test_page in specs:
        prompts = dict(pair for line in pages[test_page].splitlines() for pair in split_row(line))
        count = max(prompts)
        entries = {}
        for page in source_pages:
            for line in pages[page].splitlines():
                for number, value in split_row(line):
                    word = prompts[number]
                    if not value.startswith(word):
                        raise ValueError(f'Day {day}, {number}: unmatched prompt')
                    meaning = value[len(word):].strip()
                    entries[number] = {'id': f'd{day}-{number}', 'number': number, 'word': word, 'meaning': meaning}
        for number, word in prompts.items():
            if number not in entries:
                entries[number] = {'id': f'd{day}-{number}', 'number': number, 'word': word, 'meaning': '', 'source': 'test-only'}
        if set(entries) != set(range(1, count+1)):
            raise ValueError(f'Day {day}: unexpected entry numbers')
        days.append({'day': day, 'title': title, 'words': [entries[n] for n in range(1, count+1)]})
    known = {w['word'].lower(): w['meaning'] for d in days for w in d['words'] if w['meaning']}
    supplements = {'request form': '신청서, 요청 양식', 'sensor': '감지기, 센서', 'technique': '기법, 기술', 'test': '시험, 검사; 시험하다'}
    for day in days:
        for word in day['words']:
            if not word['meaning']:
                word['meaning'] = known.get(word['word'].lower(), supplements.get(word['word'].lower(), ''))
                word['source'] = 'pdf-other-day' if word['word'].lower() in known else 'supplement'
    return days


if __name__ == '__main__':
    source, target = map(Path, sys.argv[1:])
    days = extract(source.read_text(encoding='utf-8'))
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(days, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Extracted entries per day:', [len(day['words']) for day in days])
