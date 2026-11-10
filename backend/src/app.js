const express = require("express");
const cors = require("cors");
const treinosModule = require("./modules/treinos/treinos.module");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        sucesso: true,
        mensagem: "Backend da ficha de treino funcionando! 💪"
    });
});

app.use("/", treinosModule);

module.exports = app;
