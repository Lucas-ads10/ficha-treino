
// ==========================================
// CONFIGURAÇÃO DO BACKEND
// ==========================================

const API_URL = window.CAVERNA_CONFIG.API_URL;


// ==========================================
// VARIÁVEIS
// ==========================================

let ficha = null;
let treinoSelecionado = null;

let exercicioSelecionado = null;

let ultimoTreinoAtual = null;


// ==========================================
// PROTEGER DADOS INSERIDOS NO HTML
// ==========================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, function (caractere) {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caractere];
    });
}


// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const botoesTreino =
    document.getElementById("botoesTreino");

const listaExercicios =
    document.getElementById("listaExercicios");

const tituloTreino =
    document.getElementById("tituloTreino");

const descricaoTreino =
    document.getElementById("descricaoTreino");


// ==========================================
// BOTÕES DINÂMICOS DOS TREINOS
// ==========================================

function criarBotoesTreino() {
    botoesTreino.innerHTML = "";

    if (!ficha || !Array.isArray(ficha.treinos)) {
        return;
    }

    ficha.treinos.forEach(function (treino, index) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "botao-treino";
        botao.dataset.treino = String(index);
        botao.textContent = treino.nome;

        botao.addEventListener("click", function () {
            treinoSelecionado = String(index);
            exercicioSelecionado = null;
            ultimoTreinoAtual = null;

            botoesTreino.querySelectorAll(".botao-treino")
                .forEach(function (botaoAtual) {
                    botaoAtual.classList.remove("ativo");
                });

            botao.classList.add("ativo");

            mostrarListaExercicios();
        });

        botoesTreino.appendChild(botao);
    });
}


// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    if (!data) {

        return "";

    }


    const dataObj =
        new Date(data);


    if (isNaN(dataObj.getTime())) {

        return "";

    }


    return dataObj.toLocaleDateString("pt-BR");

}


// ==========================================
// BUSCAR ÚLTIMO TREINO NO MYSQL
// ==========================================

async function buscarUltimoTreino(
    treino,
    exercicio
) {

    try {

        const url =
            `${API_URL}/ultimo-treino/` +
            `${encodeURIComponent(treino)}/` +
            `${encodeURIComponent(exercicio)}`;


        const resposta =
            await fetch(url, {
                method: "GET",
                credentials: "include"
            });


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP: ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            throw new Error(
                dados.mensagem ||
                "Erro ao buscar treino."
            );

        }


        return dados;

    } catch (erro) {

        console.error(
            "Erro ao buscar último treino:",
            erro
        );


        return {

            sucesso: false,

            encontrado: false,

            series: [],

            data_treino: null

        };

    }

}


// ==========================================
// MOSTRAR LISTA DE EXERCÍCIOS
// ==========================================

