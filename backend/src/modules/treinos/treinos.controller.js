const service = require("./treinos.service");

async function salvarTreino(req, res) {
    try {
        const resultado = await service.salvarTreino(req.body);

        return res.json({
            sucesso: true,
            mensagem: resultado.mensagem,
            data_treino: resultado.data_treino
        });
    } catch (erro) {
        console.error("Erro ao salvar treino:", erro);

        return res.status(erro.statusCode || 500).json({
            sucesso: false,
            mensagem: erro.statusCode
                ? erro.message
                : "Erro interno ao salvar o treino.",
            ...(erro.statusCode ? {} : { erro: erro.message })
        });
    }
}

async function buscarUltimoTreino(req, res) {
    try {
        const treino = req.params.treino;
        const exercicio = decodeURIComponent(req.params.exercicio);

        const resultado = await service.buscarUltimoTreino(treino, exercicio);

        return res.json(resultado);
    } catch (erro) {
        console.error("Erro ao buscar último treino:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar último treino.",
            erro: erro.message
        });
    }
}

async function buscarTodos(req, res) {
    try {
        const treinos = await service.buscarTodos();

        return res.json({
            sucesso: true,
            treinos
        });
    } catch (erro) {
        console.error("Erro ao buscar treinos:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar treinos.",
            erro: erro.message
        });
    }
}

async function testarConexao(req, res) {
    try {
        const resultado = await service.testarConexao();

        return res.json({
            sucesso: true,
            mensagem: "MySQL conectado com sucesso! 🗄️",
            resultado
        });
    } catch (erro) {
        console.error("Erro ao conectar no MySQL:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao conectar no MySQL.",
            erro: erro.message
        });
    }
}

module.exports = {
    salvarTreino,
    buscarUltimoTreino,
    buscarTodos,
    testarConexao
};
