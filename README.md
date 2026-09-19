# broGPT 💪

An AI fitness coach agent with a personality. broGPT talks to you like a friend
from the gym — not a formal assistant — asks about your goals, training days,
experience level, and equipment, then generates a personalized training plan.

**Live demo:** [brogpt.stanislavmanolov.com](https://brogpt.stanislavmanolov.com)

## What it does

- Interviews you conversationally before generating anything (one question at a time, not a form dump)
- Stays in character — casual, motivating, "bro" tone — throughout the whole conversation
- Returns a structured training plan (goal, summary, day-by-day schedule) once it has enough info
- Remembers the conversation so far, so follow-up answers build on earlier ones

## Tech stack

**Backend**
- Python, FastAPI
- LangChain (`langchain_classic` tool-calling agent + `AgentExecutor`)
- OpenAI API (`gpt-4o-mini`)
- Pydantic for structured output parsing

**Frontend**
- React + Vite
- Plain CSS (no framework) for a custom dark, gym-inspired look

## Project structure

```
broGPT/
├── backend/
│   ├── agent_setup.py   # LLM, prompt, tools, agent + shared response logic
│   ├── api.py           # FastAPI app, /chat endpoint
│   ├── main.py          # CLI version, for local testing
│   ├── tools.py         # Agent tools (web search)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/ChatUI.jsx   # Chat interface
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## Running it locally

**Backend**
```bash
cd backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:
```
OPENAI_API_KEY=your-key-here
```

Run the CLI version:
```bash
python3 main.py
```

Or run the API server:
```bash
uvicorn api:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

By default the frontend expects the backend at `http://localhost:8000` — update
`API_BASE_URL` in `src/components/ChatUI.jsx` if yours runs elsewhere.

## How the agent decides what to say

The system prompt instructs the model to collect five things one at a time —
goal, training days, experience, equipment, health limitations — before it's
allowed to generate a plan. Once the agent has enough context, it returns a
JSON object matching a `BroResponse` schema (topic, summary, sources,
schedule). The backend tries to parse every response against that schema:
if parsing succeeds, it's the final plan; if it fails, it's treated as a
regular conversational reply and the chat continues.

## What's next

- Voice (TTS) responses
- Deployed, polished chat UI improvements
- More nuanced plan generation (progressive overload, injury-aware adjustments)