async function mostrarListaExercicios() {

    const treino =
        ficha?.treinos?.[Number(treinoSelecionado)];

    if (!treino) {

        console.error(
            "Treino não encontrado:",
            treinoSelecionado
        );

        return;

    }


    tituloTreino.textContent =
        treino.nome;


    descricaoTreino.textContent =
        "Escolha o exercício que você vai fazer";


    listaExercicios.innerHTML = `

        <div class="carregando">

            Carregando seus últimos treinos...

        </div>

    `;


    // ======================================
    // BUSCAR TODOS OS ÚLTIMOS TREINOS
    // ======================================

    const resultados =
        await Promise.all(

            treino.exercicios.map(
                async function (exercicio) {

                    const dados =
                        await buscarUltimoTreino(

                            treinoSelecionado,

                            exercicio.nome

                        );


                    return {

                        exercicio:
                            exercicio,

                        dados:
                            dados

                    };

                }

            )

        );


    listaExercicios.innerHTML = "";


    resultados.forEach(
        function (resultado, index) {

            const exercicio =
                resultado.exercicio;


            const dados =
                resultado.dados;


            let textoUltimo =
                "Ainda não realizado";


            let dataUltimo =
                "";


            // ==================================
            // EXISTE TREINO ANTERIOR
            // ==================================

            if (
                dados &&
                dados.encontrado &&
                dados.series &&
                dados.series.length > 0
            ) {


                // ==================================
                // EXERCÍCIO NORMAL
                // ==================================

                if (!exercicio.tipo) {

                    const primeiraSerie =
                        dados.series[0];


                    textoUltimo =
                        `${primeiraSerie.carga} kg × ` +
                        `${primeiraSerie.repeticoes} reps`;

                }


                // ==================================
                // EXERCÍCIO DE TEMPO
                // ==================================

                else if (
                    exercicio.tipo === "tempo"
                ) {

                    const primeiraSerie =
                        dados.series[0];


                    textoUltimo =
                        `${primeiraSerie.valor_tempo} segundos`;

                }


                // ==================================
                // CARDIO
                // ==================================

                else if (
                    exercicio.tipo === "cardio"
                ) {

                    const primeiraSerie =
                        dados.series[0];


                    textoUltimo =
                        `${primeiraSerie.valor_tempo} minutos`;

                }


                // ==================================
                // DATA
                // ==================================

                if (dados.data_treino) {

                    dataUltimo =
                        `📅 Último treino: ` +
                        `${formatarData(
                            dados.data_treino
                        )}`;

                }

            }


            // ==================================
            // CRIAR ITEM
            // ==================================

            const item = document.createElement("div");
            item.classList.add("item-exercicio");

            const info = document.createElement("div");
            info.classList.add("info-item");

            const nome = document.createElement("strong");
            nome.textContent = exercicio.nome;

            const detalhes = document.createElement("span");
            detalhes.textContent =
                `${exercicio.series} séries • ${exercicio.repeticoes}`;

            const ultimo = document.createElement("small");
            ultimo.textContent = `Último: ${textoUltimo}`;

            info.appendChild(nome);
            info.appendChild(detalhes);
            info.appendChild(ultimo);

            if (dataUltimo) {
                const data = document.createElement("small");
                data.textContent = dataUltimo;
                info.appendChild(data);
            }

            const seta = document.createElement("div");
            seta.classList.add("seta");
            seta.textContent = "›";

            item.appendChild(info);
            item.appendChild(seta);


            // ==================================
            // CLICAR NO EXERCÍCIO
            // ==================================

            item.addEventListener(
                "click",
                function () {

                    abrirExercicio(index);

                }
            );


            listaExercicios.appendChild(item);

        }

    );

}


// ==========================================
// ABRIR EXERCÍCIO
// ==========================================

async function abrirExercicio(index) {

    exercicioSelecionado =
        index;


    const treino =
        ficha?.treinos?.[Number(treinoSelecionado)];

    const exercicio =
        treino?.exercicios?.[index];

    if (!exercicio) {
        console.error("Exercício não encontrado:", index);
        return;
    }


    // ======================================
    // MOSTRAR CARREGANDO
    // ======================================

    tituloTreino.textContent =
        exercicio.nome;


    descricaoTreino.textContent =
        `${exercicio.series} séries • ` +
        `${exercicio.repeticoes}`;


    listaExercicios.innerHTML = `

        <div class="carregando">

            Buscando seu último treino...

        </div>

    `;


    // ======================================
    // BUSCAR NO MYSQL
    // ======================================

    const dados =
        await buscarUltimoTreino(
            treino.nome,
            exercicio.nome
        );


    ultimoTreinoAtual =
        dados;


    mostrarExercicio(
        exercicio,
        index,
        dados
    );

}


// ==========================================
// MOSTRAR EXERCÍCIO
// ==========================================

