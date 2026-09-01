import { COPING_SKILLS, CATEGORY_LABELS, crisisSkills, skillById } from '@/domain/copingCatalog';
import { REGIONS, regionByCode } from '@/domain/crisisResources';
import { JOURNAL_PROMPTS, EMOTIONS } from '@/domain/vocab';

describe('coping catalog', () => {
  it('has unique ids', () => {
    const ids = COPING_SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every skill a name, blurb and at least two steps', () => {
    for (const skill of COPING_SKILLS) {
      expect(skill.name.length).toBeGreaterThan(0);
      expect(skill.blurb.length).toBeGreaterThan(0);
      expect(skill.steps.length).toBeGreaterThanOrEqual(2);
      expect(skill.minutes).toBeGreaterThan(0);
      expect(CATEGORY_LABELS[skill.category]).toBeDefined();
    }
  });

  it('offers enough options for an acute moment', () => {
    expect(crisisSkills().length).toBeGreaterThanOrEqual(10);
  });

  it('never suggests substituting one kind of harm for another', () => {
    // Pain-substitution advice (snapping a band, pinching, "safer" cutting) is
    // not evidence-based and can reinforce the behaviour. It must not creep in.
    const text = COPING_SKILLS.flatMap((s) => [s.name, s.blurb, ...s.steps])
      .join(' ')
      .toLowerCase();
    for (const banned of ['rubber band', 'snap the band', 'pinch yourself', 'red pen on your']) {
      expect(text).not.toContain(banned);
    }
  });

  it('looks skills up by id', () => {
    expect(skillById('breathe_box')?.name).toBe('Box breathing');
    expect(skillById('nope')).toBeUndefined();
  });

  it('points every guided skill at a tool that exists', () => {
    const tools = ['breathing', 'grounding54321', 'timer'];
    for (const skill of COPING_SKILLS) {
      if (skill.tool) expect(tools).toContain(skill.tool);
    }
  });
});

describe('crisis resources', () => {
  it('gives every region an emergency number and at least one line', () => {
    for (const region of REGIONS) {
      expect(region.emergency).toMatch(/^\d+$/);
      expect(region.resources.length).toBeGreaterThan(0);
    }
  });

  it('has unique resource ids across every region', () => {
    const ids = REGIONS.flatMap((r) => r.resources.map((res) => res.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every resource something to actually press', () => {
    for (const region of REGIONS) {
      for (const resource of region.resources) {
        expect(resource.value.length).toBeGreaterThan(0);
        expect(resource.display.length).toBeGreaterThan(0);
        if (resource.method === 'call' || resource.method === 'text') {
          expect(resource.value).toMatch(/\d/);
        } else {
          expect(resource.value).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it('falls back to the first region for an unknown code', () => {
    expect(regionByCode('ZZ')).toBe(REGIONS[0]);
    expect(regionByCode('GB').name).toBe('United Kingdom');
  });

  it('always offers a way out for people outside the listed countries', () => {
    const international = REGIONS.find((r) => r.code === 'INT');
    expect(international).toBeDefined();
    expect(international?.resources.length).toBeGreaterThan(0);
  });
});

describe('prompts and vocabulary', () => {
  it('has unique prompt ids', () => {
    const ids = JOURNAL_PROMPTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate emotions', () => {
    expect(new Set(EMOTIONS).size).toBe(EMOTIONS.length);
  });
});
