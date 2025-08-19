// login.js (substitua tudo por este conteúdo)
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  applyActionCode,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 🔗 Ajuste aqui a URL do seu backend:
const BACKEND_URL = "https://us-central1-notusauth.cloudfunctions.net/api";

// -------- util --------
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[login] elemento #${id} não encontrado`);
  return el;
}
function showAlert(msg) {
  try {
    const box = getEl("customAlert");
    const text = getEl("alertText");
    if (!box || !text) return alert(msg);
    text.textContent = msg;
    box.classList.remove("hidden");
    void box.offsetWidth;
    box.classList.add("show");
    setTimeout(() => {
      box.classList.remove("show");
      setTimeout(() => box.classList.add("hidden"), 400);
    }, 2500);
  } catch {
    alert(msg);
  }
}
function hideOverlay() {
  const overlay = getEl("loadingOverlay");
  const container = getEl("loginContainer");
  if (overlay) overlay.style.display = "none";
  if (container) container.style.display = "flex";
}

// -------- estado/refs --------
const overlay    = getEl("loadingOverlay");
const container  = getEl("loginContainer");
const leftPanel  = document.querySelector(".panel-left");
const rightPanel = document.querySelector(".panel-right");

const params  = new URLSearchParams(window.location.search);
const oobCode = params.get("oobCode");
const uid     = params.get("uid");

// Failsafe: se nada acontecer em 5s, esconde overlay para você ver a UI/erros
const overlayFailsafe = setTimeout(() => {
  console.warn("[login] failsafe: escondendo overlay após 5s");
  hideOverlay();
}, 5000);

// Se qualquer erro uncaught acontecer, esconde overlay para não ficar preso
window.addEventListener("error", () => hideOverlay());
window.addEventListener("unhandledrejection", () => hideOverlay());

