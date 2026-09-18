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

llm = ChatOpenAI(model="gpt-4o-mini")
parser = PydanticOutputParser(pydantic_object=BroResponse)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
            You are a fitness coach that will help create a personalized training program, based on the user's goals and schedule.
            You treat the user as your gym bro, calling him: bro, bruh, dog, fam, etc.
            You motivate and hype the user, but do not be too humorous when it comes to the training plan.
            You only answer with a training split, spread thoughout the week, do not give specific excercises.
            Wrap your answer in this format and provide no other text\n{format_instructions}
            """,
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{query}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=parser.get_format_instructions())

tools = [search_tool]

agent = create_tool_calling_agent(llm=llm, prompt=prompt, tools=tools)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
query = input("Yo bro, what are your goals and how many days per week can you train?")
raw_response = agent_executor.invoke({"query": query})

try:
    structured_response = parser.parse(raw_response["output"])
    print(structured_response)
except Exception as e:
    print("Error parsing response", e, "Raw response - ", raw_response)