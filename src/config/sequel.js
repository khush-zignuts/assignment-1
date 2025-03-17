const sequelize = require("./db");
const User = require("./db");

const syncDatabase = async () => {
    try {
      await sequelize.sync({ force: false, alter: true });
      console.log("Database synced successfully!");
    } catch(error) {
      console.error("Database sync error:", error);
    }
  };

  module.exports = { User, syncDatabase };