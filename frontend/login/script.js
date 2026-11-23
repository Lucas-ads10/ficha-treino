// CONFIGURAÇÃO DA API

const API_URL = window.CAVERNA_CONFIG.API_URL;


const botaoTema = document.getElementById("alternarTema");

botaoTema.addEventListener("click", function () {

    document.body.classList.toggle("tema-claro");

    const modoClaro = document.body.classList.contains("tema-claro");

    botaoTema.setAttribute(
        "aria-label",
        modoClaro ? "Modo claro ativado" : "Modo escuro ativado"
    );

});


// MOSTRAR OU OCULTAR SENHA

const campoSenha = document.getElementById("senha");
const mostrarSenha = document.getElementById("mostrarSenha");

mostrarSenha.addEventListener("change", function () {

    campoSenha.type = mostrarSenha.checked
        ? "text"
        : "password";

});



// AUTENTICAÇÃO REAL DO USUÁRIO

const formLogin = document.getElementById("formLogin");
const mensagemLogin = document.getElementById("mensagemLogin");

formLogin.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = campoSenha.value;

    mensagemLogin.style.color = "#e57373";
    mensagemLogin.textContent = "";

    if (!email || !senha) {
        mensagemLogin.textContent = "Preencha todos os campos.";
        return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
        mensagemLogin.textContent = "Digite um e-mail válido.";
        return;
    }

    const botaoEntrar = formLogin.querySelector('button[type="submit"]');

    botaoEntrar.disabled = true;
    botaoEntrar.textContent = "Entrando...";

    try {

        const resposta = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.message || dados.mensagem || "E-mail ou senha inválidos.");
        }

        const destinosPermitidos = ["/admin/", "/ficha/"];

        if (!destinosPermitidos.includes(dados.destino)) {
            throw new Error("Destino de acesso inválido.");
        }

        mensagemLogin.style.color = "#4caf50";
        mensagemLogin.textContent = "Login realizado! Redirecionando...";

        window.location.href = dados.destino;

    } catch (erro) {

        mensagemLogin.style.color = "#e57373";

        mensagemLogin.textContent =
            erro.message === "Failed to fetch"
                ? "Não foi possível conectar ao servidor. Tente novamente."
                : erro.message;

    } finally {

        botaoEntrar.disabled = false;
        botaoEntrar.textContent = "Entrar";

    }

});



// NAVEGAÇÃO PARA RECUPERAÇÃO DE SENHA

const linkEsqueciSenha = document.getElementById("esqueciSenha");
const voltarLogin = document.getElementById("voltarLogin");

const recuperacaoSenha = document.getElementById("recuperacaoSenha");
const tituloLogin = document.getElementById("tituloLogin");

linkEsqueciSenha.addEventListener("click", function (event) {

    event.preventDefault();

    formLogin.hidden = true;
    recuperacaoSenha.hidden = false;
    tituloLogin.hidden = true;

});

voltarLogin.addEventListener("click", function (event) {

    event.preventDefault();

    recuperacaoSenha.hidden = true;
    formLogin.hidden = false;

    formRecuperacao.reset();
    mensagemRecuperacao.textContent = "";
    tituloLogin.hidden = false;

});

// NAVEGAÇÃO PARA NOVA SENHA

const abrirNovaSenha = document.getElementById("abrirNovaSenha");
const novaSenha = document.getElementById("novaSenha");

abrirNovaSenha.addEventListener("click", function () {

    recuperacaoSenha.hidden = true;
    novaSenha.hidden = false;

});

// VALIDAÇÃO DO FORMULÁRIO DE RECUPERAÇÃO

const formRecuperacao = document.getElementById("formRecuperacao");
const mensagemRecuperacao = document.getElementById("mensagemRecuperacao");

formRecuperacao.addEventListener("submit", function (event) {

    event.preventDefault();

    const email = document.getElementById("emailRecuperacao").value.trim();

    mensagemRecuperacao.style.color = "#e57373";
    mensagemRecuperacao.textContent = "";

    if (!email) {
        mensagemRecuperacao.textContent = "Informe seu e-mail.";
        return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
        mensagemRecuperacao.textContent = "Digite um e-mail válido.";
        return;
    }

    mensagemRecuperacao.style.color = "#4caf50";
    mensagemRecuperacao.textContent = "E-mail validado! A recuperação será integrada ao sistema.";

});

// VALIDAÇÃO DO FORMULÁRIO DE NOVA SENHA

const formNovaSenha = document.getElementById("formNovaSenha");
const mensagemNovaSenha = document.getElementById("mensagemNovaSenha");

formNovaSenha.addEventListener("submit", function (event) {

    event.preventDefault();

    const senha = document.getElementById("senhaNova").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    mensagemNovaSenha.style.color = "#e57373";
    mensagemNovaSenha.textContent = "";

    if (!senha || !confirmarSenha) {
        mensagemNovaSenha.textContent = "Preencha os dois campos.";
        return;
    }

    if (senha.length < 8) {
        mensagemNovaSenha.textContent = "A senha deve ter pelo menos 8 caracteres.";
        return;
    }

    if (senha !== confirmarSenha) {
        mensagemNovaSenha.textContent = "As senhas não coincidem.";
        return;
    }

    mensagemNovaSenha.style.color = "#4caf50";
    mensagemNovaSenha.textContent = "Senha alterada com sucesso!";

    setTimeout(function () {

        novaSenha.hidden = true;
        formLogin.hidden = false;
        tituloLogin.hidden = false;

        formNovaSenha.reset();
        mensagemNovaSenha.textContent = "";
        mensagemLogin.style.color = "#4caf50";
        mensagemLogin.textContent = "Senha alterada com sucesso!";

    }, 1500);

});

// MOSTRAR OU OCULTAR AS NOVAS SENHAS

const mostrarNovaSenha = document.getElementById("mostrarNovaSenha");
const campoSenhaNova = document.getElementById("senhaNova");
const campoConfirmarSenha = document.getElementById("confirmarSenha");

mostrarNovaSenha.addEventListener("change", function () {

    const tipo = mostrarNovaSenha.checked ? "text" : "password";

    campoSenhaNova.type = tipo;
    campoConfirmarSenha.type = tipo;

});