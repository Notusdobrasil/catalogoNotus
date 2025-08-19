// functions/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// ================== CORS dinâmico ==================
const parseList = (s) => (s || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const defaultAllowed = [
  "https://notus.ind.br",
  "https://www.notus.ind.br",
  "http://127.0.0.1:5502",
  "http://localhost:5502",
];

// Pode vir como ALLOWED_ORIGENS ou ALLOWED_ORIGINS (corrigindo grafia)
const allowedOrigins = parseList(process.env.ALLOWED_ORIGENS || process.env.ALLOWED_ORIGINS);
const ALLOW_SET = new Set(allowedOrigins.length ? allowedOrigins : defaultAllowed);

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header("Origin");
  const isAllowed = !origin || ALLOW_SET.has(origin); // sem Origin (curl/app) = libera
  callback(null, {
    origin: isAllowed,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 86400,
  });
};

// ================== App / Admin ==================
const app = express();
app.use(express.json());
app.use(cors(corsOptionsDelegate));
app.options("*", cors(corsOptionsDelegate));

// Admin SDK com credencial padrão da Function (NÃO use serviceAccountKey.json)
if (!admin.apps.length) {
  admin.initializeApp();
  console.log("✅ Firebase Admin inicializado (credencial padrão)");
}

// ================== Variáveis de ambiente ==================
const BASE_URL =
  (process.env.BASE_URL || "").replace(/\/$/, "") ||
  "https://notus.ind.br/catalogo-notus-teste-lancamento-desenvolvedor";

const FUNCTION_BASE =
  (process.env.FUNCTION_BASE || "").replace(/\/$/, "") ||
  "https://us-central1-notusauth.cloudfunctions.net/api";

// ================== MailRelay (Nodemailer) ==================
const transporter = nodemailer.createTransport({
  host: process.env.MAILRELAY_HOST,
  port: Number(process.env.MAILRELAY_PORT || 587),
  secure: false, // STARTTLS (587)
  auth: {
    user: process.env.MAILRELAY_USER,
    pass: process.env.MAILRELAY_PASS,
  },
  tls: { ciphers: "TLSv1.2" },
  socketTimeout: 20000,
  greetingTimeout: 10000,
  connectionTimeout: 10000,
});

