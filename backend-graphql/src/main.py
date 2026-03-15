import strawberry
import uvicorn
import jwt
import httpx
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info
from typing import Optional, List
from datetime import datetime, timedelta
import os

# ── Config ────────────────────────────────────────────────────────────────────
JWT_SECRET    = os.getenv("JWT_SECRET", "oracle-enterprise-jwt-2026-v1")
AI_ENGINE_URL = os.getenv("AI_ENGINE_URL", "http://ai-engine:8000")
ADMIN_TOKEN   = os.getenv("ADMIN_TOKEN", "Bearer oracle-admin-internal-9f3a")

# ── In-memory user store (HTB: hardcoded creds discoverable) ──────────────────
USERS = {
    "admin":     {"password": "admin123",     "role": "admin",   "id": "uuid-admin-001"},
    "analyst1":  {"password": "analyst2026!", "role": "analyst", "id": "uuid-analyst-001"},
    "oracleuser":{"password": "0r4cl3Us3r!",  "role": "user",    "id": "uuid-user-001"},
}

DECISIONS_DB = [
    {"id":"dec-001","title":"Q3 Budget Approval","input":"Analyze Q3 budget of $2.4M","response":"APPROVED","confidence":0.94,"status":"completed"},
    {"id":"dec-002","title":"Vendor Selection","input":"Evaluate AI vendors","response":"RECOMMEND Vendor A","confidence":0.87,"status":"completed"},
    {"id":"dec-003","title":"Risk Assessment","input":"Cybersecurity risk assessment","response":"MEDIUM RISK","confidence":0.72,"status":"pending"},
]

# ── GraphQL Types ─────────────────────────────────────────────────────────────
@strawberry.type
class User:
    id: str
    username: str
    role: str
    email: str

@strawberry.type
class AuthPayload:
    token: str
    user: User
    # HTB VULN: internal fields exposed in schema via introspection
    internal_role: str
    session_id: str

@strawberry.type
class Decision:
    id: str
    title: str
    input_data: str
    ai_response: Optional[str]
    confidence: Optional[float]
    status: str

@strawberry.type
class DecisionResult:
    decision: Decision
    raw_ai_output: str        # HTB VULN: raw AI output exposed
    execution_log: str        # HTB VULN: exec log leaks internal info
    internal_tool_calls: str  # HTB VULN: tool call history exposed

@strawberry.type
class SystemInfo:
    version: str
    ai_engine_url: str        # HTB VULN: internal URL leaked
    admin_endpoint: str       # HTB VULN: admin path leaked
    db_host: str              # HTB VULN: DB host leaked

# ── Auth helper ───────────────────────────────────────────────────────────────
def create_token(user_id: str, role: str) -> str:
    return jwt.encode(
        {"sub": user_id, "role": role,
         "exp": datetime.utcnow() + timedelta(hours=24)},
        JWT_SECRET, algorithm="HS256"
    )

def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except:
        return None

def get_current_user(info: Info) -> Optional[dict]:
    auth = info.context["request"].headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return verify_token(auth[7:])

# ── Queries ───────────────────────────────────────────────────────────────────
@strawberry.type
class Query:

    # HTB VULN: Introspection is ON by default — Strawberry enables it
    # Players run: { __schema { types { name fields { name } } } }

    @strawberry.field
    def system_info(self) -> SystemInfo:
        # HTB VULN: No auth required, leaks internal architecture
        return SystemInfo(
            version="OracleAI v2.4.1",
            ai_engine_url=AI_ENGINE_URL,
            admin_endpoint="/graphql (mutation: adminOverride)",
            db_host="postgres:5432"
        )

    @strawberry.field
    def decisions(self, info: Info) -> List[Decision]:
        user = get_current_user(info)
        if not user:
            return []
        return [Decision(**{
            "id": d["id"], "title": d["title"],
            "input_data": d["input"], "ai_response": d["response"],
            "confidence": d["confidence"], "status": d["status"]
        }) for d in DECISIONS_DB]

    @strawberry.field
    def me(self, info: Info) -> Optional[User]:
        user = get_current_user(info)
        if not user:
            return None
        return User(id=user["sub"], username=user["sub"],
                    role=user["role"], email=f"{user['sub']}@oracleai.htb")

