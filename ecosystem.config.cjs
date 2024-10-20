module.exports = {
  apps: [
    {
      name: "crypto-grace-bot",
      script: "./app.js",
      watch: true,
      env: {
        NODE_ENV: "development",
      },
      env_development: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
