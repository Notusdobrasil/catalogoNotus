// mailer.js
const nodemailer = require("nodemailer");

// Em produção, garanta que process.env.* existam (dotenv no index/server se precisar)
const { MAILRELAY_HOST, MAILRELAY_PORT, MAILRELAY_USER, MAILRELAY_PASS, ALLOWED_ORIGINS } = process.env;

// MailRelay geralmente usa porta 587 com STARTTLS (secure: false)
const transporter = nodemailer.createTransport({
  host: MAILRELAY_HOST,
  port: Number(MAILRELAY_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: MAILRELAY_USER,
    pass: MAILRELAY_PASS,
  },
  tls: {
    // aceita certificados válidos; evite rejectUnauthorized: false em produção
    ciphers: "TLSv1.2",
  },
  // timeouts e retry simples
  socketTimeout: 20_000,
  greetingTimeout: 10_000,
  connectionTimeout: 10_000,
});

async function sendMail({ to, subject, html, text, from }) {
  const fromAddress = from || 'Notus do Brasil <no-reply@notus.ind.br>';
  const message = {
    from: fromAddress,
    to,                         // "nome <email@dominio>" ou lista
    subject,
    text: text || "Veja este e-mail em HTML.",
    html,
  };
  const info = await transporter.sendMail(message);
  return info; // contém messageId, accepted, rejected etc.
}

module.exports = { transporter, sendMail };
