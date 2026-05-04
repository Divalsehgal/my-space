import { trackEvent, trackInteraction, ANALYTICS_EVENTS, type AnalyticsEventName, type AnalyticsEventPayloads } from './analytics';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: jest.Mock;
  }
}

describe('Analytics Utility', () => {
  beforeEach(() => {
    // Reset window objects
    window.dataLayer = [];
    window.gtag = jest.fn();
    
    // Reset console.info for dev environment testing
    jest.spyOn(console, 'info').mockImplementation(() => { /* No-op */ });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should push standard event to dataLayer', () => {
    trackEvent('test_action', 'TestCategory', { label: 'TestLabel', value: 42 });

    expect(window.dataLayer).toContainEqual(
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

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'test_action',
        custom_prop: 'hello',
      })
    );
  });

  it('should call gtag if available', () => {
    trackEvent('test_action', 'TestCategory');

    expect(window.gtag).toHaveBeenCalledWith('event', 'test_action', expect.objectContaining({
      event_category: 'TestCategory',
    }));
  });

  it('should correctly format nav_click interaction', () => {
    trackInteraction('nav_click', { label: 'Home', href: '/home', location: 'navbar' });
    
    expect(window.dataLayer).toContainEqual(
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
    
    expect(window.dataLayer).toContainEqual(
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
    
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'resume_download',
        event_category: 'Resume',
        event_label: 'Hero Resume Button'
      })
    );
  });

  it('should correctly format project_click interaction', () => {
    trackInteraction('project_click', { projectName: 'MyApp', linkType: 'details' });
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'project_click',
        event_category: 'Projects',
        event_label: 'MyApp'
      })
    );
  });

  it('should correctly format project_view interaction', () => {
    trackInteraction('project_view', { projectName: 'MyApp' });
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'project_view',
        event_category: 'Projects',
        event_label: 'MyApp'
      })
    );
  });

  it('should correctly format page_end_reached interaction', () => {
    trackInteraction('page_end_reached', { label: 'Reached Footer' });
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'page_end_reached',
        event_category: 'Engagement',
        event_label: 'Reached Footer'
      })
    );
  });

  it('should log to console in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error - testing dev environment branch
    process.env.NODE_ENV = 'development';
    
    trackEvent('dev_action', 'DevCategory');
    expect(console.info).toHaveBeenCalledWith(
      '[Analytics Event]',
      expect.objectContaining({ action: 'dev_action', category: 'DevCategory' })
    );

    // @ts-expect-error - restoring environment
    process.env.NODE_ENV = originalEnv;
  });

  it("initializes dataLayer if it does not exist", () => {
    // @ts-expect-error - testing initialization
    delete window.dataLayer;
    trackEvent('init_action', 'InitCat');
    expect(window.dataLayer).toBeDefined();
    expect(window.dataLayer.length).toBeGreaterThan(0);
  });

  it("handles missing payload properties gracefully", () => {
    trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, {} as unknown as AnalyticsEventPayloads[typeof ANALYTICS_EVENTS.NAV_CLICK]);
    trackInteraction(ANALYTICS_EVENTS.SOCIAL_CLICK, {} as unknown as AnalyticsEventPayloads[typeof ANALYTICS_EVENTS.SOCIAL_CLICK]);
    trackInteraction(ANALYTICS_EVENTS.RESUME_VIEW, {} as unknown as AnalyticsEventPayloads[typeof ANALYTICS_EVENTS.RESUME_VIEW]);
    trackInteraction(ANALYTICS_EVENTS.RESUME_DOWNLOAD, {} as unknown as AnalyticsEventPayloads[typeof ANALYTICS_EVENTS.RESUME_DOWNLOAD]);
    trackInteraction(ANALYTICS_EVENTS.CONTACT_SUBMIT, { status: 'success' });
    
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'nav_click', event_category: 'Navigation' }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'social_click', event_category: 'Social' }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'resume_view', event_label: 'Hero Resume Button' }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'resume_download', event_label: 'Hero Resume Button' }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'contact_submit', event_category: 'Contact' }));
  });

  it('should use default label for page_end_reached if missing', () => {
    trackInteraction(ANALYTICS_EVENTS.PAGE_END_REACHED, {} as unknown as AnalyticsEventPayloads[typeof ANALYTICS_EVENTS.PAGE_END_REACHED]);
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'page_end_reached',
        event_label: 'Reached Footer'
      })
    );
  });

  it('should use provided label for page_end_reached', () => {
    trackInteraction('page_end_reached', { label: 'Custom Footer' });
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'page_end_reached',
        event_label: 'Custom Footer'
      })
    );
  });

  it('should handle unknown event types in trackInteraction', () => {
    trackInteraction('unknown_event' as unknown as AnalyticsEventName, { some: 'data' } as unknown as AnalyticsEventPayloads[AnalyticsEventName]);
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'unknown_event',
        event_category: 'General'
      })
    );
  });
});
