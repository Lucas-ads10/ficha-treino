const db = require("../../config/database");

async function salvarCardio({ treino, exercicio, valor, dataTreino }) {
    await db.query(
        `INSERT INTO treinos_realizados
        (
            treino, exercicio, serie, carga,
            repeticoes, valor_tempo, data_treino
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [treino, exercicio, 1, null, null, Number(valor), dataTreino]
    );
}

async function salvarSeriesTempo({ treino, exercicio, series, dataTreino }) {
    for (let i = 0; i < series.length; i++) {
        await db.query(
            `INSERT INTO treinos_realizados
            (
                treino, exercicio, serie, carga,
                repeticoes, valor_tempo, data_treino
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [treino, exercicio, i + 1, null, null, Number(series[i].valor), dataTreino]
        );
    }
}

async function salvarSeriesNormais({ treino, exercicio, series, dataTreino }) {
    for (let i = 0; i < series.length; i++) {
        await db.query(
            `INSERT INTO treinos_realizados
            (
                treino, exercicio, serie, carga,
                repeticoes, valor_tempo, data_treino
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                treino,
                exercicio,
                i + 1,
                Number(series[i].carga),
                Number(series[i].repeticoes),
                null,
                dataTreino
            ]
        );
    }
}

async function buscarUltimoTreino(treino, exercicio) {
    const [resultado] = await db.query(
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
        [treino, exercicio, treino, exercicio]
    );

    return resultado;
}

async function buscarTodos() {
    const [resultado] = await db.query(
        `SELECT *
         FROM treinos_realizados
         ORDER BY data_treino DESC`
    );

    return resultado;
}

async function testarConexao() {
    const [resultado] = await db.query("SELECT 1 AS teste");
    return resultado;
}

module.exports = {
    salvarCardio,
    salvarSeriesTempo,
    salvarSeriesNormais,
    buscarUltimoTreino,
    buscarTodos,
    testarConexao
};
