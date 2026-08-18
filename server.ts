import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with ample capacity for context transport
app.use(express.json({ limit: "15mb" }));

// Initialize Supabase Client
let supabaseClient: any = null;
const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("WARNING: Supabase is not fully configured (missing SUPABASE_URL or SUPABASE_SECRET_KEY).");
    return null;
  }
  try {
    supabaseClient = createClient(url, key);
    return supabaseClient;
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
    return null;
  }
};

// Initialize GoogleGenAI client lazily or using environment variable
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Copilot responses will fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Operational Status Healthcheck
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Parque Berduc Operative Server",
    timestamp: new Date().toISOString(),
  });
});

// API: Supabase Connection & Table status
app.get("/api/supabase/status", async (req, res) => {
  const client = getSupabaseClient();
  if (!client) {
    return res.json({
      configured: false,
      url: process.env.SUPABASE_URL || "No configurado",
      message: "Falta configurar la URL o la clave secreta de Supabase en el panel de secretos (.env)."
    });
  }
  try {
    // Check if parque_store table exists by running a simple select
    const { data, error } = await client.from("parque_store").select("key").limit(1);
    if (error) {
      const isTableMissing = error.code === "42P01" || 
                             error.message?.includes("does not exist") || 
                             error.code === "P0001";
      if (isTableMissing) {
        return res.json({
          configured: true,
          url: process.env.SUPABASE_URL,
          tableExists: false,
          message: "La conexión con Supabase es correcta, pero la tabla 'parque_store' no existe aún."
        });
      }
      throw error;
    }
    res.json({
      configured: true,
      url: process.env.SUPABASE_URL,
      tableExists: true,
      message: "¡Conectado exitosamente a Supabase! La tabla 'parque_store' está lista."
    });
  } catch (err: any) {
    console.error("Supabase status error:", err);
    res.json({
      configured: true,
      url: process.env.SUPABASE_URL,
      tableExists: false,
      error: err.message || JSON.stringify(err),
      message: "Error al conectarse o consultar la tabla. Asegurate de crear la tabla parque_store."
    });
  }
});

// API: Load collection from Supabase
app.get("/api/supabase/load/:key", async (req, res) => {
  const { key } = req.params;
  const client = getSupabaseClient();
  if (!client) {
    return res.status(503).json({ error: "Supabase client not configured" });
  }
  try {
    const { data, error } = await client
      .from("parque_store")
      .select("value")
      .eq("key", key)
      .single();

    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") { // Record not found or table doesn't exist yet
        return res.json({ success: true, data: null });
      }
      throw error;
    }
    res.json({ success: true, data: data.value });
  } catch (err: any) {
    console.error(`Error loading key ${key} from Supabase:`, err);
    res.status(500).json({ error: err.message || err });
  }
});

// API: Save collection to Supabase
app.post("/api/supabase/save/:key", async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const client = getSupabaseClient();
  if (!client) {
    return res.status(503).json({ error: "Supabase client not configured" });
  }
  try {
    const { error } = await client
      .from("parque_store")
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(`Error saving key ${key} to Supabase:`, err);
    res.status(500).json({ error: err.message || err });
  }
});

