
const express = require("express");
const controller = require("./treinos.controller");

const router = express.Router();

// Salvar treino
router.post("/treinos", controller.salvarTreino);

// Listar treinos
router.get("/treinos", controller.buscarTodos);

// Buscar último treino
router.get(
    "/ultimo-treino/:treino/:exercicio",
    controller.buscarUltimoTreino
);

// Testar conexão MySQL
router.get("/teste-mysql", controller.testarConexao);

module.exports = router;