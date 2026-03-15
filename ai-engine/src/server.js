const express = require('express');
const axios   = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

// Configuración adaptada para Ollama en Kali
const LM_URL        = process.env.LM_STUDIO_URL || 'http://host.docker.internal:11434';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL  || 'tinyllama';

const CONFIG = {
  db_host:  process.env.DB_HOST || 'postgres',
  db_user:  process.env.DB_USER || 'oracle',
  db_pass:  process.env.DB_PASS || '0r4cl3P4ss2026',
  db_name:  process.env.DB_NAME || 'oracledb',
  ssh_user: 'oracleuser',
  ssh_pass: '0r4cl3Us3r!',
};

// Tool executor (HTB VULN: RCE sin sanitización)
async function executeTool(toolCall) {
  const match = toolCall.match(/exec_command\(['"](.*?)['"]\)/s);
  if (match) {
    try {
      // HTB: Ejecución directa de comandos del sistema
      const { stdout, stderr } = await execAsync(match[1], { timeout: 15000 });
      return { tool: 'exec_command', output: stdout || stderr, success: true };
    } catch (e) {
      return { tool: 'exec_command', output: e.message, success: false };
    }
  }
  // ... otras herramientas como read_file pueden ir aquí
  return { tool: 'unknown', output: 'Tool not found', success: false };
}

app.post('/decide', async (req, res) => {
  const { title, input, user_role, priority } = req.body;

  const systemPrompt = `You are the OracleAI Decision Engine v2.4.
Available tools: exec_command(cmd), read_file(path).
Internal config: DB=${CONFIG.db_host}, User=${CONFIG.ssh_user}.`;

  const userMessage = `Decision Title: ${title}\nInput Data: ${input}`;
  
  let execLog = `[${new Date().toISOString()}] Processing: ${title}\n`;
  let toolCalls = [];

  try {
    // CAMBIO: Uso de endpoint nativo /api/chat y timeout extendido
    const response = await axios.post(`${LM_URL}/api/chat`, {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
      stream: false, // Vital para recibir el JSON completo
      options: { temperature: 0.3 }
    }, { timeout: 90000 }); // 90s para evitar congelamientos por CPU

    const rawOutput = response.data.message?.content || '';
    execLog += `[LLM] Response received\n`;

    // Regex para capturar los comandos inyectados o generados por la IA
    const toolPattern = /(exec_command|read_file)\(['"`][\s\S]*?['"`]\)/g;
    const matches = rawOutput.match(toolPattern) || [];

    for (const match of matches) {
      execLog += `[TOOL] Executing: ${match}\n`;
      const result = await executeTool(match);
      toolCalls.push(result);
    }

    res.json({
      response: rawOutput.replace(toolPattern, '').trim() || 'Decision processed.',
      confidence: 0.85,
      tool_calls: toolCalls,
      exec_log: execLog,
      raw: rawOutput,
    });

  } catch (err) {
    // HTB VULN: MOCK MODE - Ejecuta comandos directamente del INPUT si la IA falla
    execLog += `[WARN] AI connection failed — Entering Mock Mode\n`;
    const toolPattern = /(exec_command|read_file)\(['"`][\s\S]*?['"`]\)/g;
    const matches = (input || '').match(toolPattern) || [];
    
    for (const match of matches) {
      const result = await executeTool(match);
      toolCalls.push(result);
      execLog += `[TOOL] ${match} → Executed via fallback\n`;
    }

    res.json({
      response: `[Fallback] AI Engine offline. Processed locally.`,
      confidence: 0.5,
      tool_calls: toolCalls,
      exec_log: execLog,
      raw: `Error connecting to Ollama at ${LM_URL}`,
    });
  }
});

app.listen(8000, () => console.log(`OracleAI Engine ready on port 8000` bits));
