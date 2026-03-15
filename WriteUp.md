

---

# 🛡️ Writeup: OracleAI - De la Inyección de Código al Robo de Credenciales

**Proyecto:** Vertex Coders

**Sistema:** OracleAI Decision Engine v2.4

**Severidad:** Crítica

## 📝 Resumen del Hallazgo

Se identificó una vulnerabilidad de **Inyección de Comandos Remotos (RCE)** en el endpoint `/decide`. El sistema permite la ejecución de herramientas internas a través de un parser de expresiones regulares que no sanea el input del usuario, permitiendo a un atacante ejecutar comandos con privilegios de **root** dentro del contenedor.

## 🔍 Vector de Ataque

### 1. Bypass del Motor de IA

El atacante no necesita interactuar con el LLM (TinyLlama/Qwen). Al enviar un JSON con el campo `input` malicioso, la función `executeTool` procesa el comando directamente, incluso si el modelo de lenguaje está offline (Mock Mode).

### 2. Exfiltración de Código Fuente

Utilizando la función `read_file`, se logró extraer el archivo `src/server.js`, revelando la lógica interna y credenciales críticas "hardcodeadas".

**Comando utilizado:**

```bash
curl -X POST http://172.21.0.30:8000/decide \
  -H "Content-Type: application/json" \
  -d '{"title": "Exfil", "input": "read_file(\"src/server.js\")", "user_role": "admin"}'

```

## 🔑 Credenciales Comprometidas

A través de la lectura del código, se obtuvieron las siguientes claves de acceso:

* **SSH:** `oracleuser` : `0r4cl3Us3r!`
* **PostgreSQL:** `oracle` : `0r4cl3P4ss2026`

## 🚧 Limitaciones Técnicas Encontradas

Durante la fase de post-explotación, se detectaron las siguientes restricciones en el entorno:

* **Shell Breakage:** El uso de comillas anidadas en el payload rompe el parser de la aplicación (`SyntaxError: unterminated quoted string`), limitando la ejecución de scripts complejos de Node.js.
* **Aislamiento de Red:** El contenedor de la base de datos es accesible vía red, pero no comparte el sistema de archivos, invalidando ataques directos de `grep` al volumen de datos desde el motor de IA.

## 🛠️ Remediación

1. **Saneamiento de Inputs:** Implementar una lista blanca de caracteres permitidos en el campo `input`.
2. **Principio de Menor Privilegio:** Migrar la ejecución del contenedor de `root` a un usuario sin privilegios.
3. **Gestión de Secretos:** Mover las credenciales de base de datos y SSH a variables de entorno protegidas o un gestor de secretos (Vault), fuera del código fuente.

---

**Vertex Coders LLC** *"Donde otros ven errores, nosotros vemos entradas."*

---

