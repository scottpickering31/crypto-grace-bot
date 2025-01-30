const axios = require("axios");

const apiRoutes = async (route) => {
  const url = `http://212.227.125.88/api/${route}`;
  try {
    await axios.post(url);
    console.log(`Successfully called route: ${url}`);
  } catch (error) {
    console.error(`Error calling route: ${url}`);
    if (error.response) {
      console.error("Response error:", error.response.data);
    } else {
      console.error("Error details:", error.message);
    }
  }
};

module.exports = { apiRoutes };
