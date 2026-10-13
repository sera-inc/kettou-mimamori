'use strict';
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const moment = require('moment-timezone');
const uri = process.env.DEMO_MONGO_URI || 'mongodb://127.0.0.1:27118/kettou_demo';
if (!/^mongodb:\/\/(?:127\.0\.0\.1:27118|mongo:27017)\/kettou_demo$/.test(uri)) throw new Error('Only the isolated local demo database is allowed.');
(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const now = Math.floor(Date.now() / 300000) * 300000;
    const start = moment.tz(now, 'Asia/Tokyo').startOf('day').subtract(13, 'days').valueOf();
    const profileName = '確認用プロフィール';
    const series = value => [{ time: '00:00', timeAsSeconds: '0', value: String(value) }];
    const profile = { _id: new ObjectId('000000000000000000000010'), defaultProfile: profileName, startDate: new Date(start).toISOString(), mills: start, units: 'mg/dl', store: { [profileName]: { dia: '4', carbratio: series(12), sens: series(50), basal: series(0.6), target_low: series(80), target_high: series(180), carbs_hr: '20', delay: '0', units: 'mg/dl', timezone: 'Asia/Tokyo' } } };
    await db.collection('profile').replaceOne({ _id: profile._id }, profile, { upsert: true });
    if (process.argv.includes('--profile-only')) { console.log('Baseline profile fixture ready.'); return; }
    const entries = [];
    for (let t = start; t <= now; t += 300000) {
      const index = (t - start) / 300000;
      const sgv = Math.round(126 + 45 * Math.sin(index / 14) + 25 * Math.sin(index / 43));
      entries.push({ updateOne: { filter: { date: t, device: 'kettou-demo', type: 'sgv' }, update: { $set: { date: t, dateString: new Date(t).toISOString(), type: 'sgv', sgv, filtered: sgv * 1000, unfiltered: sgv * 1000 + 100, direction: index % 9 < 5 ? 'Flat' : 'FortyFiveUp', device: 'kettou-demo', noise: 1 } }, upsert: true } });
    }
    for (let day = 0; day < 14; day++) {
      const date = start + day * 86400000 + 8 * 3600000;
      if (date > now) continue;
      for (const entry of [{type: 'mbg', mbg: 125}, {type: 'cal', scale: 1, slope: 1000, intercept: 0}]) {
        entries.push({updateOne: {filter: {date, device: 'kettou-demo', type: entry.type}, update: {$set: {...entry, date, dateString: new Date(date).toISOString(), device: 'kettou-demo'}}, upsert: true}});
      }
    }
    await db.collection('entries').bulkWrite(entries);
    const treatments = [];
    for (let day = 0; day < 14; day++) for (const hour of [7, 12, 19]) {
      const millis = start + day * 86400000 + hour * 3600000;
      if (millis > now) continue;
      treatments.push({ updateOne: { filter: { created_at: new Date(millis).toISOString(), enteredBy: '画面確認用' }, update: { $set: { eventType: 'Meal Bolus', carbs: hour === 12 ? 60 : 45, insulin: hour === 12 ? 4 : 3, created_at: new Date(millis).toISOString(), enteredBy: '画面確認用', notes: '表示確認の記録', glucoseType: 'Sensor', glucose: 120 } }, upsert: true } });
    }
    const events = [[2, {eventType: 'Sensor Change'}], [3, {eventType: 'Site Change'}], [4, {eventType: 'Insulin Change'}], [8, {eventType: 'BG Check', glucose: 125, glucoseType: 'Finger'}], [9, {eventType: 'Temp Basal', absolute: 0.8, duration: 30}], [10, {eventType: 'Note', notes: '血糖と食事の記録を確認'}], [15, {eventType: 'Exercise', duration: 30}]];
    for (let day = 0; day < 14; day++) for (const [hour, event] of events) {
      if (['Sensor Change', 'Site Change', 'Insulin Change'].includes(event.eventType) && day % 3 !== 0) continue;
      const millis = start + day * 86400000 + hour * 3600000;
      if (millis > now) continue;
      const created_at = new Date(millis).toISOString();
      treatments.push({updateOne: {filter: {created_at, enteredBy: '画面確認用', eventType: event.eventType}, update: {$set: {...event, created_at, enteredBy: '画面確認用', notes: event.notes || '記録を確認'}}, upsert: true}});
    }
    await db.collection('treatments').bulkWrite(treatments);
    const foods = [{ _id: new ObjectId('000000000000000000000020'), type: 'food', name: 'ごはん（確認用）', category: '主食', subcategory: '米飯', unit: 'g', portion: 150, carbs: 55, protein: 3.8, fat: 0.5, energy: 975, gi: 2 }, { _id: new ObjectId('000000000000000000000021'), type: 'food', name: '食パン（確認用）', category: '主食', subcategory: 'パン', unit: 'g', portion: 60, carbs: 28, protein: 5, fat: 2.5, energy: 650, gi: 2 }, {_id: new ObjectId('000000000000000000000022'), type: 'quickpick', name: '朝食（確認用）', foods: [{id: '000000000000000000000021', portion: 2}], carbs: 56, hideafteruse: false, hidden: false, position: 0}];
    foods[2].foods = [{...foods[1], portions: 2}];
    for (const food of foods) await db.collection('food').replaceOne({ _id: food._id }, food, { upsert: true });
    await db.collection('devicestatus').updateOne({ device: '確認用端末' }, { $set: { device: '確認用端末', created_at: new Date(now).toISOString(), uploader: { battery: 82 }, pump: { battery: { percent: 76 }, reservoir: 120, clock: new Date(now).toISOString() } } }, { upsert: true });
    const summary = { generatedAt: new Date().toISOString(), synthetic: true, database: 'kettou_demo', timezone: 'Asia/Tokyo', from: new Date(start).toISOString(), to: new Date(now).toISOString(), entries: await db.collection('entries').countDocuments(), sgv: await db.collection('entries').countDocuments({device: 'kettou-demo', type: 'sgv'}), treatments: await db.collection('treatments').countDocuments(), profiles: await db.collection('profile').countDocuments(), food: await db.collection('food').countDocuments() };
    fs.mkdirSync('docs/verification', { recursive: true });
    fs.writeFileSync('docs/verification/demo-data.json', JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));
  } finally { await client.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
