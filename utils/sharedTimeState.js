let botStartTime = null;
let isBotRunning = false;

const setBotStartTime = (time) => {
  botStartTime = time;
};

const getBotStartTime = () => botStartTime;

const setIsBotRunning = (status) => {
  isBotRunning = status;
};

const getIsBotRunning = () => isBotRunning;

module.exports = {
  setBotStartTime,
  getBotStartTime,
  setIsBotRunning,
  getIsBotRunning,
};
