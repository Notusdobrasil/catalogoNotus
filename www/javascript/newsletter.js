// Defina a constante no topo do seu arquivo com a sua URL real
const BACKEND_URL = "https://us-central1-notusauth.cloudfunctions.net/api";

document.getElementById("newsletter-form").addEventListener("submit", async function (event) {
  event.preventDefault(); // Impede o recarregamento da página

  const email = document.getElementById("email").value;
  const name = document.getElementById("name").value;
  const mensagem = document.getElementById("mensagem");

  // Limpa a mensagem anterior
  mensagem.textContent = "";

  try {
      // Usa a constante BACKEND_URL para montar o endereço completo da sua API
      const response = await fetch(`${BACKEND_URL}/proxy/subscribe`, { // <-- MUDANÇA PRINCIPAL AQUI
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, name }),
      });

      const result = await response.json();

      if (response.ok) {
          mensagem.textContent = "Inscrição realizada com sucesso!";
          mensagem.style.color = "green";
      } else {
          mensagem.textContent = `Erro: ${result.error || "Não foi possível realizar a inscrição."}`;
          mensagem.style.color = "red";
      }
  } catch (error) {
      console.error("Erro na chamada da newsletter:", error); // Adiciona um log do erro no console
      mensagem.textContent = "Erro ao conectar ao servidor.";
      mensagem.style.color = "red";
  }
});