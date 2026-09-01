import {
  addDays,
  dayRange,
  daysBetween,
  endOfWeek,
  relativeDay,
  startOfWeek,
  toDayKey,
  weekDays,
} from '@/utils/date';

describe('day keys', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDayKey(new Date(2026, 2, 9, 13, 30))).toBe('2026-03-09');
    expect(toDayKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts whole days between keys', () => {
    expect(daysBetween('2026-03-01', '2026-03-08')).toBe(7);
    expect(daysBetween('2026-03-08', '2026-03-01')).toBe(-7);
    expect(daysBetween('2026-03-01', '2026-03-01')).toBe(0);
  });
});

describe('weeks', () => {
  it('starts weeks on Monday', () => {
    // 2026-03-09 is a Monday.
    expect(startOfWeek('2026-03-09')).toBe('2026-03-09');
    expect(startOfWeek('2026-03-13')).toBe('2026-03-09');
    expect(endOfWeek('2026-03-09')).toBe('2026-03-15');
  });

  it('treats Sunday as the end of the previous week, not the start', () => {
    // 2026-03-15 is a Sunday.
    expect(startOfWeek('2026-03-15')).toBe('2026-03-09');
  });

  it('lists seven days Monday first', () => {
    const days = weekDays('2026-03-11');
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-03-09');
    expect(days[6]).toBe('2026-03-15');
  });
});

describe('ranges and labels', () => {
  it('builds an inclusive range', () => {
    expect(dayRange('2026-03-01', '2026-03-04')).toEqual([
      '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04',
    ]);
  });

  it('describes recent days in words', () => {
    expect(relativeDay('2026-03-10', '2026-03-10')).toBe('Today');
    expect(relativeDay('2026-03-09', '2026-03-10')).toBe('Yesterday');
    expect(relativeDay('2026-03-07', '2026-03-10')).toBe('3 days ago');
    expect(relativeDay('2026-03-01', '2026-03-10')).toBe('Sun 1 Mar');
  });
});
