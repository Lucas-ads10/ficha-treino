require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("");
    console.log("==========================================");
    console.log("   FICHA DE TREINO - BACKEND");
    console.log("==========================================");
    console.log("");
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log("");
    console.log("🗄️ MySQL configurado através do arquivo .env");
    console.log("");
});
