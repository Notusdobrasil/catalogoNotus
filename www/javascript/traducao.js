(function() {
  // 1) Callback global que o Google chama
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'pt',
      includedLanguages: 'pt,en,zh-CN,es',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false    // evita a barra de banner
    }, 'google_translate_element');
  };

  // 2) Função para setar o cookie corretamente
  function changeLanguage(lang) {
    var cookieValue = '/pt/' + lang;
    var hostname = window.location.hostname;
    var expires = 'Fri, 31 Dec 9999 23:59:59 GMT';

    // cookie sem domain
    document.cookie = 'googtrans=' + cookieValue + ';path=/;expires=' + expires;
    // cookie com domain exato
    document.cookie = 'googtrans=' + cookieValue + ';domain=' + hostname + ';path=/;expires=' + expires;
    // cookie com domain wildcard
    document.cookie = 'googtrans=' + cookieValue + ';domain=.' + hostname + ';path=/;expires=' + expires;

    // recarrega para o Google aplicar
    window.location.reload();
  }

  // 3) Aguarda o DOM, faz o bind e injeta o script do Google
  document.addEventListener('DOMContentLoaded', function() {
    // bind das bandeiras
    document.getElementById('pt').addEventListener('click', function() {
      changeLanguage('pt');
    });
    document.getElementById('en').addEventListener('click', function() {
      changeLanguage('en');
    });
    document.getElementById('zh-CN').addEventListener('click', function() {
      changeLanguage('zh-CN');
    });
    document.getElementById('es').addEventListener('click', function() {
      changeLanguage('es');
    });

    // injeta o widget — chama googleTranslateElementInit
    var gt = document.createElement('script');
    gt.src   = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    gt.async = true;
    document.body.appendChild(gt);
  });
})();
