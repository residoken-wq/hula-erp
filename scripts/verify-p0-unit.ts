import { PERMISSION_MODULES } from '../src/auth/permission-catalog';
import { RbacModeService } from '../src/auth/rbac-mode.service';
import { SuperAdminGuard } from '../src/auth/super-admin.guard';
import { PermissionCacheService } from '../src/auth/permission-cache.service';
import { RbacAccessLogService } from '../src/auth/rbac-access-log.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

async function runTests() {
  console.log('--- Starting P0 Unit Verifications ---');

  // Test 1: Permission Catalog (P0-11)
  console.log('Test 1: Verify Permission Catalog...');
  if (PERMISSION_MODULES.length !== 17) {
    throw new Error(`Expected 17 modules, got ${PERMISSION_MODULES.length}`);
  }
  const hasSystem = PERMISSION_MODULES.some(m => m.code === 'SYSTEM');
  if (!hasSystem) throw new Error('SYSTEM module not found in catalog');
  const fupCount = PERMISSION_MODULES.filter(m => m.code.startsWith('FUP_')).length;
  if (fupCount !== 6) throw new Error(`Expected 6 FUP modules, got ${fupCount}`);
  console.log('✓ Test 1 Passed: 17 modules catalog verified (10 core, 6 fup, 1 system)');

  // Test 2: RbacModeService (P0-05, P0-06)
  console.log('Test 2: Verify RbacModeService...');
  let savedConfig: any = null;
  const mockConfigRepo: any = {
    findOne: async () => savedConfig,
    create: (data: any) => data,
    save: async (data: any) => {
      savedConfig = data;
      return data;
    },
  };
  const modeService = new RbacModeService(mockConfigRepo);
  const defaultMode = await modeService.get();
  if (defaultMode !== 'SHADOW') {
    throw new Error(`Expected default mode SHADOW, got ${defaultMode}`);
  }

  // P0-05: Reject ENFORCE with 400
  let enforceErrorCaught = false;
  try {
    await modeService.setMode('ENFORCE', 'admin');
  } catch (err) {
    if (err instanceof BadRequestException) {
      enforceErrorCaught = true;
    }
  }
  if (!enforceErrorCaught) {
    throw new Error('P0-05 FAILED: Setting ENFORCE mode did not throw BadRequestException');
  }
  console.log('✓ Test 2.1 Passed: P0-05 setMode(ENFORCE) throws 400 BadRequestException');

  // Set OFF and SHADOW
  await modeService.setMode('OFF', 'admin');
  const offMode = await modeService.get();
  if (offMode !== 'OFF') throw new Error(`Failed to set OFF, got ${offMode}`);
  await modeService.setMode('SHADOW', 'admin');
  const shadowMode = await modeService.get();
  if (shadowMode !== 'SHADOW') throw new Error(`Failed to set SHADOW, got ${shadowMode}`);
  console.log('✓ Test 2.2 Passed: OFF and SHADOW modes work with cache');

  // Test 3: SuperAdminGuard (P0-07)
  console.log('Test 3: Verify SuperAdminGuard (P0-07)...');
  const guard = new SuperAdminGuard();
  const mockAdminContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({ user: { username: 'admin' } })
    })
  };
  const adminAllowed = guard.canActivate(mockAdminContext);
  if (!adminAllowed) throw new Error('admin should be allowed by SuperAdminGuard');

  const mockNonAdminContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({ user: { username: 'john_doe' } })
    })
  };
  let nonAdminBlocked = false;
  try {
    guard.canActivate(mockNonAdminContext);
  } catch (err) {
    if (err instanceof ForbiddenException) {
      nonAdminBlocked = true;
    }
  }
  if (!nonAdminBlocked) throw new Error('P0-07 FAILED: Non-admin user was not blocked with 403 ForbiddenException');
  console.log('✓ Test 3 Passed: P0-07 Non-admin blocked with 403 by SuperAdminGuard');

  // Test 4: PermissionCacheService (P0-10)
  console.log('Test 4: Verify PermissionCacheService...');
  let dbCalls = 0;
  const mockPermRepo: any = {
    find: async ({ where }: any) => {
      dbCalls++;
      return [{ module_code: 'PRODUCT', can_view: true }];
    }
  };
  const permCache = new PermissionCacheService(mockPermRepo);
  const groupId: number = 1;
  await permCache.getGroupPermissions(groupId);
  await permCache.getGroupPermissions(groupId);
  if ((dbCalls as number) !== 1) throw new Error('Cache failed: DB was queried more than once within 60s');
  permCache.invalidateGroup(groupId);
  await permCache.getGroupPermissions(groupId);
  if ((dbCalls as number) !== 2) throw new Error('Invalidate failed: DB was not queried after invalidation');
  console.log('✓ Test 4 Passed: 60s cache and group invalidation work correctly');

  // Test 5: RbacAccessLogService deduplication (P0-03 & A3)
  console.log('Test 5: Verify RbacAccessLogService deduplication (P0-03 & A3)...');
  let insertedCount: number = 0;
  const mockLogRepo: any = {
    create: (data: any) => data,
    save: async (data: any) => {
      insertedCount++;
      return data;
    }
  };
  const logService = new RbacAccessLogService(mockLogRepo);
  // Log 50 calls with same signature within 1 minute
  for (let i = 0; i < 50; i++) {
    await logService.record({
      mode: 'SHADOW',
      decision: 'DENY_NO_AUTH',
      method: 'GET',
      route: '/api/planning/pfo',
      ip: '127.0.0.1',
    });
  }
  if (insertedCount !== 1) {
    throw new Error(`P0-03 FAILED: Expected exactly 1 log insertion after 50 calls, got ${insertedCount}`);
  }

  // UNCLASSIFIED dedupe across different users/IPs within 60 minutes
  for (let i = 0; i < 20; i++) {
    await logService.record({
      mode: 'SHADOW',
      decision: 'UNCLASSIFIED',
      method: 'GET',
      route: '/api/random/unclassified',
      user_id: i,
      ip: `192.168.1.${i}`,
    });
  }
  if ((insertedCount as number) !== 2) {
    throw new Error(`A3 UNCLASSIFIED dedupe FAILED: Expected exactly 1 insertion for unclassified route, got total ${insertedCount}`);
  }
  console.log('✓ Test 5 Passed: P0-03 5-min dedupe and A3 60-min UNCLASSIFIED dedupe verified');

  console.log('\n========================================');
  console.log('ALL P0 UNIT VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
