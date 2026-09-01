import { currentStreak, daysSince, longestStreak } from '@/domain/streaks';

const TODAY = '2026-03-10';

describe('currentStreak', () => {
  it('is zero with no history', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it('counts a run ending today', () => {
    expect(currentStreak(['2026-03-08', '2026-03-09', '2026-03-10'], TODAY)).toBe(3);
  });

  it('survives a day that is not over yet', () => {
    // Nothing logged today, but yesterday's run should still stand.
    expect(currentStreak(['2026-03-08', '2026-03-09'], TODAY)).toBe(2);
  });

  it('breaks when a day was missed', () => {
    expect(currentStreak(['2026-03-05', '2026-03-06'], TODAY)).toBe(0);
  });

  it('ignores duplicate days', () => {
    expect(currentStreak(['2026-03-10', '2026-03-10', '2026-03-09'], TODAY)).toBe(2);
  });
});

describe('longestStreak', () => {
  it('finds the longest run anywhere in the record', () => {
    const days = [
      '2026-01-01', '2026-01-02', '2026-01-03',
      '2026-02-01',
      '2026-03-01', '2026-03-02',
    ];
    expect(longestStreak(days)).toBe(3);
  });

  it('is zero for an empty record', () => {
    expect(longestStreak([])).toBe(0);
  });
});

describe('daysSince', () => {
  it('is null when there is nothing to count from', () => {
    expect(daysSince([], TODAY)).toBeNull();
  });

  it('counts from the most recent day', () => {
    expect(daysSince(['2026-01-01', '2026-03-03'], TODAY)).toBe(7);
  });

  it('is zero when it happened today', () => {
    expect(daysSince(['2026-03-10'], TODAY)).toBe(0);
  });
});