function mostrarExercicio(
    exercicio,
    index,
    dados
) {

    tituloTreino.textContent =
        exercicio.nome;


    descricaoTreino.textContent =
        `${exercicio.series} séries • ` +
        `${exercicio.repeticoes}`;


    listaExercicios.innerHTML = "";


    const card =
        document.createElement("div");


    card.classList.add(
        "exercicio-detalhes"
    );


    // ======================================
    // BOTÃO VOLTAR
    // ======================================

    let html = `

        <button
            class="botao-voltar"
            id="voltarLista"
        >
            ← Voltar para exercícios
        </button>

    `;


    // ======================================
    // ÚLTIMO TREINO
    // ======================================

    html += `

        <div class="ultimo-detalhes">

            <h3>
                📋 Último treino
            </h3>

    `;


    // ======================================
    // SEM TREINO ANTERIOR
    // ======================================

    if (
        !dados ||
        !dados.encontrado ||
        !dados.series ||
        dados.series.length === 0
    ) {

        html += `

            <p class="sem-dados">

                Você ainda não registrou
                esse exercício.

            </p>

        `;

    }


    // ======================================
    // EXISTE TREINO ANTERIOR
    // ======================================

    else {

        // ==================================
        // DATA
        // ==================================

        if (dados.data_treino) {

            html += `

                <div class="data-ultimo-treino">

                    📅 Realizado em
                   ${escaparHTML(formatarData(dados.data_treino))}

                </div>

            `;

        }


        // ==================================
        // EXERCÍCIO NORMAL
        // ==================================

        if (!exercicio.tipo) {

            dados.series.forEach(
                function (serie, i) {

                    html += `

                        <div class="linha-ultimo">

                            <span>
                                Série ${i + 1}
                            </span>

                            <strong>
                                ${escaparHTML(serie.carga)} kg ×
                                ${escaparHTML(serie.repeticoes)} reps
                            </strong>

                        </div>

                    `;

                }
            );

        }


        // ==================================
        // EXERCÍCIO DE TEMPO
        // ==================================

        else if (
            exercicio.tipo === "tempo"
        ) {

            dados.series.forEach(
                function (serie, i) {

                    html += `

                        <div class="linha-ultimo">

                            <span>
                                Série ${i + 1}
                            </span>

                            <strong>
                                ${escaparHTML(serie.valor_tempo)}
                                segundos
                            </strong>

                        </div>

                    `;

                }
            );

        }


        // ==================================
        // CARDIO
        // ==================================

        else if (
            exercicio.tipo === "cardio"
        ) {

            const serie =
                dados.series[0];


            html += `

                <div class="linha-ultimo">

                    <span>
                        Cardio
                    </span>

                    <strong>
                        ${escaparHTML(serie.valor_tempo)}
                         minutos
                    </strong>

                </div>

            `;

        }

    }


    html += `

        </div>

    `;


    // ======================================
    // TREINO ATUAL
    // ======================================

    html += `

        <div class="treino-atual-detalhes">

            <h3>
                🏋️ Treino atual
            </h3>

    `;


    // ======================================
    // CARDIO
    // ======================================

    if (
        exercicio.tipo === "cardio"
    ) {

        html += `

            <div class="campo-grande">

                <label>
                    Quantos minutos?
                </label>

                <input
                    type="number"
                    id="cardioAtual"
                    placeholder="Ex: 20"
                    min="1"
                    step="1"
                >

            </div>

        `;

    }


    // ======================================
    // EXERCÍCIO DE TEMPO
    // ======================================

    else if (
        exercicio.tipo === "tempo"
    ) {

        for (
            let i = 0;
            i < exercicio.series;
            i++
        ) {

            html += `

                <div class="linha-atual">

                    <strong>
                        Série ${i + 1}
                    </strong>

                    <input
                        type="number"
                        class="tempo-atual"
                        data-serie="${i}"
                        placeholder="Segundos"
                        min="1"
                        step="1"
                    >

                </div>

            `;

        }

    }


    // ======================================
    // EXERCÍCIO NORMAL
    // ======================================

    else {

        for (
            let i = 0;
            i < exercicio.series;
            i++
        ) {

            html += `

                <div class="linha-atual">

                    <strong>
                        Série ${i + 1}
                    </strong>

                    <input
                        type="number"
                        class="carga-atual"
                        data-serie="${i}"
                        placeholder="Carga (kg)"
                        step="0.5"
                        min="0"
                    >

                    <input
                        type="number"
                        class="reps-atual"
                        data-serie="${i}"
                        placeholder="Repetições"
                        min="1"
                    >

                </div>

            `;

        }

    }


    // ======================================
    // BOTÃO SALVAR
    // ======================================

    html += `

            <button
                class="botao-salvar-detalhes"
                id="salvarExercicio"
            >
                Salvar exercício
            </button>

        </div>

    `;


    card.innerHTML =
        html;


    listaExercicios.appendChild(
        card
    );


    // ======================================
    // BOTÃO VOLTAR
    // ======================================

    document
        .getElementById("voltarLista")
        .addEventListener(
            "click",
            function () {

                exercicioSelecionado =
                    null;

                ultimoTreinoAtual =
                    null;

                mostrarListaExercicios();

            }
        );


    // ======================================
    // BOTÃO SALVAR
    // ======================================

    document
        .getElementById("salvarExercicio")
        .addEventListener(
            "click",
            function () {

                salvarExercicio(
                    exercicio,
                    index
                );

            }
        );

}


