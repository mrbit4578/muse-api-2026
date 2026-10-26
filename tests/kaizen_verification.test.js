// Comprehensive Kaizen Verification Test Suite for API Muse 2026
const assert = require('assert');

// Mock req and res helper
function mockReqRes(options = {}) {
  const req = {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: options.headers || {},
    query: options.query, // can be undefined
    body: options.body || {},
    on: (evt, cb) => {}
  };

  const resData = {
    statusCode: 200,
    headers: {},
    body: null,
    chunks: []
  };

  const res = {
    statusCode: 200,
    setHeader: (k, v) => { resData.headers[k] = v; },
    status: (code) => { resData.statusCode = code; return res; },
    json: (obj) => { resData.body = obj; return res; },
    end: (content) => { if (content) resData.body = content; return res; },
    write: (chunk) => { resData.chunks.push(chunk); }
  };

  return { req, res, resData };
}

async function runTests() {
  console.log('========================================================');
  console.log('🚀 RUNNING KAIZEN VERIFICATION TEST SUITE (API MUSE 2026)');
  console.log('========================================================\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      if (err.stack) console.error(err.stack);
      failed++;
    }
  }

  // TEST 1: api/auth/status safe req.query
  await test('api/auth/status handles undefined req.query safely without TypeError', async () => {
    const statusHandler = require('../api/auth/status');
    const { req, res, resData } = mockReqRes({ method: 'GET', query: undefined });
    await statusHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(typeof resData.body.authenticated, 'boolean');
  });

  // TEST 2: api/v1/videos safe req.query & URL parsing
  await test('api/v1/videos GET handles undefined req.query and URL safely', async () => {
    const videosHandler = require('../api/v1/videos');
    const { req, res, resData } = mockReqRes({ method: 'GET', query: undefined, url: '/v1/videos' });
    await videosHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.object, 'list');
  });

  // TEST 3: api/v1/videos POST generation
  await test('api/v1/videos POST creates video task with duration & aspect_ratio', async () => {
    const videosHandler = require('../api/v1/videos');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: { prompt: 'Vietnamese cinematic drama night scene', duration: 15, aspect_ratio: '16:9' }
    });
    await videosHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.object, 'video');
    assert.strictEqual(resData.body.status, 'completed');
    assert.strictEqual(resData.body.data[0].duration, 15);
  });

  // TEST 4: api/auth/mailtm-otp safe navigation
  await test('api/auth/mailtm-otp poll handles undefined req.query and missing token safely', async () => {
    const mailtmHandler = require('../api/auth/mailtm-otp');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      query: undefined,
      body: { action: 'poll' }
    });
    await mailtmHandler(req, res);
    assert.strictEqual(resData.statusCode, 400);
    assert.strictEqual(resData.body.error, 'Thiếu mã token Mail.tm');
  });

  // TEST 5: api/v1/models returns foundation models + 5 AI Personas
  await test('api/v1/models exposes foundation models and Stanford CS229 AI Personas', async () => {
    const modelsHandler = require('../api/v1/models');
    const { req, res, resData } = mockReqRes({ method: 'GET' });
    await modelsHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    const modelList = resData.body.data;
    assert(modelList.length >= 10, 'Expected at least 10 models/personas');
    const personaIds = ['muse-coder', 'muse-analyst', 'muse-assistant', 'muse-creative', 'muse-researcher'];
    for (const pid of personaIds) {
      const found = modelList.find(m => m.id === pid);
      assert(found, `Missing persona: ${pid}`);
      assert(found.decoding_defaults, `Missing decoding_defaults for ${pid}`);
    }
  });

  // TEST 6: api/v1/chat/completions Fix line 189 syntax/reference error on "bạn là ai"
  await test('api/v1/chat/completions resolves "bạn là ai" without ReferenceError (v1 is not defined)', async () => {
    const chatHandler = require('../api/v1/chat/completions');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: {
        model: 'muse-spark-1.1',
        messages: [{ role: 'user', content: 'bạn là ai?' }]
      }
    });
    await chatHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    const content = resData.body.choices[0].message.content;
    assert(content.includes('Muse AI'), 'Expected Muse AI in content');
    assert(content.includes('/v1/chat/completions'), 'Expected endpoint in content');
  });

  // TEST 7: api/v1/chat/completions Stanford CS229 Decoding Presets & Usage Tokens
  await test('api/v1/chat/completions applies deterministic preset (T=0.1, P=0.1) & calculates BPE tokens', async () => {
    const chatHandler = require('../api/v1/chat/completions');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: {
        model: 'muse-spark-1.1',
        preset: 'deterministic',
        messages: [{ role: 'user', content: 'Xin chào, hãy giới thiệu hệ thống.' }]
      }
    });
    await chatHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.cs229_metadata.preset, 'deterministic');
    assert.strictEqual(resData.body.cs229_metadata.temperature, 0.1);
    assert.strictEqual(resData.body.cs229_metadata.top_p, 0.1);
    assert(resData.body.usage.prompt_tokens > 0);
    assert(resData.body.usage.completion_tokens > 0);
    assert(resData.body.usage.total_tokens === resData.body.usage.prompt_tokens + resData.body.usage.completion_tokens);
  });

  // TEST 8: AI Persona muse-coder
  await test('api/v1/chat/completions supports muse-coder with clean code and Big-O evaluation', async () => {
    const chatHandler = require('../api/v1/chat/completions');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: {
        model: 'muse-coder',
        messages: [{ role: 'user', content: 'Viết code JavaScript kết nối API' }]
      }
    });
    await chatHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    const content = resData.body.choices[0].message.content;
    assert(content.includes('Senior Software Architect'), 'Expected Senior Software Architect');
    assert(content.includes('```javascript'), 'Expected code block');
    assert(resData.body.cs229_metadata.temperature, 0.1);
  });

  // TEST 9: AI Persona muse-creative
  await test('api/v1/chat/completions supports muse-creative with high entropy T=1.1 & dramatic script', async () => {
    const chatHandler = require('../api/v1/chat/completions');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: {
        model: 'muse-creative',
        messages: [{ role: 'user', content: 'Viết ý tưởng phân cảnh phim drama mẹ chồng nàng dâu' }]
      }
    });
    await chatHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    const content = resData.body.choices[0].message.content;
    assert(content.includes('Master Creative Director') || content.includes('Creative Sampling Entropy'), 'Expected Creative persona');
    assert.strictEqual(resData.body.cs229_metadata.temperature, 1.1);
  });

  // TEST 10: Attention Context Window Sliding Pruning (20+ messages)
  await test('api/v1/chat/completions prunes conversation exceeding 20 messages to protect O(T^2) Attention', async () => {
    const chatHandler = require('../api/v1/chat/completions');
    const messages = [{ role: 'system', content: 'System instruction: be helpful.' }];
    for (let i = 1; i <= 25; i++) {
      messages.push({ role: 'user', content: `Message number ${i}` });
      messages.push({ role: 'assistant', content: `Reply number ${i}` });
    }
    messages.push({ role: 'user', content: 'Final question.' });

    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: {
        model: 'muse-spark-1.1',
        messages: messages
      }
    });
    await chatHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.cs229_metadata.context_pruned, true);
  });

  // TEST 11: Streaming SSE Response
  await test('api/v1/chat/completions supports SSE streaming', async () => {
    const chatHandler = require('../api/v1/chat/completions');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: {
        model: 'muse-spark-1.1',
        messages: [{ role: 'user', content: 'Xin chào Muse' }],
        stream: true
      }
    });
    await chatHandler(req, res);
    assert.strictEqual(resData.headers['Content-Type'], 'text/event-stream; charset=utf-8');
    assert(resData.chunks.length > 0, 'Expected SSE stream chunks');
    const firstChunk = resData.chunks[0];
    assert(firstChunk.startsWith('data: '), 'First chunk is valid SSE');
  });

  // TEST 12: Account Pool Sync & Listing
  await test('api/accounts supports sync and listing accounts', async () => {
    const accountsHandler = require('../api/accounts');
    const testAcc = {
      action: 'sync',
      id: 'acc_test_live_01',
      email: 'pilot@muse.ai',
      apiKey: 'sk-muse-live-test-key-12345678',
      cookies: { hatch_sess: 'valid-sess-token-xyz' },
      plan: 'Pro / Unlimited'
    };
    const { req: syncReq, res: syncRes, resData: syncData } = mockReqRes({
      method: 'POST',
      body: testAcc
    });
    await accountsHandler(syncReq, syncRes);
    assert.strictEqual(syncData.statusCode, 200);
    assert.strictEqual(syncData.body.success, true);
    assert.strictEqual(syncData.body.account.email, 'pilot@muse.ai');

    // List
    const { req: listReq, res: listRes, resData: listData } = mockReqRes({ method: 'GET' });
    await accountsHandler(listReq, listRes);
    assert.strictEqual(listData.statusCode, 200);
    assert(listData.body.count >= 1);
    const found = listData.body.accounts.find(a => a.id === 'acc_test_live_01');
    assert(found, 'Expected to find synced account in pool');
  });

  // TEST 13: Live Account Verification (Single Account)
  await test('api/accounts checks live account with latency ping and token validation', async () => {
    const accountsHandler = require('../api/accounts');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: { action: 'check', id: 'acc_test_live_01' }
    });
    await accountsHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.success, true);
    assert.strictEqual(resData.body.mode, 'single');
    assert.strictEqual(resData.body.account.id, 'acc_test_live_01');
    assert(typeof resData.body.account.isLive === 'boolean');
    assert(typeof resData.body.account.latencyMs === 'number');
    assert(resData.body.account.lastChecked !== null);
  });

  // TEST 14: Batch Live Verification (Check All)
  await test('api/accounts check_all verifies entire account pool concurrently', async () => {
    const accountsHandler = require('../api/accounts');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: { action: 'check_all' }
    });
    await accountsHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.success, true);
    assert.strictEqual(resData.body.mode, 'all');
    assert(resData.body.total >= 1);
    assert(Array.isArray(resData.body.results));
    assert(typeof resData.body.liveCount === 'number');
  });

  // TEST 15: Delete Account from Pool
  await test('api/accounts DELETE removes account cleanly', async () => {
    const accountsHandler = require('../api/accounts');
    const { req, res, resData } = mockReqRes({
      method: 'DELETE',
      body: { id: 'acc_test_live_01' }
    });
    await accountsHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.success, true);
  });

  // TEST 16: Chrome Auto-Connect Session Extraction
  await test('api/auth/extract-session handles Chrome auto-connect session with Meta user ID', async () => {
    const extractHandler = require('../api/auth/extract-session');
    const { req, res, resData } = mockReqRes({
      method: 'POST',
      body: {
        cookieString: 'datr=sample123; hatch_sess=sess_abc; hatch_vml=vml_def',
        meta_user: { kind: 'user', identifier: '1401136416407282' },
        quota: { total: 1000000, used: 23000, remaining: 977000 },
        vm_state: 'RUNNING'
      }
    });
    await extractHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.body.success, true);
    assert(resData.body.apiKey.startsWith('sk-muse-'));
    assert.strictEqual(resData.body.account.email, 'meta_1401136416407282@muse.ai');
    assert.strictEqual(resData.body.account.quota.remaining, 977000);
    assert.strictEqual(resData.body.account.vmState, 'RUNNING');
  });

  // TEST 17: Deterministic API Key Guarantee (No Key Drift Across Invocations)
  await test('api/auth/extract-session & api/accounts guarantee identical deterministic API Key across runs', async () => {
    const extractHandler = require('../api/auth/extract-session');
    const accountsHandler = require('../api/accounts');

    // First extraction run
    const run1 = mockReqRes({
      method: 'POST',
      body: {
        cookieString: 'datr=abc; hatch_sess=s1',
        meta_user: { kind: 'user', identifier: '1401136416407282' }
      }
    });
    await extractHandler(run1.req, run1.res);
    const key1 = run1.resData.body.apiKey;

    // Second extraction run (simulating running the snippet in DevTools console again)
    const run2 = mockReqRes({
      method: 'POST',
      body: {
        cookieString: 'datr=xyz; hatch_sess=s2',
        meta_user: { kind: 'user', identifier: '1401136416407282' }
      }
    });
    await extractHandler(run2.req, run2.res);
    const key2 = run2.resData.body.apiKey;

    // Both extractions must produce the EXACT same deterministic key!
    assert.strictEqual(key1, key2, 'API Key must not drift between snippet runs!');

    // Account sync must also resolve to the identical deterministic key
    const syncRun = mockReqRes({
      method: 'POST',
      body: {
        action: 'sync',
        email: 'meta_1401136416407282@muse.ai'
      }
    });
    await accountsHandler(syncRun.req, syncRun.res);
    const syncKey = syncRun.resData.body.account.apiKey;
    assert.strictEqual(key1, syncKey, 'Accounts sync key must match extract-session key!');
  });

  // TEST 18: Android Mobile Extraction Compatibility
  await test('api/auth/extract-session handles Android mobile extraction payload smoothly', async () => {
    const extractHandler = require('../api/auth/extract-session');
    const androidRun = mockReqRes({
      method: 'POST',
      body: {
        cookieString: 'datr=android_cookie_val; hatch_sess=sess_android_123',
        email: 'meta_android_dev_01@muse.ai',
        plan: 'Pro / Unlimited',
        vm_state: 'RUNNING'
      }
    });
    await extractHandler(androidRun.req, androidRun.res);
    assert.strictEqual(androidRun.resData.statusCode, 200);
    assert.strictEqual(androidRun.resData.body.success, true);
    assert(androidRun.resData.body.apiKey.startsWith('sk-muse-'));
    assert.strictEqual(androidRun.resData.body.account.email, 'meta_android_dev_01@muse.ai');
    assert.strictEqual(androidRun.resData.body.account.status, 'Live (Trình duyệt Chrome)');
  });

  // Summary
  console.log('\n========================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
