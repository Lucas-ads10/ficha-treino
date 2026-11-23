
// ==========================================
// DADOS DE DEMONSTRAÇÃO
// ==========================================

const usuarios = [
    {
        id: 1,
        nome: "Lucas Silva",
        email: "lucas@email.com",
        status: "Ativo",
        treinos: [
            {
                id: 1,
                nome: "Treino A",
                exercicios: []
            },
            {
                id: 2,
                nome: "Treino B",
                exercicios: []
            },
            {
                id: 3,
                nome: "Treino C",
                exercicios: []
            },
            {
                id: 4,
                nome: "Treino D",
                exercicios: []
            }
        ]
    },
    {
        id: 2,
        nome: "João Santos",
        email: "joao@email.com",
        status: "Ativo",
        treinos: [
            {
                id: 5,
                nome: "Treino A",
                exercicios: []
            },
            {
                id: 6,
                nome: "Treino B",
                exercicios: []
            }
        ]
    },
    {
        id: 3,
        nome: "Maria Oliveira",
        email: "maria@email.com",
        status: "Pendente",
        treinos: []
    },
    {
        id: 4,
        nome: "Pedro Costa",
        email: "pedro@email.com",
        status: "Ativo",
        treinos: [
            {
                id: 7,
                nome: "Treino de pernas",
                exercicios: []
            }
        ]
    }
];

let usuarioSelecionado = null;
let usuarioEmEdicao = null;
let treinoSelecionado = null;
let exercicioEditandoId = null;
let treinoEditandoId = null;

// ==========================================
// PADRONIZAÇÃO DE TEXTOS
// ==========================================