// ==========================================
// SALVAR EXERCÍCIO NO MYSQL
// ==========================================

async function salvarExercicio(
    exercicio,
    index
) {

    const botao =
        document.getElementById(
            "salvarExercicio"
        );




    // ======================================
    // DESABILITAR BOTÃO
    // ======================================

    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "Salvando...";

    }


    try {

        const treinoAtual =
            ficha?.treinos?.[Number(treinoSelecionado)];

        if (!treinoAtual) {
            throw new Error("Treino selecionado não encontrado.");
        }

        // ==================================
        // DADOS BÁSICOS
        // ==================================

        let dadosEnviar = {

            treino:
                treinoAtual.nome,

            exercicio:
                exercicio.nome,

            tipo:
                exercicio.tipo ||
                "normal"

        };


        // ==================================
        // CARDIO
        // ==================================

        if (
            exercicio.tipo === "cardio"
        ) {

            const campo =
                document.getElementById(
                    "cardioAtual"
                );


            if (!campo) {

                throw new Error(
                    "Campo do cardio não encontrado."
                );

            }


            const valor =
                Number(campo.value);


            if (
                !valor ||
                valor <= 0
            ) {

                alert(
                    "Digite quantos minutos você fez."
                );

                return;

            }


            // IMPORTANTE:
            // O server.js espera "valor"
            // diretamente no objeto.

            dadosEnviar.valor =
                valor;

        }


        // ==================================
        // EXERCÍCIO DE TEMPO
        // ==================================

        else if (
            exercicio.tipo === "tempo"
        ) {

            const campos =
                document.querySelectorAll(
                    ".tempo-atual"
                );


            if (
                campos.length !==
                exercicio.series
            ) {

                throw new Error(
                    "Quantidade de campos de tempo inválida."
                );

            }


            const series = [];


            for (
                let i = 0;
                i < campos.length;
                i++
            ) {

                const valor =
                    Number(
                        campos[i].value
                    );


                if (
                    !valor ||
                    valor <= 0
                ) {

                    alert(
                        `Preencha a Série ${i + 1}.`
                    );

                    return;

                }


                // IMPORTANTE:
                // O server.js espera "valor"
                // e não "valor_tempo".

                series.push({

                    valor:
                        valor

                });

            }


            dadosEnviar.series =
                series;

        }


        // ==================================
        // EXERCÍCIO NORMAL
        // ==================================

        else {

            const cargas =
                document.querySelectorAll(
                    ".carga-atual"
                );


            const reps =
                document.querySelectorAll(
                    ".reps-atual"
                );


            if (
                cargas.length !==
                exercicio.series ||
                reps.length !==
                exercicio.series
            ) {

                throw new Error(
                    "Quantidade de campos inválida."
                );

            }


            const series = [];


            for (
                let i = 0;
                i < cargas.length;
                i++
            ) {

                const carga =
                    Number(
                        cargas[i].value
                    );


                const repeticoes =
                    Number(
                        reps[i].value
                    );


                if (
                    carga <= 0 ||
                    !repeticoes ||
                    repeticoes <= 0
                ) {

                    alert(
                        `Preencha a Série ${i + 1}.`
                    );

                    return;

                }


                series.push({

                    carga:
                        carga,

                    repeticoes:
                        repeticoes

                });

            }


            dadosEnviar.series =
                series;

        }


        // ==================================
        // MOSTRAR O QUE SERÁ ENVIADO
        // ==================================

        console.log(
            "Dados enviados para o servidor:",
            dadosEnviar
        );


        // ==================================
        // ENVIAR PARA NODE.JS
        // ==================================

        const resposta =
            await fetch(

                `${API_URL}/treinos`,

                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                    },

                    credentials: "include",

                    body:
                        JSON.stringify(
                            dadosEnviar
                        )

                }

            );


        // ==================================
        // LER RESPOSTA
        // ==================================

        let resultado;


        try {

            resultado =
                await resposta.json();

        } catch (erroJson) {

            throw new Error(
                "O servidor não retornou uma resposta válida."
            );

        }


        // ==================================
        // ERRO DA API
        // ==================================

        if (
            !resposta.ok ||
            !resultado.sucesso
        ) {

            throw new Error(

                resultado.mensagem ||
                "Não foi possível salvar o treino."

            );

        }


        // ==================================
        // SUCESSO
        // ==================================

        alert(
            resultado.mensagem ||
            "Exercício salvo no MySQL! 💪"
        );


        exercicioSelecionado =
            null;


        ultimoTreinoAtual =
            null;


        // ==================================
        // ATUALIZAR LISTA
        // ==================================

        await mostrarListaExercicios();


    } catch (erro) {

        console.error(
            "Erro ao salvar:",
            erro
        );


        alert(

            "Não foi possível salvar o treino.\n\n" +
            "Verifique se o servidor Node.js está online.\n\n" +
            erro.message

        );

    } finally {

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                "Salvar exercício";

        }

    }

}


