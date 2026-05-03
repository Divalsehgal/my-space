import { trackEvent, trackInteraction } from './analytics';

describe('Analytics Utility', () => {
  beforeEach(() => {
    // Reset window objects
    (window as any).dataLayer = [];
    (window as any).gtag = jest.fn();
    
    // Reset console.info for dev environment testing
    jest.spyOn(console, 'info').mockImplementation(() => { /* No-op */ });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should push standard event to dataLayer', () => {
    trackEvent('test_action', 'TestCategory', { label: 'TestLabel', value: 42 });

    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'test_action',
        event_category: 'TestCategory',
        event_label: 'TestLabel',
        value: 42,
      })
    );
  });

  it('should push additional parameters to dataLayer', () => {
    trackEvent('test_action', 'TestCategory', { additionalParams: { custom_prop: 'hello' } });

    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'test_action',
        custom_prop: 'hello',
      })
    );
  });

  it('should call gtag if available', () => {
    trackEvent('test_action', 'TestCategory');

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'test_action', expect.objectContaining({
      event_category: 'TestCategory',
    }));
  });

  it('should correctly format nav_click interaction', () => {
    trackInteraction('nav_click', { label: 'Home', href: '/home', location: 'navbar' });
    
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'nav_click',
        event_category: 'Navigation',
        event_label: 'Home',
        href: '/home',
        location: 'navbar'
      })
    );
  });

  it('should correctly format social_click interaction', () => {
    trackInteraction('social_click', { platform: 'github', href: 'https://github.com' });
    
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'social_click',
        event_category: 'Social',
        event_label: 'github',
        href: 'https://github.com'
      })
    );
  });

  it('should correctly format resume_download interaction', () => {
    trackInteraction('resume_download', { label: 'Hero Resume Button' });
    
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'resume_download',
        event_category: 'Resume',
        event_label: 'Hero Resume Button'
      })
    );
  });

  it('should correctly format project_click interaction', () => {
    trackInteraction('project_click', { projectName: 'MyApp', linkType: 'details' });
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'project_click',
        event_category: 'Projects',
        event_label: 'MyApp'
      })
    );
  });

  it('should correctly format project_view interaction', () => {
    trackInteraction('project_view', { projectName: 'MyApp' });
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'project_view',
        event_category: 'Projects',
        event_label: 'MyApp'
      })
    );
  });

  it('should correctly format page_end_reached interaction', () => {
    trackInteraction('page_end_reached', { label: 'Reached Footer' });
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'page_end_reached',
        event_category: 'Engagement',
        event_label: 'Reached Footer'
      })
    );
  });

  it('should log to console in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-ignore
    process.env.NODE_ENV = 'development';
    
    trackEvent('dev_action', 'DevCategory');
    expect(console.info).toHaveBeenCalledWith(
      '[Analytics Event]',
      expect.objectContaining({ action: 'dev_action', category: 'DevCategory' })
    );

    // @ts-ignore
    process.env.NODE_ENV = originalEnv;
  });

  it("initializes dataLayer if it does not exist", () => {
    delete (window as any).dataLayer;
    trackEvent('init_action', 'InitCat');
    expect((window as any).dataLayer).toBeDefined();
    expect((window as any).dataLayer.length).toBeGreaterThan(0);
  });

  it("handles missing payload properties gracefully", () => {
    trackInteraction('nav_click', {} as any);
    trackInteraction('social_click', {} as any);
    trackInteraction('resume_view', {} as any);
    trackInteraction('resume_download', {} as any);
    trackInteraction('contact_submit', { status: 'success' });
    
    expect((window as any).dataLayer).toContainEqual(expect.objectContaining({ event: 'nav_click', event_category: 'Navigation' }));
    expect((window as any).dataLayer).toContainEqual(expect.objectContaining({ event: 'social_click', event_category: 'Social' }));
    expect((window as any).dataLayer).toContainEqual(expect.objectContaining({ event: 'resume_view', event_label: 'Hero Resume Button' }));
    expect((window as any).dataLayer).toContainEqual(expect.objectContaining({ event: 'resume_download', event_label: 'Hero Resume Button' }));
    expect((window as any).dataLayer).toContainEqual(expect.objectContaining({ event: 'contact_submit', event_category: 'General' }));
  });

  it('should use default label for page_end_reached if missing', () => {
    trackInteraction('page_end_reached', {} as any);
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'page_end_reached',
        event_label: 'Reached Footer'
      })
    );
  });

  it('should use provided label for page_end_reached', () => {
    trackInteraction('page_end_reached', { label: 'Custom Footer' });
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'page_end_reached',
        event_label: 'Custom Footer'
      })
    );
  });

  it('should handle unknown event types in trackInteraction', () => {
    trackInteraction('unknown_event' as any, { some: 'data' } as any);
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'unknown_event',
        event_category: 'General'
      })
    );
  });
});
