jest.mock('@upstash/redis', () => ({ Redis: jest.fn((opts) => ({ opts })) }));

describe('redis', () => {
  const env = process.env;
  afterEach(() => {
    process.env = env;
    jest.resetModules();
  });

  it('is configured when both credentials are set', () => {
    process.env = { ...env, UPSTASH_REDIS_REST_URL: 'https://r', UPSTASH_REDIS_REST_TOKEN: 't' };
    jest.isolateModules(() => {
      const mod = jest.requireActual('./redis');
      expect(mod.isRedisConfigured).toBe(true);
      expect(mod.redis.opts).toEqual({ url: 'https://r', token: 't' });
    });
  });

  it('warns and falls back to empty credentials outside tests', () => {
    process.env = { ...env, NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.isolateModules(() => {
      const mod = jest.requireActual('./redis');
      expect(mod.isRedisConfigured).toBe(false);
      expect(mod.redis.opts).toEqual({ url: '', token: '' });
    });
    expect(warn).toHaveBeenCalled();
  });
});