async function sendHtmlMail({ to, subject, html, replyTo }) {
  return transporter.sendMail({
    from: '"Notus do Brasil" <marketing@notus.ind.br>',
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

// ================== Rotas ==================
app.get("/teste", (_req, res) => res.send("OK, Functions viva."));

// (2) Validar CNPJ
app.post("/validateCnpj", async (req, res) => {
  try {
    const { cnpj } = req.body;
    if (!cnpj) return res.status(400).json({ error: "CNPJ obrigatório" });

    const resp = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    const data = await resp.json();

    if (data.status === "ERROR") {
      return res.json({ exists: false, message: data.message || "CNPJ não encontrado" });
    }
    // (opcional) exigir situacao === "ATIVA"
    res.json({ exists: true, data });
  } catch (e) {
    console.error("validateCnpj:", e);
    res.status(500).json({ error: "Falha ao validar CNPJ" });
  }
});

// (3) Enviar link de verificação de e-mail
app.post("/sendInitialVerification", async (req, res) => {
  try {
    const { uid, email } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "uid e email obrigatórios" });
    }

    const actionCodeSettings = {
      url: `${BASE_URL}/login.html`,
      handleCodeInApp: false,
    };

    const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    const u = new URL(link);
    const oobCode = u.searchParams.get("oobCode");
    const mode = u.searchParams.get("mode");

    // Se quiser usar verify.html, troque login.html por verify.html
    const customLink = `${BASE_URL}/login.html?mode=${mode}&oobCode=${oobCode}&uid=${uid}`;

    await sendHtmlMail({
      to: email,
      subject: "Verifique seu e-mail – Notus do Brasil",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>Estamos quase lá! Clique para verificar:</p>
          <p>
            <a href="${customLink}" style="padding:10px 16px;background:#134596;color:#fff;border-radius:4px;text-decoration:none;">
              Verificar e-mail
            </a>
          </p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (e) {
    console.error("sendInitialVerification:", e);
    res.status(500).json({ error: "Falha ao enviar e-mail de verificação" });
  }
});

// (5) Marcar e-mail verificado e acionar análise (fire-and-forget)
app.post("/markEmailVerified", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "UID obrigatório" });

    const userRef = admin.firestore().doc(`users/${uid}`);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Usuário não encontrado" });

    // 1) marca como verificado no Firestore
    await userRef.update({ emailVerified: true });

    // 2) dispara o e-mail de análise em background
    fetch(`${FUNCTION_BASE}/sendCnpjDataEmail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.text().catch(() => "");
          console.error("[markEmailVerified] sendCnpjDataEmail falhou:", r.status, body);
        }
      })
      .catch((e) => {
        console.error("[markEmailVerified] erro ao chamar sendCnpjDataEmail:", e);
      });

    res.json({ success: true });
  } catch (e) {
    console.error("markEmailVerified:", e);
    res.status(500).json({ error: "Falha ao marcar e enviar análise" });
  }
});

// (6) E-mail de análise ao admin + e-mail “em análise” ao usuário
app.post("/sendCnpjDataEmail", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "uid obrigatório" });

    const userRef = admin.firestore().doc(`users/${uid}`);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Usuário não encontrado" });

    const { nome, cnpj, numero, email, clienteAntigo, representante } = snap.data();

    const r = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    const dataCnpj = await r.json();
    await userRef.update({ receitaWS: dataCnpj });

    const approveLink = `${FUNCTION_BASE}/approveUser?uid=${uid}`;
    const rejectLink = `${FUNCTION_BASE}/rejectUser?uid=${uid}`;

    const htmlBody = `
      <div style="font-family: Arial; background:#f4f4f4; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; padding:40px; border-radius:10px;">
          <img src="https://notus.ind.br/wp-content/uploads/2024/05/logo-notus-azul-1536x306.png" style="max-width:200px; display:block; margin:0 auto 30px;" />
          <h2 style="color:#134596;">Nova solicitação de cadastro</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>CNPJ:</strong> ${cnpj}</p>
          <p><strong>Telefone:</strong> ${numero}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Já é cliente Notus?</strong> ${clienteAntigo ? "Sim" : "Não"}</p>
          ${clienteAntigo ? `<p><strong>Representante:</strong> ${representante || "Não informado"}</p>` : ""}
          <hr style="margin: 30px 0;">
          <h3 style="color:#134596;">Dados do CNPJ</h3>
          <p><strong>Razão Social:</strong> ${dataCnpj.nome}</p>
          <p><strong>Nome Fantasia:</strong> ${dataCnpj.fantasia || "---"}</p>
          <p><strong>Tipo:</strong> ${dataCnpj.tipo}</p>
          <p><strong>Situação Cadastral:</strong> ${dataCnpj.situacao}</p>
          <p><strong>Motivo Situação:</strong> ${dataCnpj.motivo_situacao || "---"}</p>
          <p><strong>Abertura:</strong> ${dataCnpj.abertura}</p>
          <p><strong>Capital Social:</strong> R$ ${dataCnpj.capital_social || "0,00"}</p>
          <p><strong>Natureza Jurídica:</strong> ${dataCnpj.natureza_juridica}</p>
          <hr style="margin: 20px 0;">
          <h4 style="color:#134596;">Endereço</h4>
          <p><strong>Logradouro:</strong> ${dataCnpj.logradouro}, ${dataCnpj.numero || "---"}</p>
          <p><strong>Bairro:</strong> ${dataCnpj.bairro}</p>
          <p><strong>Município:</strong> ${dataCnpj.municipio}</p>
          <p><strong>UF:</strong> ${dataCnpj.uf}</p>
          <p><strong>CEP:</strong> ${dataCnpj.cep}</p>
          <hr style="margin: 20px 0;">
          <h4 style="color:#134596;">Contato</h4>
          <p><strong>Telefone:</strong> ${dataCnpj.telefone || "---"}</p>
          <p><strong>Email:</strong> ${dataCnpj.email || "---"}</p>
          <hr style="margin: 20px 0;">
          <h4 style="color:#134596;">CNAE Principal</h4>
          <p><strong>${dataCnpj.atividade_principal?.[0]?.code || "-"}</strong> – ${dataCnpj.atividade_principal?.[0]?.text || "-"}</p>
          <h4 style="color:#134596;">Atividades Secundárias</h4>
          ${(dataCnpj.atividades_secundarias || []).map(a => `<p><strong>${a.code}</strong> – ${a.text}</p>`).join("")}
          <hr style="margin: 20px 0;">
          <h4 style="color:#134596;">Quadro Societário (QSA)</h4>
          ${(dataCnpj.qsa || []).map(q => `<p><strong>${q.nome}</strong> – ${q.qual}</p>`).join("")}
          <hr style="margin: 30px 0;">
          <div style="display:flex; gap:20px; justify-content:center;">
            <a href="${approveLink}" style="background:#28a745; color:white; padding:12px 24px; border-radius:6px; text-decoration:none;">Aprovar</a>
            <a href="${rejectLink}" style="background:#dc3545; color:white; padding:12px 24px; border-radius:6px; text-decoration:none;">Reprovar</a>
          </div>
          <p style="font-size:12px; color:#aaa; text-align:center; margin-top:30px;">Notus Sistemas Térmicos do Brasil</p>
        </div>
      </div>
    `;

    // Admin
    await sendHtmlMail({
      to: "marketing@notus.ind.br",
      subject: "Solicitação de cadastro em análise",
      html: htmlBody,
      replyTo: email,
    });

    // Usuário
    await sendHtmlMail({
      to: email,
      subject: "Cadastro em análise",
      html: `<div style="font-family:Arial; padding:20px;">
               <p>Olá ${nome},</p>
               <p>Recebemos sua solicitação e ela está <strong>em análise</strong>. Em breve você receberá uma resposta por e-mail.</p>
             </div>`
    });

    await userRef.update({ reviewRequested: true });
    res.json({ success: true });
  } catch (e) {
    console.error("sendCnpjDataEmail:", e);
    res.status(500).json({ error: "Falha ao notificar marketing/usuário" });
  }
});

// (7) Aprovar usuário
app.get("/approveUser", async (req, res) => {
  try {
    const uid = req.query.uid;
    if (!uid) return res.status(400).send("uid obrigatório");

    const userRef = admin.firestore().doc(`users/${uid}`);
    await userRef.update({ approved: true });
    const snap = await userRef.get();
    const userEmail = snap.data().email;

    await sendHtmlMail({
      to: userEmail,
      subject: "Seu cadastro foi aprovado!",
      html: `
        <div style="font-family:Arial; padding:20px; background:#f4f4f4;">
          <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:10px;">
            <img src="https://notus.ind.br/wp-content/uploads/2024/05/logo-notus-azul-1536x306.png" style="max-width:200px; display:block; margin:0 auto 30px;" />
            <h2 style="color:#134596; text-align:center;">Parabéns!</h2>
            <p style="text-align:center;">Seu cadastro foi <strong>aprovado</strong>. Você já pode fazer login no catálogo.</p>
            <p style="text-align:center; margin-top:20px;">
              <a href="${BASE_URL}/login.html" style="background:#134596; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;">Acessar o Login</a>
            </p>
          </div>
        </div>
      `,
    });

    res.send("<h1>Usuário aprovado com sucesso!</h1><p>Você pode fechar esta aba.</p>");
  } catch (e) {
    console.error("approveUser:", e);
    res.status(500).send("Falha ao aprovar usuário.");
  }
});

// (8) Reprovar usuário
app.get("/rejectUser", async (req, res) => {
  try {
    const uid = req.query.uid;
    if (!uid) return res.status(400).send("uid obrigatório");

    const userRef = admin.firestore().doc(`users/${uid}`);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).send("Usuário não encontrado");

    const userEmail = snap.data().email;

    await admin.auth().deleteUser(uid);
    await userRef.delete();

    await sendHtmlMail({
      to: userEmail,
      subject: "Seu cadastro foi reprovado",
      html: `
        <div style="font-family:Arial; padding:20px; background:#f4f4f4;">
          <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:10px;">
            <img src="https://notus.ind.br/wp-content/uploads/2024/05/logo-notus-azul-1536x306.png" style="max-width:200px; display:block; margin:0 auto 30px;" />
            <h2 style="color:#d9534f; text-align:center;">Olá</h2>
            <p style="text-align:center;">Infelizmente seu cadastro <strong>não foi aprovado</strong> no momento.</p>
            <p style="text-align:center;">Você pode refazer todo o processo de solicitação se desejar.</p>
          </div>
        </div>
      `,
    });

    res.send("<h1>Usuário reprovado e removido com sucesso!</h1><p>Você pode fechar esta aba.</p>");
  } catch (e) {
    console.error("rejectUser:", e);
    res.status(500).send("Falha ao reprovar usuário.");
  }
});

// ====== Exporta o app para o index.js (Functions) ======
module.exports = app;
