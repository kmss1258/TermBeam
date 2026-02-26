const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createAuth } = require('../src/auth');

describe('Auth', () => {
  describe('createAuth', () => {
    it('should store the password', () => {
      const auth = createAuth('secret');
      assert.strictEqual(auth.password, 'secret');
    });

    it('should handle null password', () => {
      const auth = createAuth(null);
      assert.strictEqual(auth.password, null);
    });
  });

  describe('tokens', () => {
    it('should generate and validate a token', () => {
      const auth = createAuth('pw');
      const token = auth.generateToken();
      assert.ok(token);
      assert.strictEqual(typeof token, 'string');
      assert.ok(auth.validateToken(token));
    });

    it('should reject invalid token', () => {
      const auth = createAuth('pw');
      assert.strictEqual(auth.validateToken('invalid-token'), false);
    });

    it('should reject empty token', () => {
      const auth = createAuth('pw');
      assert.strictEqual(auth.validateToken(''), false);
      assert.strictEqual(auth.validateToken(undefined), false);
    });
  });

  describe('parseCookies', () => {
    it('should parse cookie string', () => {
      const auth = createAuth(null);
      const cookies = auth.parseCookies('foo=bar; baz=qux');
      assert.strictEqual(cookies.foo, 'bar');
      assert.strictEqual(cookies.baz, 'qux');
    });

    it('should handle empty string', () => {
      const auth = createAuth(null);
      const cookies = auth.parseCookies('');
      assert.deepStrictEqual(cookies, {});
    });

    it('should handle cookies with = in value', () => {
      const auth = createAuth(null);
      const cookies = auth.parseCookies('token=abc=def=ghi');
      assert.strictEqual(cookies.token, 'abc=def=ghi');
    });
  });

  describe('middleware', () => {
    it('should skip auth when no password set', () => {
      const auth = createAuth(null);
      let called = false;
      auth.middleware({ cookies: {} }, {}, () => {
        called = true;
      });
      assert.ok(called);
    });

    it('should reject when password set and no credentials', () => {
      const auth = createAuth('secret');
      let statusCode = null;
      let jsonBody = null;
      const req = { cookies: {}, headers: {}, accepts: () => false };
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(body) {
          jsonBody = body;
        },
        redirect() {},
      };
      auth.middleware(req, res, () => {});
      assert.strictEqual(statusCode, 401);
    });

    it('should accept valid Bearer token', () => {
      const auth = createAuth('secret');
      let called = false;
      const req = {
        cookies: {},
        headers: { authorization: 'Bearer secret' },
        accepts: () => false,
      };
      auth.middleware(req, {}, () => {
        called = true;
      });
      assert.ok(called);
    });

    it('should accept valid cookie token', () => {
      const auth = createAuth('secret');
      const token = auth.generateToken();
      let called = false;
      const req = { cookies: { pty_token: token }, headers: {}, accepts: () => false };
      auth.middleware(req, {}, () => {
        called = true;
      });
      assert.ok(called);
    });
  });

  describe('rateLimit', () => {
    it('should allow first 5 attempts', () => {
      const auth = createAuth('pw');
      let count = 0;
      const req = { ip: '1.2.3.4' };
      const res = {
        status() {
          return this;
        },
        json() {},
      };
      for (let i = 0; i < 5; i++) {
        auth.rateLimit(req, res, () => {
          count++;
        });
      }
      assert.strictEqual(count, 5);
    });

    it('should block 6th attempt', () => {
      const auth = createAuth('pw');
      let blocked = false;
      const req = { ip: '5.6.7.8' };
      const res = {
        status(code) {
          if (code === 429) blocked = true;
          return this;
        },
        json() {},
      };
      for (let i = 0; i < 6; i++) {
        auth.rateLimit(req, res, () => {});
      }
      assert.ok(blocked);
    });
  });

  describe('loginHTML', () => {
    it('should contain TermBeam branding', () => {
      const auth = createAuth('pw');
      assert.ok(auth.loginHTML.includes('TermBeam'));
      assert.ok(auth.loginHTML.includes('Term<span>Beam</span>'));
    });
  });
});
