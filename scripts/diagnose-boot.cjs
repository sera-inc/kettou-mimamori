'use strict';
const Module = require('module');
const original = Module._load;
Module._load = function (name, parent, isMain) {
  try {
    const exported = original.call(this, name, parent, isMain);
    if (name === 'bootevent') return (...args) => {
      const chain = exported(...args);
      const acquire = chain.acquire;
      chain.acquire = callback => acquire.call(chain, (ctx, next) => {
        try { callback(ctx, next); }
        catch (error) { console.error('BOOT PHASE ERROR:', callback.name, error.stack); throw error; }
      });
      return chain;
    };
    return exported;
  }
  catch (error) { console.error('BOOT REQUIRE ERROR:', name, error.stack); throw error; }
};
process.on('unhandledRejection', error => console.error('BOOT REJECTION:', error));
setTimeout(() => process.exit(2), 60000);
