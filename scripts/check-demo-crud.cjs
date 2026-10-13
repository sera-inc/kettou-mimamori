'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const {chromium} = require('playwright');
const base = 'http://localhost:8410', out = 'docs/verification/demo-crud';
const seed = JSON.parse(fs.readFileSync('docs/verification/demo-data.json', 'utf8'));
assert.equal(seed.database, 'kettou_demo');assert.equal(seed.synthetic, true);
const secret = fs.readFileSync('.env.local', 'utf8').match(/^API_SECRET=(.+)$/m)[1].trim();
const hash = crypto.createHash('sha1').update(secret).digest('hex');
const marker = '操作確認用-' + crypto.randomUUID();
const cleanup = [], results = [];
async function api(path, method = 'GET', body, authenticated = true) {
  const response = await fetch(base + '/api/v1/' + path, {method, headers: {'Content-Type': 'application/json', ...(authenticated ? {'api-secret': hash} : {})}, body: body === undefined ? undefined : JSON.stringify(body)});
  return {status: response.status, data: await response.json()};
}
function requireOK(response) {assert(response.status >= 200 && response.status < 300, 'Local sample API request failed with status ' + response.status);return response.data;}
async function list(path) {return requireOK(await api(path));}
(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    for (const [path, body] of [['food/', {type: 'food', name: marker, carbs: 10}], ['treatments/', {eventType: 'Note', notes: marker, created_at: new Date().toISOString()}], ['profile/', {defaultProfile: marker, store: {}}]]) {
      const response = await api(path, 'POST', body, false);
      assert([401, 403].includes(response.status), path + ': readable default role must reject writes');
      results.push({case: path + ' unauthenticated create rejected', status: response.status, pass: true});
    }
    const beforeFood = await list('food.json');
    const page = await browser.newPage({viewport: {width: 390, height: 844}, locale: 'ja-JP', serviceWorkers: 'block'});
    const errors = [];page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(value => localStorage.setItem('apisecrethash', JSON.stringify(value)), hash);
    await page.goto(base + '/food');
    await page.waitForFunction(() => window.Nightscout?.client?.hashauth?.isAuthenticated());
    await page.locator('#fe_clear').click();
    for (const [id, value] of [['fe_name', marker], ['fe_portion', '100'], ['fe_carbs', '10'], ['fe_fat', '1'], ['fe_protein', '2'], ['fe_energy', '300']]) await page.locator('#' + id).fill(value);
    const createdResponse = page.waitForResponse(r => r.url().endsWith('/api/v1/food/') && r.request().method() === 'POST');
    await page.locator('#fe_editcreate').focus();await page.keyboard.press('Enter');
    const createdHTTP = await createdResponse;assert(createdHTTP.ok());
    await page.waitForFunction(() => document.getElementById('fe_status').textContent === '記録を保存しました');
    const createdFood = (await createdHTTP.json())[0];assert(createdFood._id);cleanup.push(['food/', createdFood._id]);
    let stored = (await list('food.json')).find(item => item._id === createdFood._id);
    assert.equal(stored.name, marker);assert.equal(Number(stored.carbs), 10);
    await page.reload();await page.waitForSelector('.fe_editimg');await page.locator('#fe_filter_name').fill(marker);
    assert.equal(await page.locator('.fe_editimg').count(), 1);
    await page.locator('.fe_editimg').locator('..').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#fe_id').inputValue(), createdFood._id);
    await page.locator('#fe_carbs').fill('12');
    const updatedResponse = page.waitForResponse(r => r.url().endsWith('/api/v1/food/') && r.request().method() === 'PUT');
    await page.locator('#fe_editcreate').click();assert((await updatedResponse).ok());
    await page.waitForFunction(() => document.getElementById('fe_status').textContent === '記録を保存しました');
    stored = (await list('food.json')).find(item => item._id === createdFood._id);assert.equal(Number(stored.carbs), 12);
    await page.reload();await page.waitForSelector('.fe_editimg');await page.locator('#fe_filter_name').fill(marker);
    const deletedResponse = page.waitForResponse(r => r.url().endsWith('/api/v1/food/' + createdFood._id) && r.request().method() === 'DELETE');
    await page.locator('.fe_removeimg').locator('..').focus();await page.keyboard.press('Space');assert((await deletedResponse).ok());
    await page.waitForFunction(() => document.getElementById('fe_status').textContent === '記録を削除しました');
    const afterFood = await list('food.json');assert(!afterFood.some(item => item._id === createdFood._id));
    assert.deepEqual(afterFood.slice().sort((a,b)=>a._id.localeCompare(b._id)), beforeFood.slice().sort((a,b)=>a._id.localeCompare(b._id)), 'Only the owned temporary food record changes');
    results.push({case: 'Mobile keyboard food create, reload, filter, edit, persist, reload and delete through actual UI and API', pass: true});
    assert.deepEqual(errors, []);await page.close();
    for (const [collection, create, mutate, verify] of [
      ['treatments/', {eventType: 'Note', notes: marker, enteredBy: marker, created_at: new Date().toISOString()}, value => ({...value, notes: marker + ' 更新'}), value => assert.equal(value.notes, marker + ' 更新')],
      ['profile/', (() => {const source = JSON.parse(JSON.stringify({defaultProfile: marker, units: 'mg/dl', startDate: new Date(Date.now() + 30 * 86400000).toISOString(), store: {}}));return source;})(), value => ({...value, defaultProfile: marker + ' 更新', store: {[marker + ' 更新']: Object.values(value.store)[0]}}), value => assert.equal(value.defaultProfile, marker + ' 更新')]
    ]) {
      if (collection === 'profile/') {
        const profiles = await list('profile.json?count=100');const baseline = profiles.find(item => item._id === '000000000000000000000010');assert(baseline);
        create.store[marker] = JSON.parse(JSON.stringify(baseline.store[baseline.defaultProfile]));
      }
      const before = await list(collection.slice(0,-1) + '.json?count=1000');
      const response = requireOK(await api(collection, 'POST', create));const value = Array.isArray(response) ? response[0] : response;assert(value._id);cleanup.push([collection, value._id]);
      let storedValue = (await list(collection.slice(0,-1) + '.json?count=1000')).find(item => item._id === value._id);assert(storedValue);
      if (collection === 'profile/') {
        const profilePage = await browser.newPage({viewport: {width: 390, height: 844}, locale: 'ja-JP', serviceWorkers: 'block'});
        await profilePage.addInitScript(value => localStorage.setItem('apisecrethash', JSON.stringify(value)), hash);
        await profilePage.goto(base + '/profile');await profilePage.waitForSelector('#pe_basal_val_0');
        assert.equal(await profilePage.locator('#pe_profile_name').inputValue(), marker, 'Only edit the temporary owned profile');
        await profilePage.locator('#pe_basal_val_0').fill('0.65');
        const saved = profilePage.waitForResponse(r => r.url().endsWith('/api/v1/profile/') && r.request().method() === 'PUT');
        await profilePage.locator('#pe_submit').focus();await profilePage.keyboard.press('Enter');assert((await saved).ok());
        storedValue = (await list('profile.json?count=1000')).find(item => item._id === value._id);
        assert.equal(Number(storedValue.store[storedValue.defaultProfile].basal[0].value), 0.65);
        await profilePage.reload();await profilePage.waitForSelector('#pe_basal_val_0');assert.equal(Number(await profilePage.locator('#pe_basal_val_0').inputValue()), 0.65);
        assert(await profilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await profilePage.close();results.push({case: 'Mobile keyboard profile save persists the owned future sample profile and survives reload', pass: true});
      }
      requireOK(await api(collection, 'PUT', mutate(storedValue)));
      storedValue = (await list(collection.slice(0,-1) + '.json?count=1000')).find(item => item._id === value._id);verify(storedValue);
      requireOK(await api(collection + value._id, 'DELETE'));
      const after = await list(collection.slice(0,-1) + '.json?count=1000');assert(!after.some(item => item._id === value._id));assert.equal(after.length, before.length);
      results.push({case: collection + ' actual create/read/update/delete of an owned temporary record', pass: true});
    }
    fs.writeFileSync(out + '/results.json', JSON.stringify({generatedAt: new Date().toISOString(), scope: 'Isolated synthetic demo DB; real server persistence; mobile food UI CRUD and API treatment/profile CRUD; default readable role rejects unauthenticated writes; only records created by this run are removed', results}, null, 2));
    console.log('PASS: real food UI CRUD, treatment/profile API CRUD and read-only permission checks.');
  } finally {
    for (const [collection, id] of cleanup) requireOK(await api(collection + id, 'DELETE'));
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode = 1;});
