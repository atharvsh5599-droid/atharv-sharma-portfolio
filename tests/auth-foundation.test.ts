import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'vitest';

import {
  checkAuthConfig,
  getAdminGithubIds,
  isAllowedAdminGithubId,
} from '@/lib/auth/admin-allowlist';

describe('Admin Allowlist & Security Foundation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.ADMIN_GITHUB_ID;
    delete process.env.ADMIN_GITHUB_IDS;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_GITHUB_ID;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.AUTH_GITHUB_SECRET;
    delete process.env.GITHUB_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Scenario 1: Missing Configuration (Fail-safe)', () => {
    it('should reject all IDs when no admin ID is configured', () => {
      assert.equal(getAdminGithubIds().size, 0);
      assert.equal(isAllowedAdminGithubId('253749531'), false);
      assert.equal(isAllowedAdminGithubId(253749531), false);
      assert.equal(isAllowedAdminGithubId('random-id'), false);
    });

    it('should accurately report missing environment variables', () => {
      const check = checkAuthConfig();
      assert.equal(check.isConfigured, false);
      assert.ok(check.missing.includes('AUTH_SECRET'));
      assert.ok(check.missing.some((m) => m.includes('ADMIN_GITHUB_ID')));
    });
  });

  describe('Scenario 2: Unauthenticated Users', () => {
    beforeEach(() => {
      process.env.ADMIN_GITHUB_ID = '253749531';
    });

    it('should reject null, undefined, or empty session IDs', () => {
      assert.equal(isAllowedAdminGithubId(null), false);
      assert.equal(isAllowedAdminGithubId(undefined), false);
      assert.equal(isAllowedAdminGithubId(''), false);
      assert.equal(isAllowedAdminGithubId('   '), false);
    });
  });

  describe('Scenario 3: Unauthorized GitHub Accounts', () => {
    beforeEach(() => {
      process.env.ADMIN_GITHUB_ID = '253749531';
    });

    it('should reject valid GitHub numeric IDs not in the allowlist', () => {
      assert.equal(isAllowedAdminGithubId('999999999'), false);
      assert.equal(isAllowedAdminGithubId(999999999), false);
      assert.equal(isAllowedAdminGithubId('12345'), false);
    });

    it('should reject spoofed string usernames even if matching portfolio owner', () => {
      // Must reject usernames like "atharvsh5599-droid"
      assert.equal(isAllowedAdminGithubId('atharvsh5599-droid'), false);
      assert.equal(isAllowedAdminGithubId('atharv-sharma'), false);
    });
  });

  describe('Scenario 4: Configured Administrator (Authorized)', () => {
    beforeEach(() => {
      process.env.ADMIN_GITHUB_ID = '253749531';
    });

    it('should authorize the configured administrator by numeric ID string', () => {
      assert.equal(isAllowedAdminGithubId('253749531'), true);
    });

    it('should authorize the configured administrator by numeric literal', () => {
      assert.equal(isAllowedAdminGithubId(253749531), true);
    });

    it('should handle whitespace in environment variable gracefully', () => {
      process.env.ADMIN_GITHUB_ID = '  253749531  ';
      assert.equal(isAllowedAdminGithubId('253749531'), true);
    });
  });

  describe('Scenario 5: Multiple Allowed Admin IDs', () => {
    beforeEach(() => {
      process.env.ADMIN_GITHUB_ID = '253749531';
      process.env.ADMIN_GITHUB_IDS = '111111, 222222, 333333';
    });

    it('should authorize any ID present in the comma-separated allowlist', () => {
      assert.equal(isAllowedAdminGithubId('253749531'), true);
      assert.equal(isAllowedAdminGithubId('111111'), true);
      assert.equal(isAllowedAdminGithubId('222222'), true);
      assert.equal(isAllowedAdminGithubId('333333'), true);
      assert.equal(isAllowedAdminGithubId('444444'), false);
    });
  });
});
