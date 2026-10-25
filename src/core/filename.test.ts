import { describe, expect, it } from 'vitest';
import { BELTS } from './belts';
import { parseTrainingFile } from './filename';
import { training, trainings } from './test-helpers';

const branca = BELTS[0]!;

describe('parseTrainingFile', () => {
  it('reads date, suffix and official flag', () => {
    expect(parseTrainingFile('2025-06-27.jpg', branca)).toMatchObject({ dateStr: '2025-06-27', suffix: '', official: true });
    expect(parseTrainingFile('2025-06-27-b.JPEG', branca)).toMatchObject({ suffix: 'b', official: true });
    expect(parseTrainingFile('2025-11-23_.png', branca)).toMatchObject({ suffix: '', official: false });
    expect(parseTrainingFile('2025-11-23-a_.jpg', branca)).toMatchObject({ suffix: 'a', official: false });
  });

  it('dates are local midnight', () => {
    const t = parseTrainingFile('2025-06-27.jpg', branca)!;
    expect([t.date.getFullYear(), t.date.getMonth(), t.date.getDate(), t.date.getHours()]).toEqual([2025, 5, 27, 0]);
  });

  it('ignores anything else', () => {
    for (const name of ['IMG_0001.jpg', '2025-6-27.jpg', '2025-06-27.heic', '2025-06-27-ab.jpg', '2025-06-27__.jpg', '.DS_Store']) {
      expect(parseTrainingFile(name, branca)).toBeNull();
    }
  });
});

describe('dedupeTrainings', () => {
  it('sorts by date then suffix', () => {
    const list = trainings('00-branca/2025-06-28.jpg', '00-branca/2025-06-27-b.jpg', '00-branca/2025-06-27-a.jpg');
    expect(list.map(t => t.filename)).toEqual(['2025-06-27-a.jpg', '2025-06-27-b.jpg', '2025-06-28.jpg']);
  });

  it('keeps one per belt, date, suffix and official flag', () => {
    const list = trainings(
      '00-branca/2025-06-27.jpg',
      '00-branca/2025-06-27.png', // same training, other format
      '00-branca/2025-06-27_.jpg', // unofficial: different training
      '01-azul/2025-06-27.jpg', // other belt: different training
    );
    expect(list).toHaveLength(3);
  });

  it('test helper rejects unknown folders', () => {
    expect(() => training('05-coral/2025-06-27.jpg')).toThrow();
  });
});
