require("dotenv").config();

const express = require("express");
const cors = require("cors");

const adminRoutes = require("./routes/admin.routes");
const usuarioRoutes = require("./routes/usuario.routes");
const especieRoutes = require("./routes/especie.routes");
const plantaRoutes = require("./routes/planta.routes");
const entradaRoutes = require("./routes/entradaDiario.routes");
const adocaoRoutes = require("./routes/adocao.routes");
const amizadeRoutes = require("./routes/amizade.routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const origensPermitidas = [
  "http://localhost:5173",
  "http://localhost:5174",       
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",     
  process.env.FRONTEND_URL,
  "https://brotouapp.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: origensPermitidas,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    api: "Brotou API",
    versao: "1.0.0",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/admins", adminRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/especies", especieRoutes);
app.use("/plantas", plantaRoutes);
app.use("/entradas", entradaRoutes);
app.use("/adocoes", adocaoRoutes);
app.use("/amizades", amizadeRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "erro",
    mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

module.exports = app;
