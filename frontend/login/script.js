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

// CONTROLE DO PRIMEIRO ACESSO

let csrfTokenSessao = null;
let senhaAtualTemporaria = null;
let tokenConvite = null;
let modoNovaSenha = null;

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

        // PRIMEIRO ACESSO: SENHA TEMPORÁRIA

        if (dados.usuario?.deveTrocarSenha) {

            csrfTokenSessao = dados.csrfToken;
            senhaAtualTemporaria = senha;
            modoNovaSenha = "TEMPORARIA";

            formLogin.hidden = true;
            recuperacaoSenha.hidden = true;
            novaSenha.hidden = false;
            tituloLogin.hidden = true;

            formNovaSenha.reset();
            mensagemNovaSenha.style.color = "#4caf50";
            mensagemNovaSenha.textContent =
                "Primeiro acesso identificado. Crie sua senha definitiva.";

            return;
        }

        // LOGIN NORMAL

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

// NOVA SENHA

const novaSenha = document.getElementById("novaSenha");

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

// DEFINIÇÃO REAL DE NOVA SENHA

const formNovaSenha = document.getElementById("formNovaSenha");
const mensagemNovaSenha = document.getElementById("mensagemNovaSenha");

formNovaSenha.addEventListener("submit", async function (event) {

    event.preventDefault();

    const senha = document.getElementById("senhaNova").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    mensagemNovaSenha.style.color = "#e57373";
    mensagemNovaSenha.textContent = "";

    if (!senha || !confirmarSenha) {
        mensagemNovaSenha.textContent = "Preencha os dois campos.";
        return;
    }

    if (senha.length < 8 || senha.length > 128) {
        mensagemNovaSenha.textContent =
            "A senha deve ter entre 8 e 128 caracteres.";
        return;
    }

    if (senha !== confirmarSenha) {
        mensagemNovaSenha.textContent = "As senhas não coincidem.";
        return;
    }

    if (!modoNovaSenha) {
        mensagemNovaSenha.textContent =
            "Não foi possível identificar o tipo de acesso. Abra novamente o link ou faça login.";
        return;
    }

    const botaoSalvar = formNovaSenha.querySelector(
        'button[type="submit"]'
    );

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    try {

        let url;
        let corpo;
        const cabecalhos = {
            "Content-Type": "application/json"
        };

        if (modoNovaSenha === "TEMPORARIA") {

            url = `${API_URL}/auth/alterar-senha`;

            cabecalhos["X-CSRF-Token"] = csrfTokenSessao;

            corpo = {
                senhaAtual: senhaAtualTemporaria,
                novaSenha: senha
            };

        } else if (modoNovaSenha === "CONVITE") {

            url = `${API_URL}/auth/convite/aceitar`;

            corpo = {
                token: tokenConvite,
                novaSenha: senha
            };

        } else {
            throw new Error("Método de acesso inválido.");
        }

        const resposta = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: cabecalhos,
            body: JSON.stringify(corpo)
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.message ||
                dados.mensagem ||
                "Não foi possível alterar a senha."
            );
        }

        // Limpa os dados temporários.
        csrfTokenSessao = null;
        senhaAtualTemporaria = null;
        tokenConvite = null;
        modoNovaSenha = null;

        // Remove o token do convite da URL.
        window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
        );

        novaSenha.hidden = true;
        recuperacaoSenha.hidden = true;
        formLogin.hidden = false;
        tituloLogin.hidden = false;

        formNovaSenha.reset();
        mensagemNovaSenha.textContent = "";

        mensagemLogin.style.color = "#4caf50";
        mensagemLogin.textContent =
            "Senha criada com sucesso! Entre com sua nova senha.";

    } catch (erro) {

        mensagemNovaSenha.style.color = "#e57373";
        mensagemNovaSenha.textContent =
            erro.message === "Failed to fetch"
                ? "Não foi possível conectar ao servidor."
                : erro.message;

    } finally {

        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar nova senha";

    }

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

// RECONHECER CONVITE RECEBIDO POR E-MAIL

const hash = window.location.hash;

if (hash.startsWith("#convite=")) {

    tokenConvite = hash.substring("#convite=".length);
    modoNovaSenha = "CONVITE";

    if (tokenConvite) {

        formLogin.hidden = true;
        recuperacaoSenha.hidden = true;
        novaSenha.hidden = false;
        tituloLogin.hidden = true;

        mensagemNovaSenha.style.color = "#4caf50";
        mensagemNovaSenha.textContent =
            "Convite identificado! Crie sua senha para acessar sua conta.";

    } else {

        modoNovaSenha = null;

        mensagemLogin.style.color = "#e57373";
        mensagemLogin.textContent = "Link de convite inválido.";

    }
}