import sys
import unittest
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE / 'scripts'))


class ExtractionTests(unittest.TestCase):
    def test_extract_all_thirty_days(self):
        from extract_words import extract
        source = BASE / 'tests/fixtures/day1-30-source.txt'
        days = extract(source.read_text(encoding='utf-8'))
        self.assertEqual([day['day'] for day in days], list(range(1,31)))
        self.assertEqual(days[-1]['title'], '건강')
        self.assertEqual(len(days[-1]['words']), 69)
        self.assertEqual(days[-1]['words'][-1]['word'], 'well-being')
        self.assertEqual(days[5]['words'][4]['word'], 'improvise')
        for day in days:
            self.assertEqual([w['number'] for w in day['words']], list(range(1,len(day['words'])+1)))
            self.assertTrue(all(w['word'] and w['meaning'] for w in day['words']))

    def test_complete_real_entries_in_source_order(self):
        # Catches treating the two-column TEST grid as reading order,
        # including its empty slots, or losing the Day 1 continuation page.
        from extract_words import extract
        source = BASE / 'tests/fixtures/day1-30-source.txt'
        days = extract(source.read_text(encoding='utf-8'))
        self.assertEqual([len(day['words']) for day in days[:4]], [68, 68, 68, 72])
        self.assertEqual(days[0]['words'][40]['word'], 'application form')
        self.assertEqual(days[0]['words'][-1]['word'], 'profession')
        self.assertEqual(days[1]['words'][57]['word'], 'have a problem(in) -ing')
        self.assertEqual(days[2]['words'][-1]['word'], "on one's own")
        self.assertEqual(days[3]['words'][-1]['word'], 'task')
        self.assertEqual(days[0]['words'][61]['meaning'], '10년')
        self.assertEqual(days[3]['words'][1]['meaning'], '미루다, 꾸물거리다')
        for day in days:
            self.assertEqual([word['number'] for word in day['words']], list(range(1, len(day['words'])+1)))
            for word in day['words']:
                self.assertTrue(word['meaning'])
                self.assertNotRegex(word['word'], '[가-힣]')


if __name__ == '__main__':
    unittest.main()
