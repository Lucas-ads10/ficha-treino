const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();


// ======================================================
// CONFIGURAÇÕES
// ======================================================

app.use(cors());
app.use(express.json());


// ======================================================
// CONEXÃO COM MYSQL
// ======================================================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,

    ssl: {
        rejectUnauthorized: false
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// ======================================================
// TESTE DA API
// ======================================================

app.get("/", (req, res) => {

    res.json({

        sucesso: true,

        mensagem: "Backend da ficha de treino funcionando! 💪"

    });

});


// ======================================================
// TESTE DO MYSQL
// ======================================================

app.get("/teste-mysql", async (req, res) => {

    try {

        const [resultado] = await db.query(
            "SELECT 1 AS teste"
        );

        res.json({

            sucesso: true,

            mensagem: "MySQL conectado com sucesso! 🗄️",

            resultado: resultado

        });

    } catch (erro) {

        console.error(
            "Erro ao conectar no MySQL:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem: "Erro ao conectar no MySQL.",

            erro: erro.message

        });

    }

});


// ======================================================
// SALVAR TREINO
// ======================================================

app.post("/treinos", async (req, res) => {

    try {

        const {
            treino,
            exercicio,
            tipo,
            series,
            valor
        } = req.body;


        // --------------------------------------------------
        // VALIDAR TREINO
        // --------------------------------------------------

        if (!treino) {

            return res.status(400).json({

                sucesso: false,

                mensagem: "O treino não foi informado."

            });

        }


        // --------------------------------------------------
        // VALIDAR EXERCÍCIO
        // --------------------------------------------------

        if (!exercicio) {

            return res.status(400).json({

                sucesso: false,

                mensagem: "O exercício não foi informado."

            });

        }


        // --------------------------------------------------
        // DATA DO TREINO
        // --------------------------------------------------

        const dataTreino = new Date();


        // ==================================================
        // CARDIO
        // ==================================================

        if (tipo === "cardio") {

            if (!valor || Number(valor) <= 0) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem: "Informe o tempo do cardio."

                });

            }


            await db.query(

                `INSERT INTO treinos_realizados
                (
                    treino,
                    exercicio,
                    serie,
                    carga,
                    repeticoes,
                    valor_tempo,
                    data_treino
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,

                [

                    treino,

                    exercicio,

                    1,

                    null,

                    null,

                    Number(valor),

                    dataTreino

                ]

            );


            return res.json({

                sucesso: true,

                mensagem: "Cardio salvo com sucesso! 🏃",

                data_treino: dataTreino

            });

        }


        // ==================================================
        // EXERCÍCIO DE TEMPO
        // ==================================================

        if (tipo === "tempo") {

            if (
                !Array.isArray(series) ||
                series.length === 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem: "Nenhuma série de tempo foi enviada."

                });

            }


            for (
                let i = 0;
                i < series.length;
                i++
            ) {

                const serie = series[i];

                const valorTempo =
                    Number(serie.valor);


                if (valorTempo <= 0) {

                    return res.status(400).json({

                        sucesso: false,

                        mensagem:
                            `Valor inválido na Série ${i + 1}.`

                    });

                }


                await db.query(

                    `INSERT INTO treinos_realizados
                    (
                        treino,
                        exercicio,
                        serie,
                        carga,
                        repeticoes,
                        valor_tempo,
                        data_treino
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,

                    [

                        treino,

                        exercicio,

                        i + 1,

                        null,

                        null,

                        valorTempo,

                        dataTreino

                    ]

                );

            }


            return res.json({

                sucesso: true,

                mensagem: "Exercício de tempo salvo! ⏱️",

                data_treino: dataTreino

            });

        }


        // ==================================================
        // EXERCÍCIO NORMAL
        // ==================================================

        if (tipo === "normal") {

            if (
                !Array.isArray(series) ||
                series.length === 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem: "Nenhuma série foi enviada."

                });

            }


            for (
                let i = 0;
                i < series.length;
                i++
            ) {

                const serie = series[i];

                const carga =
                    Number(serie.carga);

                const repeticoes =
                    Number(serie.repeticoes);


                if (
                    carga <= 0 ||
                    repeticoes <= 0
                ) {

                    return res.status(400).json({

                        sucesso: false,

                        mensagem:
                            `Dados inválidos na Série ${i + 1}.`

                    });

                }


                await db.query(

                    `INSERT INTO treinos_realizados
                    (
                        treino,
                        exercicio,
                        serie,
                        carga,
                        repeticoes,
                        valor_tempo,
                        data_treino
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,

                    [

                        treino,

                        exercicio,

                        i + 1,

                        carga,

                        repeticoes,

                        null,

                        dataTreino

                    ]

                );

            }


            return res.json({

                sucesso: true,

                mensagem: "Treino salvo com sucesso! 💪",

                data_treino: dataTreino

            });

        }


        // ==================================================
        // TIPO INVÁLIDO
        // ==================================================

        return res.status(400).json({

            sucesso: false,

            mensagem: "Tipo de exercício inválido."

        });


    } catch (erro) {

        console.error(
            "Erro ao salvar treino:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem: "Erro interno ao salvar o treino.",

            erro: erro.message

        });

    }

});


// ======================================================
// BUSCAR ÚLTIMO TREINO
// ======================================================

app.get(
    "/ultimo-treino/:treino/:exercicio",
    async (req, res) => {

        try {

            const treino =
                req.params.treino;

            const exercicio =
                decodeURIComponent(
                    req.params.exercicio
                );


            const [resultado] =
                await db.query(

                    `SELECT
                        serie,
                        carga,
                        repeticoes,
                        valor_tempo,
                        data_treino
                    FROM treinos_realizados
                    WHERE treino = ?
                    AND exercicio = ?
                    AND data_treino = (
                        SELECT MAX(data_treino)
                        FROM treinos_realizados
                        WHERE treino = ?
                        AND exercicio = ?
                    )
                    ORDER BY serie ASC`,

                    [

                        treino,

                        exercicio,

                        treino,

                        exercicio

                    ]

                );


            // ------------------------------------------------
            // NENHUM TREINO ENCONTRADO
            // ------------------------------------------------

            if (resultado.length === 0) {

                return res.json({

                    sucesso: true,

                    encontrado: false,

                    treino: treino,

                    exercicio: exercicio,

                    data_treino: null,

                    series: []

                });

            }


            // ------------------------------------------------
            // TREINO ENCONTRADO
            // ------------------------------------------------

            res.json({

                sucesso: true,

                encontrado: true,

                treino: treino,

                exercicio: exercicio,

                data_treino:
                    resultado[0].data_treino,

                series: resultado

            });


        } catch (erro) {

            console.error(
                "Erro ao buscar último treino:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao buscar último treino.",

                erro: erro.message

            });

        }

    }
);


// ======================================================
// TESTAR BUSCA DOS TREINOS
// ======================================================

app.get("/treinos", async (req, res) => {

    try {

        const [resultado] = await db.query(

            `SELECT *
             FROM treinos_realizados
             ORDER BY data_treino DESC`

        );


        res.json({

            sucesso: true,

            treinos: resultado

        });


    } catch (erro) {

        console.error(erro);

        res.status(500).json({

            sucesso: false,

            mensagem: "Erro ao buscar treinos.",

            erro: erro.message

        });

    }

});


// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT = 3000;

app.listen(PORT, () => {

    console.log("");
    console.log("==========================================");
    console.log("   FICHA DE TREINO - BACKEND");
    console.log("==========================================");
    console.log("");
    console.log(
        `🚀 Servidor rodando em http://localhost:${PORT}`
    );
    console.log("");
    console.log(
        "🗄️ MySQL configurado através do arquivo .env"
    );
    console.log("");
});