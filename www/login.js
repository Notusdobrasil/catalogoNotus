// login.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  applyActionCode,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// URL do backend (Functions)
const BACKEND_URL = "https://us-central1-notusauth.cloudfunctions.net/api";

const overlay    = document.getElementById("loadingOverlay");
const container  = document.getElementById("loginContainer");
const leftPanel  = document.querySelector(".panel-left");
const rightPanel = document.querySelector(".panel-right");

const params  = new URLSearchParams(window.location.search);
const oobCode = params.get("oobCode");
const uid     = params.get("uid");

function alert(mensagem) {
  const box = document.getElementById("customAlert");
  const text = document.getElementById("alertText");

  text.textContent = mensagem;
  box.classList.remove("hidden");
  void box.offsetWidth;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
    setTimeout(() => box.classList.add("hidden"), 400);
  }, 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  if (oobCode && uid) {
    // ✅ Passo 4.2 — envia CNPJ para o marketing após verificação de e-mail
    applyActionCode(auth, oobCode)
      .then(() => fetch(`${BACKEND_URL}/sendCnpjDataEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid })
      }))
      .then(() => alert("E-mail verificado! Seu cadastro está em análise."))
      .catch(e => alert("Falha na verificação: " + e.message))
      .finally(initUI);
  } else {
    onAuthStateChanged(auth, user => {
      if (user && user.emailVerified) {
        getDoc(doc(db, "users", user.uid)).then(snap => {
          if (!snap.data()?.approved) {
            alert("Seu cadastro está em análise. Aguarde aprovação.");
            return signOut(auth).then(initUI);
          }
          window.location.href = "configuracoes.html";
        });
      } else {
        initUI();
      }
    });
  }
});

function initUI() {
  overlay.style.display   = "none";
  container.style.display = "flex";
  showLoginForm();
}

function showLoginForm() {
  rightPanel.innerHTML = `
    <h2>Entrar</h2>
    <p style="color: #999; font-size: 0.9rem; margin-bottom: 10px;">Use seu e-mail e senha para acessar:</p>
    <input id="loginEmail" type="email" placeholder="Email" />
    <input id="loginSenha" type="password" placeholder="Senha" />
    <button id="btn-login">Entrar</button>
    <p class="forgot-password" style="margin-top: 12px; color: #134596; font-size: 0.9rem; cursor: pointer; font-weight: 600;">Esqueci minha senha</p>
    <a href="index.html" style="margin-top: 12px; color: #134596; font-size: 0.9rem; cursor: pointer; text-decoration: none; font-weight: 600;">Entrar sem Login</a>
  `;
  leftPanel.querySelector("h2").textContent = "Bem-vindo!";
  leftPanel.querySelector("p").textContent  = "Se você ainda não possui uma conta, cadastre-se agora mesmo.";
  leftPanel.querySelector("button").textContent = "Cadastrar-se";
  leftPanel.querySelector("button").onclick     = showSignupForm;

  document.getElementById("btn-login").onclick = handleLogin;
  document.querySelector(".forgot-password").onclick = handleForgotPassword;
}

function showSignupForm() {
  rightPanel.innerHTML = `
    <h2>Cadastre-se</h2>
    <p style="color: #999; font-size: 0.9rem; margin-bottom: 10px;">Use o seu CNPJ para solicitar:</p>
    <input id="inputNome" placeholder="Nome" />
    <input id="inputCnpj" placeholder="CNPJ (só dígitos)" maxlength="14" />
    <input id="inputNumero" placeholder="Número" />
    <input id="inputEmail" type="email" placeholder="Email" />
    <input id="inputSenha" type="password" placeholder="Senha" />

    <div style="margin-bottom: 10px;">
      <label style="display: flex; align-items: center; font-size: 0.9rem; color: #666;">
        <input type="checkbox" id="checkboxClienteNotus" style="margin-right: 8px;" />
        Já sou cliente Notus
      </label>
    </div>

    <div id="selectRepresentanteContainer" style="display: none; margin-bottom: 10px;">
      <select id="selectRepresentante" style="width: 100%; max-width: 300px; padding: 12px; border-radius: 7px; border: 1.5px solid #b0b0b0;">
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
  leftPanel.querySelector("p").textContent = "Para acessar, por favor faça login com suas informações pessoais";
  leftPanel.querySelector("button").textContent = "Entrar";
  leftPanel.querySelector("button").onclick = showLoginForm;

  document.getElementById("btn-solicitar").onclick = handleSignup;

  const checkboxClienteNotus = document.getElementById("checkboxClienteNotus");
  if (checkboxClienteNotus) {
    checkboxClienteNotus.addEventListener("change", function () {
      const container = document.getElementById("selectRepresentanteContainer");
      container.style.display = this.checked ? "block" : "none";
    });
  }
}

async function handleSignup() {
  const nome   = document.getElementById("inputNome").value.trim();
  const cnpj   = document.getElementById("inputCnpj").value.replace(/\D/g,"");
  const numero = document.getElementById("inputNumero").value.trim();
  const email  = document.getElementById("inputEmail").value.trim();
  const senha  = document.getElementById("inputSenha").value;
  const clienteAntigo = document.getElementById("checkboxClienteNotus")?.checked || false;
  const representante = document.getElementById("selectRepresentante")?.value || "";

  if (![nome,cnpj,numero,email,senha].every(v=>v)) {
    return alert("Preencha todos os campos");
  }
  if (cnpj.length !== 14) return alert("CNPJ inválido");

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, "users", user.uid), {
      nome, cnpj, numero, email,
      clienteAntigo,
      representante,
      approved: false,
      reviewRequested: false,
      createdAt: serverTimestamp()
    });

    // ✅ Passo 4.1 — envia e-mail de verificação via MailRelay
    await fetch(`${BACKEND_URL}/sendInitialVerification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email })
    });

    alert("E-mail de verificação enviado! Confira sua caixa de entrada.");
    showLoginForm();
  } catch (e) {
    console.error("Erro no cadastro:", e);
    alert("Falha no cadastro: " + e.message);
  }
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  if (!email || !senha) return alert("Informe e-mail e senha");
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, senha);
    if (!user.emailVerified) {
      alert("Por favor, verifique seu e-mail antes de fazer o login.");
      return signOut(auth);
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists() || !snap.data().approved) {
      alert("Seu cadastro ainda está em análise ou não foi aprovado.");
      return signOut(auth);
    }
    window.location.href = "index.html";
  } catch (e) {
    alert("Falha no login: " + e.message);
  }
}

function handleForgotPassword() {
  const email = prompt("Digite seu e-mail para reset de senha:");
  if (!email) return;
  sendPasswordResetEmail(auth, email.trim())
    .then(()=>alert("Link de recuperação enviado!"))
    .catch(e=>alert("Erro: "+e.message));
}
