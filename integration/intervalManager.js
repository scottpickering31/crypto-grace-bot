let intervalId = null;

export const setIntervalId = (id) => {
  intervalId = id;
};

export const clearExistingInterval = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export const getIntervalId = () => {
  return intervalId;
};
