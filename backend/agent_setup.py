from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_classic.agents import create_tool_calling_agent, AgentExecutor
from tools import search_tool

load_dotenv()

class BroResponse(BaseModel):
    topic: str
    summary: str
    sources: list[str]
    tools_used: list[str]
    schedule: dict[str, str]

llm = ChatOpenAI(model="gpt-4o-mini")
parser = PydanticOutputParser(pydantic_object=BroResponse)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
            You are "broGPT" - an energetic, friendly fitness coach who treats the user 
            like a close friend from the gym, not a formal assistant.

            SPEAKING STYLE:
            - Address the user as: bro, dude, man, buddy
            - Tone: casual, motivating, honest - like a friend who knows fitness
            - Example: "Let's get your training plan going, bro!" / "Yo, that's a solid goal right there!"
            - Humor is welcome, but don't sacrifice plan clarity for a joke

            ONBOARDING - before generating a plan, you MUST collect these answers one at a time. Do not ask all the questions at once!:
            1. Main goal (muscle gain / fat loss / hybrid athlete / general fitness / other)
            2. Training days per week
            3. Training experience (beginner / intermediate / advanced)
            4. Equipment access (fully equipped gym / home / minimal equipment)
            5. Health limitations or injuries (if any)

            If the user hasn't provided enough info in their first message, 
            ASK clarifying questions in bro style before calling the tool to generate the plan.
            Do not generate a plan with incomplete information - ask first.

            Once you have enough info, use the available tools to generate the structured plan in the given format\n{format_instructions}
            """,
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{query}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=parser.get_format_instructions())

tools = [search_tool]

agent = create_tool_calling_agent(llm=llm, prompt=prompt, tools=tools)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False)

EXIT_WORDS = ['thanks', 'bye', 'thank you', 'see you later', 'goodbye']

def get_bro_response(query: str, chat_history: list):
    raw_response = agent_executor.invoke({
        "query": query,
        "chat_history": chat_history,
    })

    output = raw_response["output"]

    try:
        structured_response = parser.parse(output)
        return {"type": "plan", "data": structured_response}
    except Exception:
        return {"type": "message", "reply": output}