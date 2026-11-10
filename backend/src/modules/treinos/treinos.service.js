const repository = require("./treinos.repository");

function erroValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.statusCode = 400;
    throw erro;
}

async function salvarTreino(dados) {
    const { treino, exercicio, tipo, series, valor } = dados;

    if (!treino) {
        erroValidacao("O treino não foi informado.");
    }

    if (!exercicio) {
        erroValidacao("O exercício não foi informado.");
    }

    const dataTreino = new Date();

    if (tipo === "cardio") {
        if (!valor || Number(valor) <= 0) {
            erroValidacao("Informe o tempo do cardio.");
        }

        await repository.salvarCardio({
            treino, exercicio, valor, dataTreino
        });

        return {
            mensagem: "Cardio salvo com sucesso! 🏃",
            data_treino: dataTreino
        };
    }

    if (tipo === "tempo") {
        if (!Array.isArray(series) || series.length === 0) {
            erroValidacao("Nenhuma série de tempo foi enviada.");
        }

        for (let i = 0; i < series.length; i++) {
            const valorTempo = Number(series[i]?.valor);

            if (!Number.isFinite(valorTempo) || valorTempo <= 0) {
                erroValidacao(`Valor inválido na Série ${i + 1}.`);
            }
        }

        await repository.salvarSeriesTempo({
            treino, exercicio, series, dataTreino
        });

        return {
            mensagem: "Exercício de tempo salvo! ⏱️",
            data_treino: dataTreino
        };
    }

    if (tipo === "normal") {
        if (!Array.isArray(series) || series.length === 0) {
            erroValidacao("Nenhuma série foi enviada.");
        }

        for (let i = 0; i < series.length; i++) {
            const carga = Number(series[i]?.carga);
            const repeticoes = Number(series[i]?.repeticoes);

            if (
                !Number.isFinite(carga) || carga <= 0 ||
                !Number.isFinite(repeticoes) || repeticoes <= 0
            ) {
                erroValidacao(`Dados inválidos na Série ${i + 1}.`);
            }
        }

        await repository.salvarSeriesNormais({
            treino, exercicio, series, dataTreino
        });

        return {
            mensagem: "Treino salvo com sucesso! 💪",
            data_treino: dataTreino
        };
    }

    erroValidacao("Tipo de exercício inválido.");
}

async function buscarUltimoTreino(treino, exercicio) {
    const series = await repository.buscarUltimoTreino(treino, exercicio);

    if (series.length === 0) {
        return {
            sucesso: true,
            encontrado: false,
            treino,
            exercicio,
            data_treino: null,
            series: []
        };
    }

    return {
        sucesso: true,
        encontrado: true,
        treino,
        exercicio,
        data_treino: series[0].data_treino,
        series
    };
}

async function buscarTodos() {
    return repository.buscarTodos();
}

async function testarConexao() {
    return repository.testarConexao();
}

module.exports = {
    salvarTreino,
    buscarUltimoTreino,
    buscarTodos,
    testarConexao
};