// API: Safe AI Copilot query proxies
app.post("/api/copilot/query", async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Falta el mensaje de consulta (message)." });
    }

    const ai = getGenAIClient();
    
    // Construct an analytical context string about current park metrics and states
    const parkContextStr = `
DATOS DE OPERACIÓN DEL PARQUE EN TIEMPO REAL:
- Visitantes Activos Hoy en el Sistema: ${context?.visitantesCount || 0}
- Turnos / Reservas Activas Hoy: ${context?.turnosCount || 0}
- Delegaciones Registradas: ${context?.delegacionesCount || 0}
- Perfil de Simulación Seleccionado: "${context?.simulationProfile || "normal"}"
- Tránsito Extra Inyectado por Simulación: ${context?.simulatedExtraPeople || 0} personas adicionales.

SECTORES Y SU ESTADO DE CONCURRENCIA ESTIMADA (CAPACIDAD / OCUPACIÓN):
${JSON.stringify(context?.sectorsSummary || {}, null, 2)}

LISTADO DE SECTORES SOPORTADOS:
1. Pista de Atletismo (E01) - Capacidad Máxima: 80 personas
2. Campo de Fútbol & Rugby (E02) - Capacidad Máxima: 55 personas
3. Pileta Olímpica Climatizada (E03) - Capacidad Máxima: 40 personas
4. Canchas de Pádel Vidriadas (E04) - Capacidad Máxima: 16 personas
5. Gimnasio Techado / Polideportivo (E05) - Capacidad Máxima: 60 personas
6. Sala de Musculación & Wellness (E06) - Capacidad Máxima: 25 personas
7. Playón Multideportivo Abierto (E07) - Capacidad Máxima: 45 personas
8. Espacio de Juegos y Recreación (E08) - Capacidad Máxima: 35 personas

PROFESORES Y ROLES:
- Carlos 'Charly' Álvarez (Atletismo - Elite y Lanzamientos)
- Marta Rodríguez (Atletismo - Velocidad y Saltos)
- Mariano Galarza (Fútbol - Primera y Juveniles)
- Flavia Siede (Natación - Natación Infantil y Adultos)
- Ariel Albornoz (Natación - Federados y Competición)
- Sofía Mildemberger (Vóley - Mini Vóley y Maxivóley)
- Gustavo Brassesco (Pádel - Clases Avanzadas e Iniciación)
- Esteban 'Bicho' Gómez (Básquet - U15, U17 y Mayores)
- Walter Galarza (Handball - Cadetes y Primera)
- Daniela Martínez (Musculación - Musculación y Fuerza Funcional)

TORNEOS ACTIVOS O PROGRAMADOS:
- Gran Prix Entrerriano - Homenaje Nazareno Sasia (Atletismo - Mayores o Lanzamientos, Finalizado)
- Copa Ciudad de Paraná - Básquet (U17 Masculino, Programado, 96 participantes)
- Torneo de Natación 'Delfines del Berduc' (Juveniles y Cadetes, Finalizado, 120 participantes)
- Abierto de Pádel Oro Berduc (Segunda Caballeros, En Curso, 32 participantes)
`;

    const systemInstruction = 
      "Sos 'Berduc Brain Copilot v3.5', un experto copiloto e inteligencia artificial de gestión operativa para el Complejo Deportivo Enrique Berduc de Paraná, Entre Ríos.\n" +
      "Tu rol es interactuar con el administrador del parque brindándole resúmenes ejecutivos, análisis de ocupación de las canchas, sugerencias de derivación de deportistas para evitar la sobrecarga (especialmente cuando los sectores superan el 60% u 85% de aforo), información de contacto de profesores y recomendaciones sobre eventos o torneos.\n" +
      "Sé conciso, profesional, analítico y redactá tus respuestas con un tono amigable, enérgico y deportivo. Si los datos actuales muestran algún sector sobrecargado (más del 80%) u ocupado (más del 60%), alertá proactivamente al administrador y sugerele acciones de mitigación concretas (como programar rotación de turnos, derivar gente al Playón Multideportivo Abierto, etc.). Usa viñetas limpias para estructurar tus análisis y recomendaciones operacionales.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: `CONTEXTO DETALLADO DEL COMPLEJO DEPORTIVO:\n${parkContextStr}` },
        { text: `CLIENT QUERY:\n${message}` }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      answer: response.text || "Lo siento, no pude procesar la consulta de inteligencia en este momento.",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error en Berduc Brain API:", error);
    res.status(500).json({
      error: "Ocurrió un error al procesar la respuesta en el servidor de inteligencia.",
      details: error?.message || error
    });
  }
});

// Configure Vite or Static Assets Serving
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode: spin up Vite Dev Middleware
    console.log("Iniciando servidor de desarrollo con Middleware de Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: yield static compiled React assets
    console.log("Iniciando servidor de producción con recursos estáticos...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(`🚀 Berduc Server levantado exitosamente en puerto ${PORT}`);
    console.log(`🌐 Dashboard Operativo de Paraná de manera full-stack`);
    console.log(`=======================================================`);
  });
}

bootServer();
