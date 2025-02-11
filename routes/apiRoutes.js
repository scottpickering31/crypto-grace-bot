const axios = require("axios");

const baseURL = process.env.API_BASE_URL;

const apiRoutes = async (route) => {
  const url = `${baseURL}/api/${route}`;
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
