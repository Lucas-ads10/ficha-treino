// ==========================================
// FICHA DE TREINO
// ==========================================

const ficha = {

    // ======================================
    // TREINO A
    // ======================================

    A: {

        nome: "Treino A",

        exercicios: [

            {
                nome: "Cadeira adutora (isometria em alongamento)",
                series: 3,
                repeticoes: "25 segundos",
                tipo: "tempo"
            },

            {
                nome: "Búlgaro",
                series: 3,
                repeticoes: "12 a 15 cada lado"
            },

            {
                nome: "Cadeira flexora",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Supino reto barra",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Desenvolvimento militar",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Pallof press",
                series: 3,
                repeticoes: "45 segundos cada lado",
                tipo: "tempo"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "20 a 30 minutos",
                tipo: "cardio"
            }

        ]

    },


    // ======================================
    // TREINO B
    // ======================================

    B: {

        nome: "Treino B",

        exercicios: [

            {
                nome: "Leg press",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Passada afundo",
                series: 3,
                repeticoes: "24 a 30 passos"
            },

            {
                nome: "Cadeira abdutora",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Remada curvada",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Puxada supinada",
                series: 4,
                repeticoes: "20 a 24"
            },

            {
                nome: "Deadbug elastico",
                series: 3,
                repeticoes: "15 cada lado"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "20 a 30 minutos",
                tipo: "cardio"
            }

        ]

    },


    // ======================================
    // TREINO C
    // ======================================

    C: {

        nome: "Treino C",

        exercicios: [

            {
                nome: "Cadeira adutora (isometria em alongamento)",
                series: 3,
                repeticoes: "25 segundos",
                tipo: "tempo"
            },

            {
                nome: "Elevação pélvica",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Levantamento terra",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Hang clean and jerk",
                series: 3,
                repeticoes: "15 a 18"
            },

            {
                nome: "Rosca direta",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Triceps frances polia",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Prancha",
                series: 4,
                repeticoes: "60 a 90 segundos",
                tipo: "tempo"
            }

        ]

    },


    // ======================================
    // TREINO D
    // ======================================

    D: {

        nome: "Treino D",

        exercicios: [

            {
                nome: "Agachamento zercher",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Mesa flexora",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Supino reto halteres",
                series: 4,
                repeticoes: "2x 12 a 15 preparatórias + 2x 6 a 8 válidas (força)"
            },

            {
                nome: "Push press halteres",
                series: 3,
                repeticoes: "18 a 20"
            },

            {
                nome: "Apoio Flexoes com carga",
                series: 4,
                repeticoes: "Até a falha"
            },

            {
                nome: "Bird dog em posição de prancha alta",
                series: 3,
                repeticoes: "10 cada lado"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "20 a 30 minutos",
                tipo: "cardio"
            }

        ]

    }

};


// ==========================================
// CONFIGURAÇÃO DO BACKEND
// ==========================================

// Se estiver testando o server.js LOCALMENTE:
// const API_URL = "http://localhost:3000";

// Se estiver usando o backend publicado no Render:
const API_URL = "https://ficha-treino.onrender.com";


// ==========================================
// VARIÁVEIS
// ==========================================

let treinoSelecionado = "A";

let exercicioSelecionado = null;

let ultimoTreinoAtual = null;


// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const botoesTreino =
    document.querySelectorAll(".botao-treino");

const listaExercicios =
    document.getElementById("listaExercicios");

const tituloTreino =
    document.getElementById("tituloTreino");

const descricaoTreino =
    document.getElementById("descricaoTreino");


// ==========================================
// BOTÕES A, B, C, D
// ==========================================

botoesTreino.forEach(function (botao) {

    botao.addEventListener("click", function () {

        treinoSelecionado =
            botao.dataset.treino;

        exercicioSelecionado = null;

        ultimoTreinoAtual = null;


        botoesTreino.forEach(function (botaoAtual) {

            botaoAtual.classList.remove("ativo");

        });


        botao.classList.add("ativo");


        mostrarListaExercicios();

    });

});


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
            await fetch(url);


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
        ficha[treinoSelecionado];


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

            const item =
                document.createElement("div");


            item.classList.add(
                "item-exercicio"
            );


            item.innerHTML = `

                <div class="info-item">

                    <strong>
                        ${exercicio.nome}
                    </strong>

                    <span>
                        ${exercicio.series}
                        séries •
                        ${exercicio.repeticoes}
                    </span>

                    <small>
                        Último:
                        ${textoUltimo}
                    </small>

                    ${
                        dataUltimo
                            ? `<small>${dataUltimo}</small>`
                            : ""
                    }

                </div>


                <div class="seta">
                    ›
                </div>

            `;


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


    const exercicio =
        ficha[
            treinoSelecionado
        ].exercicios[index];


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

            treinoSelecionado,

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
                    ${formatarData(
                        dados.data_treino
                    )}

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
                                ${serie.carga} kg ×
                                ${serie.repeticoes} reps
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
                                ${serie.valor_tempo}
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
                        ${serie.valor_tempo}
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

        // ==================================
        // DADOS BÁSICOS
        // ==================================

        let dadosEnviar = {

            treino:
                treinoSelecionado,

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

                        "Content-Type":
                            "application/json"

                    },

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
// INICIAR SITE
// ==========================================

mostrarListaExercicios();

