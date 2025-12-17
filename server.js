'use strict';

const express = require("express");
const acquireRoutes = require("./routes/acquireRoutes");
const connectMongo = require("./mongo");

const PORT = process.env.ACQUIRE_PORT || 3001;

const app = express();
app.use(express.json());

app.use("/", acquireRoutes);

async function startServer() {
  try {
    console.log('[ENV] ACQUIRE_PORT:', process.env.ACQUIRE_PORT);
    console.log('[ENV] MONGO_URI:', process.env.MONGO_URI);
    console.log('[ENV] KUNNA_API_URL:', process.env.KUNNA_API_URL);
    console.log('[ENV] KUNNA_ALIAS:', process.env.KUNNA_ALIAS);  
    
    await connectMongo();
    console.log('[ACQUIRE] MongoDB conectado exitosamente');

    app.listen(PORT, () => {
      console.log(`[ACQUIRE] Servicio escuchando en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Error al iniciar acquire:", err);
    process.exit(1);
  }
}

startServer();