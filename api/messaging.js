require('dotenv').config();
const FirebaseMessaging = require('./FirebaseMessaging');
const serviceAccount = require("./service-account.json");
const messaging = new FirebaseMessaging({
  ...serviceAccount,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
});

module.exports = messaging;