// ==========================================
// AUTENTICAÇÃO E INICIALIZAÇÃO
// ==========================================

let csrfToken = null;

async function iniciarFichaAluno() {

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

        if (dados.usuario.perfil !== "ALUNO") {
            window.location.replace("../login/");
            return;
        }

        if (dados.usuario.deveTrocarSenha) {
            window.location.replace("../login/");
            return;
        }

        csrfToken = dados.csrfToken;

        // Buscar a ficha do aluno autenticado
        const respostaFicha = await fetch(`${API_URL}/me/ficha`, {
            method: "GET",
            credentials: "include"
        });

        if (!respostaFicha.ok) {
            throw new Error("Não foi possível carregar sua ficha.");
        }

        const dadosFicha = await respostaFicha.json();

        ficha = dadosFicha.ficha;

        document.querySelector(".cabecalho").hidden = false;
        document.querySelector("main.container").hidden = false;

        if (!ficha || !Array.isArray(ficha.treinos) || ficha.treinos.length === 0) {
            tituloTreino.textContent = "Ficha não cadastrada";
            descricaoTreino.textContent = "Entre em contato com o administrador.";
            listaExercicios.innerHTML = "";
            return;
        }

        // Criar os botões conforme as divisões da ficha
        criarBotoesTreino();

        treinoSelecionado = "0";

        const primeiroBotao = botoesTreino.querySelector(".botao-treino");

        if (primeiroBotao) {
            primeiroBotao.classList.add("ativo");
        }

        await mostrarListaExercicios();


    } catch (erro) {

        console.error("Erro ao verificar sessão:", erro);

        window.location.replace("../login/");

    }

}

iniciarFichaAluno();

// ALTERNAR TEMA CLARO E ESCURO DA FICHA

const botaoTemaFicha = document.getElementById("alternarTemaFicha");

// Recupera o tema salvo
const temaSalvo = localStorage.getItem("temaFicha");

if (temaSalvo === "claro") {
    document.body.classList.add("tema-claro");
}

function atualizarBotaoTema() {
    const temaClaro = document.body.classList.contains("tema-claro");

    botaoTemaFicha.setAttribute(
        "aria-label",
        temaClaro ? "Ativar tema escuro" : "Ativar tema claro"
    );
}

atualizarBotaoTema();

botaoTemaFicha.addEventListener("click", function () {

    document.body.classList.toggle("tema-claro");

    const temaClaro = document.body.classList.contains("tema-claro");

    localStorage.setItem(
        "temaFicha",
        temaClaro ? "claro" : "escuro"
    );

    atualizarBotaoTema();
});
