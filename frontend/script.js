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
                nome: "Remada aberta",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Remada cavalinho",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Crucifixo inverso halter sentado",
                series: 3,
                repeticoes: "12 a 15"
            },

            {
                nome: "Leg press 45°",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Cadeira extensora",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Pallof press (isométrico)",
                series: 4,
                repeticoes: "30 segundos cada lado",
                tipo: "tempo"
            },

            {
                nome: "Panturrilha em pé",
                series: 4,
                repeticoes: "15 a 20"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "10 a 20 minutos",
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
                nome: "Supino inclinado",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Crucifixo reto",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Pull over",
                series: 3,
                repeticoes: "12 a 15"
            },

            {
                nome: "Cadeira abdutora",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Levantamento terra",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Oblíquo unilateral",
                series: 4,
                repeticoes: "12 cada lado"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "10 a 20 minutos",
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
                nome: "Desenvolvimento",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Elevação lateral",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Tríceps corda",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Rosca francesa na polia",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Mesa flexora",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Cadeira adutora",
                series: 3,
                repeticoes: "12 a 15 cada lado"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "10 a 20 minutos",
                tipo: "cardio"
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
                nome: "Agachamento",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Extensora unilateral",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Rosca direta banco inclinado",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Rosca martelo alternando",
                series: 4,
                repeticoes: "20 a 24"
            },

            {
                nome: "Panturrilha unilateral",
                series: 3,
                repeticoes: "12 cada lado"
            },

            {
                nome: "Prancha frontal",
                series: 4,
                repeticoes: "60 segundos",
                tipo: "tempo"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "10 a 20 minutos",
                tipo: "cardio"
            }

        ]

    },


    // ======================================
    // TREINO E
    // ======================================

    E: {

        nome: "Treino E",

        exercicios: [

            {
                nome: "Puxada aberta",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Puxada neutra",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Crucifixo polia alta",
                series: 4,
                repeticoes: "10 a 12"
            },

            {
                nome: "Elevação lateral",
                series: 3,
                repeticoes: "12 a 15"
            },

            {
                nome: "Facepull",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Encolhimento com barra por trás",
                series: 4,
                repeticoes: "12 a 15"
            },

            {
                nome: "Cardio bike ou esteira",
                series: 1,
                repeticoes: "10 a 20 minutos",
                tipo: "cardio"
            }

        ]

    }

};


// ==========================================
// CONFIGURAÇÃO DO BACKEND
// ==========================================

const API_URL = "http://localhost:3000";


// ==========================================
// VARIÁVEIS
// ==========================================

let treinoSelecionado = "A";

let exercicioSelecionado = null;


// Guarda o último treino carregado do MySQL
let ultimoTreinoAtual = null;


// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const botoesTreino =
    document.querySelectorAll(
        ".botao-treino"
    );


const listaExercicios =
    document.getElementById(
        "listaExercicios"
    );


const tituloTreino =
    document.getElementById(
        "tituloTreino"
    );


const descricaoTreino =
    document.getElementById(
        "descricaoTreino"
    );


// ==========================================
// BOTÕES A, B, C, D, E
// ==========================================

botoesTreino.forEach(
    function (botao) {

        botao.addEventListener(
            "click",
            function () {

                treinoSelecionado =
                    botao.dataset.treino;

                exercicioSelecionado =
                    null;

                ultimoTreinoAtual =
                    null;


                botoesTreino.forEach(
                    function (botaoAtual) {

                        botaoAtual.classList.remove(
                            "ativo"
                        );

                    }
                );


                botao.classList.add(
                    "ativo"
                );


                mostrarListaExercicios();

            }
        );

    }
);


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


    return dataObj.toLocaleDateString(
        "pt-BR"
    );

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


        if (
            !dados.sucesso
        ) {

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
        ficha[
            treinoSelecionado
        ];


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

                // EXERCÍCIO NORMAL

                if (
                    !exercicio.tipo
                ) {

                    const primeiraSerie =
                        dados.series[0];


                    textoUltimo =
                        `${primeiraSerie.carga} kg × ` +
                        `${primeiraSerie.repeticoes} reps`;

                }


                // EXERCÍCIO DE TEMPO

                else if (
                    exercicio.tipo === "tempo"
                ) {

                    const primeiraSerie =
                        dados.series[0];


                    textoUltimo =
                        `${primeiraSerie.valor_tempo} segundos`;

                }


                // CARDIO

                else if (
                    exercicio.tipo === "cardio"
                ) {

                    const primeiraSerie =
                        dados.series[0];


                    textoUltimo =
                        `${primeiraSerie.valor_tempo} minutos`;

                }


                // DATA

                if (
                    dados.data_treino
                ) {

                    dataUltimo =
                        `📅 Último treino: ` +
                        `${formatarData(dados.data_treino)}`;

                }

            }


            // ==================================
            // CRIAR ITEM
            // ==================================

            const item =
                document.createElement(
                    "div"
                );


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

                    abrirExercicio(
                        index
                    );

                }
            );


            listaExercicios.appendChild(
                item
            );

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
        document.createElement(
            "div"
        );


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

        // DATA

        if (
            dados.data_treino
        ) {

            html += `

                <div class="data-ultimo-treino">

                    📅 Realizado em
                    ${formatarData(dados.data_treino)}

                </div>

            `;

        }


        // ==================================
        // EXERCÍCIO NORMAL
        // ==================================

        if (
            !exercicio.tipo
        ) {

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
        .getElementById(
            "voltarLista"
        )
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
        .getElementById(
            "salvarExercicio"
        )
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


            const valor =
                Number(
                    campo.value
                );


            if (
                !valor ||
                valor <= 0
            ) {

                alert(
                    "Digite quantos minutos você fez."
                );

                return;

            }


            dadosEnviar.valor =
                valor;

        }


        // ==================================
        // TEMPO
        // ==================================

        else if (
            exercicio.tipo === "tempo"
        ) {

            const campos =
                document.querySelectorAll(
                    ".tempo-atual"
                );


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
                    !carga ||
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
        // ENVIAR PARA O NODE.JS
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


        const resultado =
            await resposta.json();


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
            "Exercício salvo no MySQL! 💪"
        );


        exercicioSelecionado =
            null;


        ultimoTreinoAtual =
            null;


        // Atualizar a lista
        await mostrarListaExercicios();


    } catch (erro) {

        console.error(
            "Erro ao salvar:",
            erro
        );


        alert(

            "Não foi possível salvar o treino.\n\n" +
            "Verifique se o servidor Node.js está rodando.\n\n" +
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