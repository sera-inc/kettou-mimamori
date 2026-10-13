'use strict';

const assert = require('node:assert/strict');
const request = require('supertest');
const endpoints = require('../lib/authorization/endpoints');

describe('Subject notes in the authenticated admin listing', function () {
  function app(subjects) {
    return endpoints({settings: {}}, {
      storage: {subjects},
      isPermitted(permission) {
        assert.equal(permission.startsWith('admin:api:'), true);
        return (req, res, next) => req.get('x-test-admin') === 'yes' ? next() : res.sendStatus(403);
      }
    });
  }

  it('returns saved Japanese notes without exposing internal storage fields', async function () {
    const subject = Object.freeze({_id: 'sample-id', name: '確認利用者', roles: ['readable'],
      accessToken: 'test-only-access', notes: '担当者への連絡事項', internalSecret: 'must-not-return'});
    const response = await request(app([subject])).get('/subjects').set('x-test-admin', 'yes').expect(200);
    assert.deepEqual(response.body, [{_id: subject._id, name: subject.name, roles: subject.roles,
      accessToken: subject.accessToken, notes: subject.notes}]);
    assert.equal(subject.internalSecret, 'must-not-return');
  });

  it('preserves subjects that have no notes', async function () {
    const subject = {_id: 'older-subject', name: '既存利用者', roles: ['readable']};
    const response = await request(app([subject])).get('/subjects').set('x-test-admin', 'yes').expect(200);
    assert.deepEqual(response.body, [subject]);
  });

  it('requires the existing admin permission before returning notes or tokens', async function () {
    const response = await request(app([{name: '確認', notes: '非公開', accessToken: 'test-only'}])).get('/subjects').expect(403);
    assert.equal(response.text.includes('非公開'), false);
    assert.equal(response.text.includes('test-only'), false);
  });
});
