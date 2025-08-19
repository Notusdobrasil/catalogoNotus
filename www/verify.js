// verify.js
import { auth } from "./firebase-config.js";
import { applyActionCode } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Ajuste se usar outra URL do backend:
const BACKEND_URL = "https://us-central1-notusauth.cloudfunctions.net/api";

const params  = new URLSearchParams(window.location.search);
const mode    = params.get("mode");     // deve ser "verifyEmail"
const oobCode = params.get("oobCode");
const uid     = params.get("uid");

const $ = (sel) => document.querySelector(sel);
const show = (idToShow) => {
  ["#status-area","#success-area","#error-area"].forEach(id => $(id).classList.add("hide"));
  $(idToShow).classList.remove("hide");
};

async function run() {
  try {
    if (mode !== "verifyEmail" || !oobCode || !uid) {
      throw new Error("Link inválido ou incompleto.");
    }

    // 1) Confirma o e‑mail no Firebase
    await applyActionCode(auth, oobCode);

    // 2) Informa o backend para marcar verificado e disparar a análise
    const resp = await fetch(`${BACKEND_URL}/markEmailVerified`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid })
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Falha ao confirmar análise (${resp.status}): ${t}`);
    }

    // 3) OK → mostra sucesso e link de login
    show("#success-area");
  } catch (err) {
    console.error(err);
    $("#err-text").textContent = err.message || "Falha ao verificar o e‑mail.";
    show("#error-area");
  }
}

// dispara ao carregar
run();
