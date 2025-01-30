const currentDate = () => {
  const date = new Date();
  date.setHours(date.getHours());
  const currentDateTime = date.toISOString().slice(0, 19).replace("T", " ");

  return currentDateTime;
};

module.exports = { currentDate };