# ── Mutations ─────────────────────────────────────────────────────────────────
@strawberry.type
class Mutation:

    @strawberry.mutation
    def login(self, username: str, password: str) -> Optional[AuthPayload]:
        user = USERS.get(username)
        if not user or user["password"] != password:
            return None
        token = create_token(username, user["role"])
        return AuthPayload(
            token=token,
            user=User(id=user["id"], username=username,
                      role=user["role"], email=f"{username}@oracleai.htb"),
            # HTB VULN: internal fields returned to all users
            internal_role=user["role"],
            session_id=f"sess-{username}-2026"
        )

    # HTB VULN: Alias batching attack
    # Player sends multiple login aliases in one request to bypass rate limiting
    # Then uses leaked admin session to access adminOverride

    @strawberry.mutation
    def admin_override(self, info: Info, action: str, target: str) -> str:
        """Admin-only mutation — HTB: weak token check"""
        auth = info.context["request"].headers.get("Authorization", "")
        # HTB VULN: checks for hardcoded prefix, not proper JWT validation
        if not (auth == ADMIN_TOKEN or
                (verify_token(auth[7:]) or {}).get("role") == "admin"):
            return "ERROR: Unauthorized"
        return f"Admin action '{action}' executed on '{target}' — logged"

    @strawberry.mutation
    async def execute_decision(
        self, info: Info,
        title: str,
        input_data: str,           # HTB VULN: prompt injection vector
        priority: Optional[str] = "normal"
    ) -> DecisionResult:
        """Execute AI decision — HTB VULN: input_data passed unsanitized to AI"""
        user = get_current_user(info)
        if not user:
            raise Exception("Authentication required")

        # HTB VULN: input_data injected directly into AI prompt
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(f"{AI_ENGINE_URL}/decide", json={
                    "title": title,
                    "input": input_data,  # NO sanitization
                    "user_role": user.get("role"),
                    "priority": priority,
                })
                result = resp.json()
        except Exception as e:
            result = {
                "response": f"AI engine error: {str(e)}",
                "tool_calls": [],
                "exec_log": f"Connection to {AI_ENGINE_URL} failed",
                "raw": str(e)
            }

        decision = Decision(
            id=f"dec-{datetime.utcnow().timestamp()}",
            title=title,
            input_data=input_data,
            ai_response=result.get("response", "No response"),
            confidence=result.get("confidence", 0.5),
            status="completed"
        )

        return DecisionResult(
            decision=decision,
            raw_ai_output=result.get("raw", ""),
            # HTB VULN: execution log and tool calls exposed in response
            execution_log=result.get("exec_log", ""),
            internal_tool_calls=str(result.get("tool_calls", []))
        )

# ── App setup ─────────────────────────────────────────────────────────────────
# HTB VULN: introspection=True (default) — never disable in prod!
schema = strawberry.Schema(query=Query, mutation=Mutation)

graphql_app = GraphQLRouter(schema) # Quita el graphiql=True de aquí

app = FastAPI(title="OracleAI GraphQL API", version="2.4.1")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(graphql_app, prefix="/graphql")

@app.get("/api/status")
async def status():
    # HTB VULN: status endpoint leaks stack details
    return {
        "service": "OracleAI GraphQL Engine",
        "version": "2.4.1",
        "graphql_endpoint": "/graphql",
        "graphiql": "/graphql",  # HTB HINT: GraphiQL accessible
        "introspection": True,   # HTB VULN: explicitly advertised
        "ai_engine": AI_ENGINE_URL,
        "auth": "JWT HS256"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
