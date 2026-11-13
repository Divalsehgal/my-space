import { buildSiteIndex } from './site-index';
import { PortfolioConfigSchema } from '@/features/portfolio';

describe('buildSiteIndex', () => {
  const t = ((key: string) => (key === 'about.body' ? 'One.\n\nTwo.' : key)) as never;

  it('maps a full config', () => {
    const config = PortfolioConfigSchema.parse({
      socials: [{ label: 'GitHub', href: 'https://github.com/x', icon: 'gh' }],
      hero: { resumeUrl: '/cv.pdf' },
      contact: { email: 'a@b.co' },
      experience: [{ company: 'Acme', role: 'Engineer', period: '2024', description: [] }],
      skills: { languages: [{ name: 'TS' }] },
      projects: [
        { name: 'P1', description: 'd', link: 'https://p1.dev' },
        { name: 'P2', description: 'd', repo: 'https://github.com/p2' },
      ],
    });
    const index = buildSiteIndex(config, [{ title: 'Post', slug: 'post' }], t);
    expect(index).toMatchObject({
      name: 'common.siteName',
      role: 'Engineer',
      email: 'a@b.co',
      resumeUrl: '/cv.pdf',
      socials: [{ label: 'GitHub', href: 'https://github.com/x' }],
      skills: ['TS'],
      experience: [{ role: 'Engineer', company: 'Acme', period: '2024' }],
      projects: [
        { name: 'P1', href: 'https://p1.dev' },
        { name: 'P2', href: 'https://github.com/p2' },
      ],
      posts: [{ title: 'Post', slug: 'post' }],
    });
    expect(index.about.length).toBeGreaterThan(0);
    expect(index.sections.find((s) => s.id === 'architecture')?.href).toBe('/architecture');
    expect(index.sections.find((s) => s.id === 'about')?.href).toBe('/#about');
  });

  it('falls back to the default role with no experience', () => {
    const index = buildSiteIndex(PortfolioConfigSchema.parse({}), []);
    expect(index.role).toBeTruthy();
    expect(index.email).toBeUndefined();
  });
});
