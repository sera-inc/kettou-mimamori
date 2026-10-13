'use strict';

module.exports = function createAlarmAudio (onFailure, onRecovery) {
  var failureReported = false;
  function failed (error) {
    if (!failureReported) {
      failureReported = true;
      onFailure(error);
    }
    return false;
  }
  function played () {
    if (failureReported && onRecovery) onRecovery();
    failureReported = false;
    return true;
  }
  return {
    play: function play (audio) {
      try {
        return Promise.resolve(audio.play()).then(played, failed);
      } catch (error) {
        return Promise.resolve(failed(error));
      }
    }
  };
};
