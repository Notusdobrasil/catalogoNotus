// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// ================== Secrets ==================
// MailRelay
const MAILRELAY_HOST = defineSecret("MAILRELAY_HOST");
const MAILRELAY_PORT = defineSecret("MAILRELAY_PORT");
const MAILRELAY_USER = defineSecret("MAILRELAY_USER");
const MAILRELAY_PASS = defineSecret("MAILRELAY_PASS");

// Allowed origins (CORS)
const ALLOWED_ORIGINS = defineSecret("ALLOWED_ORIGINS");

// ================== Express app ==================
const app = require("./server"); // 👈 agora puxa do server.js

// ================== .env local ==================
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").join(__dirname, ".env") });
}

// ================== Export Function ==================
exports.api = onRequest(
  {
    region: "us-central1", // pode trocar para "southamerica-east1" (São Paulo)
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [
      MAILRELAY_HOST,
      MAILRELAY_PORT,
      MAILRELAY_USER,
      MAILRELAY_PASS,
      ALLOWED_ORIGINS,
    ],
  },
  app
);