function normalizarNome(texto) {
    texto = texto.trim().toLocaleLowerCase("pt-BR");

    return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

function normalizarEmail(email) {
    return email.trim().toLowerCase();
}


// ==========================================
// ELEMENTOS PRINCIPAIS
// ==========================================

const tituloPagina = document.getElementById("tituloPagina");
const descricaoPagina = document.getElementById("descricaoPagina");

const totalUsuarios = document.getElementById("totalUsuarios");
const totalFichas = document.getElementById("totalFichas");
const totalExercicios = document.getElementById("totalExercicios");


// ==========================================
// NAVEGAÇÃO
// ==========================================

const menuItens = document.querySelectorAll(".menu-item");

function navegar(tela) {

    document.querySelectorAll(".view").forEach(view => {
        view.hidden = true;
    });

    menuItens.forEach(item => {
        item.classList.remove("ativo");
    });

    const telas = {
        dashboard: {
            elemento: "viewDashboard",
            titulo: "Dashboard",
            descricao: "Bem-vindo ao painel administrativo."
        },
        usuarios: {
            elemento: "viewUsuarios",
            titulo: "Usuários",
            descricao: "Gerencie as pessoas cadastradas."
        },
        fichas: {
            elemento: "viewFichas",
            titulo: "Fichas de treino",
            descricao: "Gerencie as fichas de seus usuários."
        },
        pagamentos: {
            elemento: "viewPagamentos",
            titulo: "Pagamentos",
            descricao: "Acompanhe as mensalidades e os pagamentos dos clientes."
        },
        perfil: {
            elemento: "viewPerfil",
            titulo: "Perfil do usuário",
            descricao: "Gerencie os dados e treinos desta pessoa."
        },
        exercicios: {
            elemento: "viewExercicios",
            titulo: "Gerenciar exercícios",
            descricao: "Adicione e organize os exercícios deste treino."
        }
    };

    const configuracao = telas[tela];

    if (!configuracao) return;

    document.getElementById(configuracao.elemento).hidden = false;

    tituloPagina.textContent = configuracao.titulo;
    descricaoPagina.textContent = configuracao.descricao;

    const itemMenu = document.querySelector(
        `.menu-item[data-view="${tela}"]`
    );

    if (itemMenu) {
        itemMenu.classList.add("ativo");
    }

    if (tela === "dashboard") {
        mostrarUsuarios("listaUsuariosDashboard");
    }

    if (tela === "usuarios") {
        mostrarUsuarios("listaUsuariosCompleta");
    }

    if (tela === "fichas") {
        mostrarUsuariosFichas();
    }

}


// ==========================================
// CLIQUES NO MENU
// ==========================================

menuItens.forEach(item => {

    item.addEventListener("click", event => {

        event.preventDefault();

        navegar(item.dataset.view);

    });

});


// ==========================================
// FILTRAR USUÁRIOS
// ==========================================

function filtrarUsuarios(campoId) {

    const campo = document.getElementById(campoId);

    if (!campo) {
        return usuarios;
    }

    const pesquisa = campo.value.trim().toLocaleLowerCase("pt-BR");

    return usuarios.filter(usuario =>
        usuario.nome.toLocaleLowerCase("pt-BR").includes(pesquisa)
    );

}


// ==========================================
// MOSTRAR USUÁRIOS
// ==========================================




function mostrarUsuarios(elementoId) {

    const lista = document.getElementById(elementoId);

    lista.innerHTML = "";

    const campoPesquisa = elementoId === "listaUsuariosDashboard"
        ? "pesquisaDashboard"
        : "pesquisaUsuarios";

    filtrarUsuarios(campoPesquisa).forEach(usuario => {

        const linha = document.createElement("tr");

        const statusClasse = usuario.status.toLowerCase();

        linha.innerHTML = `
            <td>
                <div class="usuario-nome">
                    <div class="usuario-avatar">
                        ${usuario.nome.charAt(0).toUpperCase()}
                    </div>

                    <span
                        class="nome-clicavel"
                        onclick="visualizarUsuario(${usuario.id})"
                    >
                        ${usuario.nome}
                    </span>
                </div>
            </td>

            <td>${usuario.email}</td>

            <td>${usuario.peso} kg</td>

            <td>${usuario.idade} anos</td>

            <td>${usuario.objetivo}</td>

            <td>
                <span class="status ${statusClasse}">
                    ${usuario.status}
                </span>
            </td>
        `;

        lista.appendChild(linha);

    });

}





// ==========================================
// LISTA DE USUÁRIOS DAS FICHAS
// ==========================================


function mostrarUsuariosFichas() {

    const lista = document.getElementById("listaUsuariosFichas");

    lista.innerHTML = "";

    filtrarUsuarios("pesquisaFichas").forEach(usuario => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${usuario.nome}</td>
            <td>${usuario.email}</td>
            <td>${usuario.treinos.length} treino(s)</td>

            <td>
                <button
                    class="botao-acao"
                    onclick="visualizarUsuario(${usuario.id})"
                >
                    Abrir fichas
                </button>
            </td>
        `;

        lista.appendChild(linha);

    });

}

// ==========================================
// EDITAR USUARIOS
// ==========================================

function editarUsuario() {

    if (!usuarioSelecionado) return;

    usuarioEmEdicao = usuarioSelecionado.id;

    document.getElementById("tituloModalUsuario").textContent =
        "Editar usuário";

    document.getElementById("nomeUsuario").value =
        usuarioSelecionado.nome;

    document.getElementById("emailUsuario").value =
        usuarioSelecionado.email;

    document.getElementById("pesoUsuario").value =
        usuarioSelecionado.peso || "";

    document.getElementById("idadeUsuario").value =
        usuarioSelecionado.idade || "";

    document.getElementById("objetivoUsuario").value =
        usuarioSelecionado.objetivo || "";

    document.getElementById("observacoesUsuario").value =
        usuarioSelecionado.observacoes || "";

    document.getElementById("mensalidadeUsuario").value =
        usuarioSelecionado.mensalidade || "";

    document.getElementById("dataPrimeiroPagamento").value =
        usuarioSelecionado.dataUltimoPagamento || "";

    document.getElementById("modalUsuario").hidden = false;

}


// ==========================================
// ABRIR PERFIL
// ==========================================


function visualizarUsuario(id) {

    usuarioSelecionado = usuarios.find(
        usuario => usuario.id === id
    );

    if (!usuarioSelecionado) return;

    document.getElementById("perfilNome").textContent =
        usuarioSelecionado.nome;

    document.getElementById("perfilEmail").textContent =
        usuarioSelecionado.email;

    document.getElementById("perfilAvatar").textContent =
        usuarioSelecionado.nome.charAt(0).toUpperCase();

    document.getElementById("perfilPeso").textContent =
        usuarioSelecionado.peso ? `${usuarioSelecionado.peso} kg` : "Não informado";

    document.getElementById("perfilIdade").textContent =
        usuarioSelecionado.idade ? `${usuarioSelecionado.idade} anos` : "Não informada";

    document.getElementById("perfilObjetivo").textContent =
        usuarioSelecionado.objetivo || "Não informado";

    document.getElementById("perfilObservacoes").textContent =
        usuarioSelecionado.observacoes || "Nenhuma observação cadastrada.";

    const status = document.getElementById("perfilStatus");

    status.textContent = usuarioSelecionado.status;
    status.className = `status ${usuarioSelecionado.status.toLowerCase()}`;

    document.getElementById("btnBloquearUsuario").textContent =
        usuarioSelecionado.status === "Bloqueado"
            ? "Desbloquear usuário"
            : "Bloquear usuário";

    mostrarTreinosUsuario();

    navegar("perfil");

}



// ==========================================
// MOSTRAR TREINOS DO USUÁRIO
// ==========================================

function mostrarTreinosUsuario() {

    const lista = document.getElementById("listaTreinosUsuario");

    lista.innerHTML = "";

    if (usuarioSelecionado.treinos.length === 0) {

        lista.innerHTML = `
            <p class="mensagem-vazia">
                Este usuário ainda não possui treinos.
            </p>
        `;

        return;

    }

    usuarioSelecionado.treinos.forEach(treino => {

        const card = document.createElement("article");

        card.className = "card-treino";

        card.innerHTML = `
    <div>
        <h3>${treino.nome}</h3>
        <p>${treino.exercicios.length} exercício(s)</p>
    </div>

    <div>
        <button class="botao-acao" onclick="visualizarTreino(${treino.id})">
            Gerenciar exercícios
        </button>

        <button class="botao-acao" onclick="editarTreino(${treino.id})">
            Editar
        </button>

        <button class="botao-acao" onclick="excluirTreino(${treino.id})">
            Excluir
        </button>
    </div>
`;

        lista.appendChild(card);

    });

}


// ==========================================
// ABRIR TREINO SELECIONADO
// ==========================================

function visualizarTreino(id) {

    if (!usuarioSelecionado) {
        alert("Selecione um usuário primeiro.");
        return;
    }

    treinoSelecionado = usuarioSelecionado.treinos.find(
        treino => treino.id === id
    );

    if (!treinoSelecionado) {
        alert("Treino não encontrado.");
        return;
    }

    document.getElementById("tituloTreinoSelecionado").textContent =
        treinoSelecionado.nome;

    mostrarExercicios();

    navegar("exercicios");
}


// ==========================================
// CADASTRAR USUÁRIO
// ==========================================

function cadastrarUsuario() {

    document.getElementById("tituloModalUsuario").textContent =
        "Adicionar usuário";

    document.getElementById("formUsuario").reset();

    document.getElementById("modalUsuario").hidden = false;

    document.getElementById("nomeUsuario").focus();
}


// ==========================================
// BOTÕES DE CADASTRO
// ==========================================

document.getElementById("btnNovoUsuarioLista").addEventListener(
    "click",
    cadastrarUsuario
);


// ==========================================
// VOLTAR PARA USUÁRIOS
// ==========================================

document.getElementById("btnVoltarUsuarios").addEventListener(
    "click",
    () => navegar("usuarios")
);


// ==========================================
// INDICADORES
// ==========================================

function atualizarPainel() {

    const quantidadeFichas = usuarios.reduce(
        (total, usuario) => total + usuario.treinos.length,
        0
    );

    const quantidadeExercicios = usuarios.reduce(
        (total, usuario) => {
            return total + usuario.treinos.reduce(
                (soma, treino) => soma + treino.exercicios.length,
                0
            );
        },
        0
    );

    totalUsuarios.textContent = usuarios.length;
    totalFichas.textContent = quantidadeFichas;
    totalExercicios.textContent = quantidadeExercicios;

    mostrarUsuarios("listaUsuariosDashboard");
    mostrarUsuarios("listaUsuariosCompleta");
    mostrarUsuariosFichas();

    mostrarPagamentos();

}

function mostrarPagamentos() {

    const lista = document.getElementById("listaPagamentos");

    lista.innerHTML = "";

    let totalRecebido = 0;
    let receitaPrevista = 0;
    let emDia = 0;
    let atrasados = 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    function calcularVencimento(data) {

        const [ano, mes, dia] = data.split("-").map(Number);

        const vencimento = new Date(ano, mes - 1, 1);

        vencimento.setMonth(vencimento.getMonth() + 1);

        const ultimoDia = new Date(
            vencimento.getFullYear(),
            vencimento.getMonth() + 1,
            0
        ).getDate();

        vencimento.setDate(Math.min(dia, ultimoDia));

        return vencimento;
    }

    function formatarData(data) {

        if (!data) return "Não informado";

        const [ano, mes, dia] = data.split("-");

        return `${dia}/${mes}/${ano}`;
    }

    usuarios.forEach(usuario => {

        const historico = usuario.historicoPagamentos || [];

        historico.forEach(pagamento => {
            totalRecebido += Number(pagamento.valor) || 0;
        });

        const temDados =
            usuario.mensalidade > 0 &&
            usuario.dataUltimoPagamento;

        let proximoVencimento = null;
        let situacao = "Não configurado";

        if (temDados) {

            receitaPrevista += Number(usuario.mensalidade);

            proximoVencimento = calcularVencimento(
                usuario.dataUltimoPagamento
            );

            if (proximoVencimento <= hoje) {
                situacao = "Atrasado";
                atrasados++;
            } else {
                situacao = "Em dia";
                emDia++;
            }
        }

        const linha = document.createElement("tr");

        const dados = [
            usuario.nome,
            temDados
                ? Number(usuario.mensalidade).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                )
                : "Não informado",
            temDados
                ? formatarData(usuario.dataUltimoPagamento)
                : "Não informado",
            proximoVencimento
                ? proximoVencimento.toLocaleDateString("pt-BR")
                : "Não informado",
            situacao
        ];

        dados.forEach(texto => {

            const coluna = document.createElement("td");

            coluna.textContent = texto;

            linha.appendChild(coluna);

        });

        const colunaAcao = document.createElement("td");


        if (temDados && situacao === "Atrasado") {

            const botao = document.createElement("button");

            botao.textContent = "Marcar como pago";
            botao.className = "botao-principal";
            botao.style.backgroundColor = "#dc2626";
            botao.style.color = "#ffffff";

            botao.addEventListener("click", function () {

                const agora = new Date();

                const ano = agora.getFullYear();
                const mes = String(agora.getMonth() + 1).padStart(2, "0");
                const dia = String(agora.getDate()).padStart(2, "0");

                const dataHoje = `${ano}-${mes}-${dia}`;

                if (!usuario.historicoPagamentos) {
                    usuario.historicoPagamentos = [];
                }

                usuario.historicoPagamentos.push({
                    valor: Number(usuario.mensalidade),
                    data: dataHoje
                });

                usuario.dataUltimoPagamento = dataHoje;

                mostrarPagamentos();

                alert("Pagamento registrado com sucesso!");

            });

            colunaAcao.appendChild(botao);

        } else if (temDados && situacao === "Em dia") {

            const pago = document.createElement("span");

            pago.textContent = "Pago";
            pago.style.color = "#2563eb";
            pago.style.fontWeight = "600";

            colunaAcao.appendChild(pago);

        } else {

            colunaAcao.textContent = "—";

        }
        linha.appendChild(colunaAcao);

        lista.appendChild(linha);

    });

    document.getElementById("totalRecebido").textContent =
        totalRecebido.toLocaleString(
            "pt-BR",
            { style: "currency", currency: "BRL" }
        );

    document.getElementById("receitaPrevista").textContent =
        receitaPrevista.toLocaleString(
            "pt-BR",
            { style: "currency", currency: "BRL" }
        );

    document.getElementById("clientesEmDia").textContent = emDia;

    document.getElementById("clientesAtrasados").textContent = atrasados;

    atualizarGraficoPagamentos(emDia, atrasados);

}

//=========================
//Grafico de pagamento
//=========================


function atualizarGraficoPagamentos(emDia, atrasados) {

    const grafico = document.getElementById("graficoPagamentos");

    const total = emDia + atrasados;

    const percentualEmDia = total > 0
        ? (emDia / total) * 100
        : 0;

    const percentualAtrasados = total > 0
        ? (atrasados / total) * 100
        : 0;

    grafico.innerHTML = `
        <div class="grafico-pagamentos">

            <div
                class="grafico-pizza"
                style="background: conic-gradient(
                    #2563eb 0% ${percentualEmDia}%,
                    #dc2626 ${percentualEmDia}% 100%
                );"
            ></div>

            <div class="legenda-pagamentos">

                <div class="item-legenda">
                    <span class="cor-legenda" style="background:#2563eb"></span>
                    Em dia: ${emDia} (${percentualEmDia.toFixed(1)}%)
                </div>

                <div class="item-legenda">
                    <span class="cor-legenda" style="background:#dc2626"></span>
                    Atrasados: ${atrasados} (${percentualAtrasados.toFixed(1)}%)
                </div>

                <strong>Total de clientes: ${total}</strong>

            </div>

        </div>
    `;
}



// ==========================================
// AUTENTICAÇÃO E INICIALIZAÇÃO
// ==========================================

const API_URL = window.CAVERNA_CONFIG.API_URL;

async function iniciarPainelAdmin() {

    const painel = document.getElementById("painelAdmin");

    try {

        const resposta = await fetch(`${API_URL}/auth/me`, {
            method: "GET",
            credentials: "include"
        });

        if (!resposta.ok) {
            window.location.replace("../login/");
            return;
        }

        const dados = await resposta.json();

        if (!dados.sucesso || !dados.usuario) {
            window.location.replace("../login/");
            return;
        }

        if (dados.usuario.perfil !== "ADMIN") {
            window.location.replace("../login/");
            return;
        }

        if (dados.usuario.deveTrocarSenha) {
            window.location.replace("../login/");
            return;
        }

        painel.hidden = false;

        atualizarPainel();
        navegar("dashboard");

    } catch (erro) {

        console.error("Erro ao verificar sessão:", erro);

        window.location.replace("../login/");

    }

}

iniciarPainelAdmin();




// ==========================================
// PESQUISA DE USUÁRIOS
// ==========================================

document.getElementById("pesquisaDashboard").addEventListener(
    "input",
    () => mostrarUsuarios("listaUsuariosDashboard")
);

document.getElementById("pesquisaUsuarios").addEventListener(
    "input",
    () => mostrarUsuarios("listaUsuariosCompleta")
);

document.getElementById("pesquisaFichas").addEventListener(
    "input",
    function () {
        console.log("PESQUISA ACIONADA:", this.value);
        mostrarUsuariosFichas();
    }
);



// ==========================================
// ADICIONAR TREINO AO USUÁRIO
// ==========================================

function adicionarTreino() {

    if (!usuarioSelecionado) {
        alert("Selecione um usuário primeiro.");
        return;
    }

    treinoEditandoId = null;

    document.getElementById("tituloModalTreino").textContent =
        "Adicionar treino";

    document.getElementById("formTreino").reset();

    document.getElementById("modalTreino").hidden = false;

    document.getElementById("nomeTreino").focus();
}


// ==========================================
// EVENTO DO BOTÃO ADICIONAR TREINO
// ==========================================

document.getElementById("btnAdicionarTreino").addEventListener(
    "click",
    adicionarTreino
);

// ==========================================
// LISTAR EXERCÍCIOS DO TREINO
// ==========================================

function mostrarExercicios() {

    const lista = document.getElementById("listaExerciciosTreino");

    lista.innerHTML = "";

    if (!treinoSelecionado || treinoSelecionado.exercicios.length === 0) {

        lista.innerHTML = `
            <p class="mensagem-vazia">
                Este treino ainda não possui exercícios.
            </p>
        `;

        return;
    }

    treinoSelecionado.exercicios.forEach((exercicio, index) => {

        const card = document.createElement("article");

        card.className = "card-treino";

        card.innerHTML = `
    <div>
        <h3>${exercicio.nome}</h3>
        <p>
            Séries: ${exercicio.series} |
            Repetições: ${exercicio.repeticoes}
        </p>
    </div>

    <div>
        <button class="botao-acao" onclick="editarExercicio(${exercicio.id})">
            Editar
        </button>

        <button class="botao-acao" onclick="excluirExercicio(${exercicio.id})">
            Excluir
        </button>
    </div>
`;

        lista.appendChild(card);

    });
}

// ==========================================
// VOLTAR PARA A LISTA DE TREINOS
// ==========================================

document.getElementById("btnVoltarTreinos").addEventListener(
    "click",
    () => {
        navegar("perfil");
    }
);

// ==========================================
// ABRIR FORMULÁRIO PARA ADICIONAR EXERCÍCIO
// ==========================================

function adicionarExercicio() {

    if (!treinoSelecionado) {
        alert("Selecione um treino primeiro.");
        return;
    }

    exercicioEditandoId = null;

    document.getElementById("tituloModalExercicio").textContent =
        "Adicionar exercício";

    document.getElementById("formExercicio").reset();

    document.getElementById("modalExercicio").hidden = false;

    document.getElementById("nomeExercicio").focus();
}

// Conectar botão
document.getElementById("btnAdicionarExercicio").addEventListener(
    "click",
    adicionarExercicio
);

// ==========================================
// EDITAR EXERCÍCIO PELO FORMULÁRIO
// ==========================================

function editarExercicio(id) {

    const exercicio = treinoSelecionado.exercicios.find(
        item => item.id === id
    );

    if (!exercicio) {
        alert("Exercício não encontrado.");
        return;
    }

    exercicioEditandoId = id;

    document.getElementById("tituloModalExercicio").textContent =
        "Editar exercício";

    document.getElementById("nomeExercicio").value =
        exercicio.nome;

    document.getElementById("seriesExercicio").value =
        exercicio.series;

    document.getElementById("repeticoesExercicio").value =
        exercicio.repeticoes;

    document.getElementById("modalExercicio").hidden = false;

    document.getElementById("nomeExercicio").focus();
}
// ==========================================
// EXCLUIR EXERCÍCIO
// ==========================================

function excluirExercicio(id) {

    const confirmar = confirm(
        "Tem certeza que deseja excluir este exercício?"
    );

    if (!confirmar) return;

    treinoSelecionado.exercicios =
        treinoSelecionado.exercicios.filter(
            exercicio => exercicio.id !== id
        );

    mostrarExercicios();
    mostrarTreinosUsuario();
    atualizarPainel();

    alert("Exercício excluído com sucesso!");
}

// ==========================================
// EDITAR TREINO
// ==========================================

// ==========================================
// EDITAR TREINO PELO FORMULÁRIO
// ==========================================

function editarTreino(id) {

    const treino = usuarioSelecionado.treinos.find(
        item => item.id === id
    );

    if (!treino) {
        alert("Treino não encontrado.");
        return;
    }

    treinoEditandoId = id;

    document.getElementById("tituloModalTreino").textContent =
        "Editar treino";

    document.getElementById("nomeTreino").value =
        treino.nome;

    document.getElementById("modalTreino").hidden = false;

    document.getElementById("nomeTreino").focus();
}

// ==========================================
// EXCLUIR TREINO
// ==========================================

function excluirTreino(id) {

    const treino = usuarioSelecionado.treinos.find(
        item => item.id === id
    );

    if (!treino) {
        alert("Treino não encontrado.");
        return;
    }

    const confirmar = confirm(
        `Tem certeza que deseja excluir "${treino.nome}" e todos os seus exercícios?`
    );

    if (!confirmar) return;

    usuarioSelecionado.treinos =
        usuarioSelecionado.treinos.filter(
            item => item.id !== id
        );

    mostrarTreinosUsuario();
    atualizarPainel();

    alert("Treino excluído com sucesso!");
}

// ==========================================
// SALVAR EXERCÍCIO PELO FORMULÁRIO
// ==========================================

document.getElementById("formExercicio").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const nome = normalizarNome(
            document.getElementById("nomeExercicio").value
        );
        const series = Number(document.getElementById("seriesExercicio").value);
        const repeticoes = document.getElementById("repeticoesExercicio").value.trim();

        if (!nome || !Number.isInteger(series) || series < 1 || !repeticoes) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        if (exercicioEditandoId !== null) {

            const exercicio = treinoSelecionado.exercicios.find(
                item => item.id === exercicioEditandoId
            );

            if (!exercicio) {
                alert("Exercício não encontrado.");
                return;
            }

            exercicio.nome = nome;
            exercicio.series = series;
            exercicio.repeticoes = repeticoes;

        } else {

            treinoSelecionado.exercicios.push({
                id: Date.now(),
                nome: nome,
                series: series,
                repeticoes: repeticoes
            });

        }

        document.getElementById("modalExercicio").hidden = true;

        exercicioEditandoId = null;

        mostrarExercicios();
        mostrarTreinosUsuario();
        atualizarPainel();

    }
);

// ==========================================
// CANCELAR FORMULÁRIO
// ==========================================

document.getElementById("btnCancelarExercicio").addEventListener(
    "click",
    function () {
        document.getElementById("modalExercicio").hidden = true;
        exercicioEditandoId = null;
    }
);

// ==========================================
// SALVAR NOVO USUÁRIO
// ==========================================

document.getElementById("formUsuario").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const nome = normalizarNome(
            document.getElementById("nomeUsuario").value
        );

        const email = normalizarEmail(
            document.getElementById("emailUsuario").value
        );

        const mensalidade = Number(
            document.getElementById("mensalidadeUsuario").value
        );

        const peso = Number
            (document.getElementById("pesoUsuario").value);
        const idade = Number(document.getElementById("idadeUsuario").value);
        const objetivo = document.getElementById("objetivoUsuario").value;
        const observacoes = document.getElementById("observacoesUsuario").value.trim();

        const dataPrimeiroPagamento =
            document.getElementById("dataPrimeiroPagamento").value;

        if (
            !nome ||
            !email ||
            !peso ||
            peso <= 0 ||
            !idade ||
            idade <= 0 ||
            idade > 120 ||
            !objetivo ||
            !mensalidade ||
            mensalidade <= 0 ||
            !dataPrimeiroPagamento
        ) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        const emailExiste = usuarios.some(
            usuario =>
                usuario.email.toLowerCase() === email &&
                usuario.id !== usuarioEmEdicao
        );

        if (emailExiste) {
            alert("Este e-mail já está cadastrado.");
            return;
        }

        if (usuarioEmEdicao !== null) {

            const usuario = usuarios.find(
                usuario => usuario.id === usuarioEmEdicao
            );

            if (!usuario) return;

            usuario.nome = nome;
            usuario.email = email;
            usuario.peso = peso;
            usuario.idade = idade;
            usuario.objetivo = objetivo;
            usuario.observacoes = observacoes;
            usuario.mensalidade = mensalidade;

        } else {

            usuarios.push({
                id: Date.now(),
                nome: nome,
                email: email,
                peso: peso,
                idade: idade,
                objetivo: objetivo,
                observacoes: observacoes,
                status: "Pendente",
                mensalidade: mensalidade,
                dataUltimoPagamento: dataPrimeiroPagamento,
                historicoPagamentos: [
                    {
                        valor: mensalidade,
                        data: dataPrimeiroPagamento
                    }
                ],
                treinos: []
            });

        }

        document.getElementById("modalUsuario").hidden = true;

        document.getElementById("formUsuario").reset();

        const estavaEditando = usuarioEmEdicao !== null;

        usuarioEmEdicao = null;

        atualizarPainel();

        if (estavaEditando) {
            visualizarUsuario(usuarioSelecionado.id);
            alert("Usuário atualizado com sucesso!");
        } else {
            alert("Usuário cadastrado com sucesso!");
        }
    }
);

// ==========================================
// CANCELAR CADASTRO DE USUÁRIO
// ==========================================

document.getElementById("btnCancelarUsuario").addEventListener(
    "click",
    function () {

        document.getElementById("modalUsuario").hidden = true;

        document.getElementById("formUsuario").reset();

    }
);

// ==========================================
// SALVAR TREINO PELO FORMULÁRIO
// ==========================================

document.getElementById("formTreino").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const nome = normalizarNome(
            document.getElementById("nomeTreino").value
        );

        if (!nome) {
            alert("Informe o nome do treino.");
            return;
        }

        const nomeExiste = usuarioSelecionado.treinos.some(
            treino =>
                treino.nome.toLowerCase() === nome.toLowerCase() &&
                treino.id !== treinoEditandoId
        );

        if (nomeExiste) {
            alert("Este usuário já possui um treino com esse nome.");
            return;
        }

        if (treinoEditandoId !== null) {

            const treino = usuarioSelecionado.treinos.find(
                item => item.id === treinoEditandoId
            );

            if (!treino) {
                alert("Treino não encontrado.");
                return;
            }

            treino.nome = nome;

        } else {

            usuarioSelecionado.treinos.push({
                id: Date.now(),
                nome: nome,
                exercicios: []
            });

        }

        document.getElementById("modalTreino").hidden = true;

        document.getElementById("formTreino").reset();

        treinoEditandoId = null;

        mostrarTreinosUsuario();
        atualizarPainel();

    }
);

// ==========================================
// CANCELAR FORMULÁRIO DE TREINO
// ==========================================

document.getElementById("btnCancelarTreino").addEventListener(
    "click",
    function () {

        document.getElementById("modalTreino").hidden = true;

        document.getElementById("formTreino").reset();

        treinoEditandoId = null;

    }
);

// ==========================================
// BOTÃO EDITAR USUARIO
// ==========================================

document.getElementById("btnEditarUsuario").addEventListener(
    "click",
    editarUsuario
);


// ==========================================
// BOTÃO BLOQUEAR USUARIO
// ==========================================

document.getElementById("btnBloquearUsuario").addEventListener(
    "click",
    function () {

        if (!usuarioSelecionado) return;

        if (usuarioSelecionado.status === "Bloqueado") {
            usuarioSelecionado.status = "Ativo";
        } else {
            usuarioSelecionado.status = "Bloqueado";
        }

        atualizarPainel();

        visualizarUsuario(usuarioSelecionado.id);

    }
);

// ==========================================
// BOTÃO EXCLUIR USUARIO
// ==========================================

document.getElementById("btnExcluirUsuario").addEventListener(
    "click",
    function () {

        if (!usuarioSelecionado) return;

        const confirmar = confirm(
            `Tem certeza que deseja excluir ${usuarioSelecionado.nome}?`
        );

        if (!confirmar) return;

        const idUsuario = usuarioSelecionado.id;

        const indiceUsuario = usuarios.findIndex(
            usuario => usuario.id === idUsuario
        );

        if (indiceUsuario !== -1) {
            usuarios.splice(indiceUsuario, 1);
        }

        usuarioSelecionado = null;

        atualizarPainel();

        navegar("usuarios");

        alert("Usuário excluído com sucesso!");

    }
);