// -------- boot --------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("[login] DOM pronto. Iniciando…");

    if (!overlay || !container || !leftPanel || !rightPanel) {
      console.warn("[login] Estrutura do HTML incompleta.");
    }

    if (oobCode && uid) {
      console.log("[login] Link de verificação detectado. Aplicando action code…");
      try {
        await applyActionCode(auth, oobCode);
        // após verificar e-mail → dispara e-mail “cadastro em análise”
        await fetch(`${BACKEND_URL}/sendCnpjDataEmail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        showAlert("E-mail verificado! Seu cadastro está em análise.");
      } catch (e) {
        console.error("[login] Falha no applyActionCode:", e);
        showAlert("Falha na verificação: " + (e?.message || e));
      } finally {
        initUI();
      }
      return;
    }

    // fluxo normal: observar auth
    onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          console.log("[login] Sem usuário logado → mostrar login");
          initUI();
          return;
        }
        if (!user.emailVerified) {
          console.log("[login] Usuário sem e-mail verificado");
          showAlert("Verifique seu e-mail antes de fazer login.");
          await signOut(auth);
          initUI();
          return;
        }
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists() || !snap.data()?.approved) {
          console.log("[login] Usuário pendente de aprovação");
          showAlert("Seu cadastro está em análise. Aguarde aprovação.");
          await signOut(auth);
          initUI();
          return;
        }
        // aprovado → entra
        window.location.href = "index.html";
      } catch (e) {
        console.error("[login] Erro no onAuthStateChanged:", e);
        initUI();
      }
    });
  } catch (e) {
    console.error("[login] Erro durante bootstrap:", e);
    initUI(); // não deixa o overlay travado
  }
});

function initUI() {
  clearTimeout(overlayFailsafe);
  hideOverlay();
  showLoginForm();
}

// -------- UI --------
function showLoginForm() {
  if (!rightPanel || !leftPanel) return;
  rightPanel.innerHTML = `
    <h2>Entrar</h2>
    <p style="color:#999;font-size:.9rem;margin-bottom:10px;">Use seu e-mail e senha para acessar:</p>
    <input id="loginEmail" type="email" placeholder="Email" />
    <input id="loginSenha" type="password" placeholder="Senha" />
    <button id="btn-login">Entrar</button>
    <p class="forgot-password" style="margin-top:12px;color:#134596;font-size:.9rem;cursor:pointer;font-weight:600;">Esqueci minha senha</p>
    <a href="index.html" style="margin-top:12px;color:#134596;font-size:.9rem;cursor:pointer;text-decoration:none;font-weight:600;">Entrar sem Login</a>
  `;
  leftPanel.querySelector("h2").textContent = "Bem-vindo!";
  leftPanel.querySelector("p").textContent  = "Se você ainda não possui uma conta, cadastre-se agora mesmo.";
  const btn = leftPanel.querySelector("button");
  if (btn) {
    btn.textContent = "Cadastrar-se";
    btn.onclick = showSignupForm;
  }

  const bLogin = document.getElementById("btn-login");
  if (bLogin) bLogin.onclick = handleLogin;
  const fp = document.querySelector(".forgot-password");
  if (fp) fp.onclick = handleForgotPassword;
}

function showSignupForm() {
  if (!rightPanel || !leftPanel) return;
  rightPanel.innerHTML = `
    <h2>Cadastre-se</h2>
    <p style="color:#999;font-size:.9rem;margin-bottom:10px;">Use o seu CNPJ para solicitar:</p>
    <input id="inputNome" placeholder="Nome" />
    <input id="inputCnpj" placeholder="CNPJ (só dígitos)" maxlength="14" />
    <input id="inputNumero" placeholder="Número" />
    <input id="inputEmail" type="email" placeholder="Email" />
    <input id="inputSenha" type="password" placeholder="Senha" />

    <div style="margin-bottom:10px;">
      <label style="display:flex;align-items:center;font-size:.9rem;color:#666;">
        <input type="checkbox" id="checkboxClienteNotus" style="margin-right:8px;" />
        Já sou cliente Notus
      </label>
    </div>

    <div id="selectRepresentanteContainer" style="display:none;margin-bottom:10px;">
      <select id="selectRepresentante" style="width:100%;max-width:300px;padding:12px;border-radius:7px;border:1.5px solid #b0b0b0;">
        <option value="">Selecione seu representante</option>
        <option value="Carlos">Carlos</option>
        <option value="Fernanda">Fernanda</option>
        <option value="João">João</option>
        <option value="Outro">Outro</option>
      </select>
    </div>

    <button id="btn-solicitar">Enviar</button>
  `;

  leftPanel.querySelector("h2").textContent = "Bem-vindo de volta!";
  leftPanel.querySelector("p").textContent  = "Para acessar, por favor faça login com suas informações pessoais";
  const btn = leftPanel.querySelector("button");
  if (btn) {
    btn.textContent = "Entrar";
    btn.onclick = showLoginForm;
  }

  const checkboxClienteNotus = document.getElementById("checkboxClienteNotus");
  if (checkboxClienteNotus) {
    checkboxClienteNotus.addEventListener("change", function () {
      const cont = document.getElementById("selectRepresentanteContainer");
      if (cont) cont.style.display = this.checked ? "block" : "none";
    });
  }

  const bSolicitar = document.getElementById("btn-solicitar");
  if (bSolicitar) bSolicitar.onclick = handleSignup;
}

// -------- handlers --------
async function handleSignup() {
  const nome   = document.getElementById("inputNome")?.value?.trim();
  const cnpj   = document.getElementById("inputCnpj")?.value?.replace(/\D/g,"");
  const numero = document.getElementById("inputNumero")?.value?.trim();
  const email  = document.getElementById("inputEmail")?.value?.trim();
  const senha  = document.getElementById("inputSenha")?.value;

  const clienteAntigo = document.getElementById("checkboxClienteNotus")?.checked || false;
  const representante = document.getElementById("selectRepresentante")?.value || "";

  if (![nome, cnpj, numero, email, senha].every(Boolean)) {
    return showAlert("Preencha todos os campos");
  }
  if (cnpj.length !== 14) return showAlert("CNPJ inválido");

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, "users", user.uid), {
      nome, cnpj, numero, email,
      clienteAntigo, representante,
      approved: false,
      reviewRequested: false,
      createdAt: serverTimestamp(),
    });

    // valida CNPJ no backend (opcional aqui se já validou antes)
    try {
      await fetch(`${BACKEND_URL}/validateCnpj`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj }),
      });
    } catch (e) {
      console.warn("[login] Falha ao validar CNPJ no backend (prosseguindo):", e);
    }

    // dispara e-mail de verificação
    await fetch(`${BACKEND_URL}/sendInitialVerification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email }),
    });

    showAlert("E-mail de verificação enviado! Confira sua caixa de entrada.");
    showLoginForm();
  } catch (e) {
    console.error("[login] Erro no cadastro:", e);
    showAlert("Falha no cadastro: " + (e?.message || e));
  }
}

async function handleLogin() {
  const email = document.getElementById("loginEmail")?.value?.trim();
  const senha = document.getElementById("loginSenha")?.value;
  if (!email || !senha) return showAlert("Informe e-mail e senha");
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, senha);
    if (!user.emailVerified) {
      showAlert("Por favor, verifique seu e-mail antes de fazer o login.");
      return signOut(auth);
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists() || !snap.data()?.approved) {
      showAlert("Seu cadastro ainda está em análise ou não foi aprovado.");
      return signOut(auth);
    }
    window.location.href = "index.html";
  } catch (e) {
    showAlert("Falha no login: " + (e?.message || e));
  }
}

function handleForgotPassword() {
  const email = prompt("Digite seu e-mail para reset de senha:");
  if (!email) return;
  sendPasswordResetEmail(auth, email.trim())
    .then(() => showAlert("Link de recuperação enviado!"))
    .catch((e) => showAlert("Erro: " + (e?.message || e)));
}
