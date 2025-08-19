import { auth, db } from "../firebase-config.js";
import {
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // ✅ **ADICIONADO AQUI**
  // Coloque a URL do seu backend de produção aqui.
  const BACKEND_URL = "https://us-central1-notusauth.cloudfunctions.net/api";
  
  // ====== SELEÇÃO DE ELEMENTOS NO DOM ======
  const inputNome               = document.getElementById("inputNome");
  const inputEmail              = document.getElementById("inputEmail");
  const inputCnpj               = document.getElementById("inputCnpj");
  const inputNumero             = document.getElementById("inputNumero");
  const inputOldPassword        = document.getElementById("inputOldPassword");
  const inputNewPassword        = document.getElementById("inputNewPassword");
  const inputConfirmNewPassword = document.getElementById("inputConfirmNewPassword");
  const btnSaveAll              = document.getElementById("btnSaveAll");
  const msgFeedback             = document.getElementById("msgFeedback");
  const sidebarWelcome          = document.getElementById("sidebarWelcome");
  const sidebarLogout           = document.getElementById("sidebarLogout");
  const btnEditProfile          = document.getElementById("btnEditProfile");
  const avatarInitial           = document.getElementById("avatarInitial");
  const navConfiguracoes        = document.getElementById("navConfiguracoes");
  const navFiliais              = document.getElementById("navFiliais");
  const profileCard             = document.querySelector(".settings-card");
  const filiaisSection          = document.getElementById("filiaisSection");

  // elementos de Filiais
  const inputNovoCnpj    = document.getElementById("inputNovoCnpj");
  const inputFilialPhone = document.getElementById("inputFilialPhone");
  const inputFilialEmail = document.getElementById("inputFilialEmail");
  const btnAddCnpj       = document.getElementById("btnAddCnpj");
  const filiaisTableBody = document.querySelector("#filiaisTable tbody");
  const filialMsg        = document.getElementById("filialMsgFeedback");

  let currentUserUid   = null;
  let currentUserEmail = "";
  let isEditing        = false;

  const editableFields = [
    inputNome,
    inputNumero,
    inputOldPassword,
    inputNewPassword,
    inputConfirmNewPassword
  ];

  // ====== FUNÇÕES AUXILIARES ======

  function exibirMensagem(texto, tipo = "erro") {
    msgFeedback.style.color = tipo === "sucesso" ? "#28a745" : "#d9534f";
    msgFeedback.innerText   = texto;
    setTimeout(() => { msgFeedback.innerText = ""; }, 4000);
  }

  function setInitialPlaceholder() {
    const nomeCompleto = inputNome.value.trim();
    avatarInitial.textContent = nomeCompleto
      ? nomeCompleto.charAt(0).toUpperCase()
      : "U";
  }

  /**
   * Valida um CNPJ (formato e dígitos)
   * @param {string} cnpj — apenas dígitos
   * @returns {boolean}
   */
  function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    const calc = (t) => {
      let m = t === 12 ? 5 : 6,
          s = 0;
      for (let i = 0; i < t; i++) {
        s += +cnpj.charAt(i) * m--;
        if (m < 2) m = 9;
      }
      return ((s * 10) % 11) % 10;
    };
    return calc(12) === +cnpj.charAt(12) && calc(13) === +cnpj.charAt(13);
  }

  // ====== 2) AUTENTICAÇÃO E CARREGAMENTO DE DADOS ======

  onAuthStateChanged(auth, async (user) => {
    if (!user || !user.emailVerified) {
      window.location.assign("login.html");
      return;
    }
    currentUserUid   = user.uid;
    currentUserEmail = user.email || "";

    sidebarWelcome.innerText = `Olá, ${currentUserEmail}`;

    try {
      const userDocRef   = doc(db, "users", currentUserUid);
      const userSnapshot = await getDoc(userDocRef);
      if (!userSnapshot.exists()) {
        msgFeedback.innerText = "Não foi possível encontrar seus dados no servidor.";
        return;
      }
      const userData = userSnapshot.data();

      // Preenche campos do perfil
      inputNome.value   = userData.nome   || "";
      inputEmail.value  = userData.email  || currentUserEmail;
      inputCnpj.value   = userData.cnpj   || "";
      inputNumero.value = userData.numero || "";

      sidebarWelcome.innerText = userData.nome
        ? `Olá, ${userData.nome.split(" ")[0]}`
        : sidebarWelcome.innerText;

      setInitialPlaceholder();

      // Inicializa a seção de filiais
      initFiliais(userData);

    } catch (err) {
      console.error("Erro ao buscar dados do Firestore:", err);
      msgFeedback.innerText = "Falha ao carregar dados. Recarregue a página.";
    }
  });

  // ====== 3) EDITAR / CANCELAR PERFIL ======

  btnEditProfile.addEventListener("click", () => {
    if (!isEditing) {
      editableFields.forEach(i => i.removeAttribute("disabled"));
      btnSaveAll.removeAttribute("disabled");
      btnEditProfile.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar';
      editableFields[0].focus();
      isEditing = true;
    } else {
      editableFields.forEach(i => i.setAttribute("disabled", "true"));
      btnSaveAll.setAttribute("disabled", "true");
      btnEditProfile.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar';
      inputOldPassword.value = inputNewPassword.value = inputConfirmNewPassword.value = "";
      isEditing = false;
    }
  });

  // ====== 4) SALVAR ALTERAÇÕES DE PERFIL E SENHA ======

  btnSaveAll.addEventListener("click", async () => {
    // (Seu código atual de atualização de perfil e senha)
    // ...
  });

  // ====== 5) LOGOUT ======

  sidebarLogout.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.assign("login.html");
    } catch (e) {
      console.error("Erro ao sair:", e);
      exibirMensagem("Não foi possível sair.", "erro");
    }
  });

  // ====== 6) TROCA DE ABAS ======

  navConfiguracoes.addEventListener("click", (e) => {
    e.preventDefault();
    profileCard.style.display    = "block";
    filiaisSection.style.display = "none";
    navConfiguracoes.classList.add("active");
    navFiliais.classList.remove("active");
  });
  navFiliais.addEventListener("click", (e) => {
    e.preventDefault();
    profileCard.style.display    = "none";
    filiaisSection.style.display = "block";
    navFiliais.classList.add("active");
    navConfiguracoes.classList.remove("active");
  });

  // ====== 7) INICIALIZAÇÃO DA SEÇÃO DE FILIAIS ======

  function initFiliais(userData) {
    // Limpa tabela
    filiaisTableBody.innerHTML = "";
    // Renderiza cada filial salva
    (userData.filiais || []).forEach(f => addFilialRow(f, false));
  }

  // ====== 8) ADICIONAR / REMOVER LINHA DE FILIAL ======

  async function addFilialRow(filialObj, persist) {
    console.log("➕ renderizando filial na tabela:", filialObj);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${filialObj.cnpj}</td>
      <td>${filialObj.dados.nome}</td>
      <td>${filialObj.dados.fantasia || "-"}</td>
      <td>${filialObj.dados.logradouro || "-"}, ${filialObj.dados.numero || ""} ${filialObj.dados.municipio || ""} - ${filialObj.dados.uf || ""}</td>
      <td>${filialObj.telefone}</td>
      <td>${filialObj.email}</td>
      <td><button class="btn-remove" style="color: white; background-color: #b8231d; border: 0px solid black; border-radius: 10px; padding: 5px;">Remover</button></td>
    `;
    filiaisTableBody.appendChild(tr);

    tr.querySelector(".btn-remove").onclick = async () => {
      tr.remove();
      if (persist) {
        console.log("➖ removendo filial do Firestore:", filialObj);
        await updateDoc(doc(db, "users", currentUserUid), {
          filiais: arrayRemove(filialObj)
        });
        console.log("✅ filial removida.");
      }
    };

    if (persist) {
      console.log("💾 persistindo filial no Firestore:", filialObj);
      await updateDoc(doc(db, "users", currentUserUid), {
        filiais: arrayUnion(filialObj)
      });
      console.log("✅ filial salva.");
    }
  }

  // ====== 9) BOTÃO “ADICIONAR FILIAL” ======

  btnAddCnpj.addEventListener("click", async () => {
    filialMsg.textContent = "";
    filialMsg.style.color = "#000";

    const raw = inputNovoCnpj.value.trim().replace(/\D/g, "");
    console.log("🛠 Tentando adicionar filial:", raw);

    // ... (Suas validações de CNPJ permanecem iguais)

    try {
      filialMsg.textContent = "Buscando dados da ReceitaWS...";
      
      // ✅ **ALTERADO AQUI**
      const resp = await fetch(`${BACKEND_URL}/api/filial/${raw}`);

      console.log("📡 status HTTP:", resp.status, resp.statusText);
      if (!resp.ok) {
        filialMsg.textContent = `Erro ${resp.status} ao buscar CNPJ.`;
        return;
      }
      const data = await resp.json();
      console.log("⬇️ ReceitaWS retornou:", data);

      const filialObj = {
        cnpj:     raw,
        telefone: inputFilialPhone.value.trim(),
        email:    inputFilialEmail.value.trim(),
        dados:    data,
        criadoEm: new Date()
      };

      await addFilialRow(filialObj, true);

      filialMsg.style.color   = "#28a745";
      filialMsg.textContent    = "Filial adicionada com sucesso!";
      inputNovoCnpj.value      = "";
      inputFilialPhone.value   = "";
      inputFilialEmail.value   = "";

    } catch (err) {
      console.error("❌ erro ao adicionar filial:", err);
      filialMsg.style.color = "#d9534f";
      filialMsg.textContent = "Erro ao buscar CNPJ. Tente novamente mais tarde.";
    }
  });

});
