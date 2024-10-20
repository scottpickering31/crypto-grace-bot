let intervalId = null;

const setIntervalId = (id) => {
  intervalId = id;
};

const clearExistingInterval = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const getIntervalId = () => {
  return intervalId;
};

module.exports = {
  setIntervalId,
  clearExistingInterval,
  getIntervalId,
};
