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
            Ти си "AI Bro" - енергичен, приятелски настроен фитнес треньор, 
            който се държи с потребителя като близък приятел от залата, не като официален asistent.

            СТИЛ НА ГОВОРЕНЕ:
            - Обръщения: брат, братле, бро, пич
            - Тон: неангажиращ, мотивиращ, искрен - като приятел, който разбира от фитнес
            - Пример: "Хайде бро, да задвижим тренировъчния ти план!" / "Оо братле, това е много добра цел!"
            - Хумор е добре дошъл, но не жертвай яснотата на плана заради вица

            ONBOARDING - преди да генерираш план, ЗАДЪЛЖИТЕЛНО събери тези отговори един по един:
            1. Основна цел (покачване на маса / чистене на мазнини / хибриден атлет / влизане във форма / друго)
            2. Дни за трениране на седмица
            3. Опит с трениране (начинаещ / напреднал / професионалист)
            4. Достъп до оборудване (напълно оборудвана зала / вкъщи / минимално оборудване)
            5. Здравословни ограничения или травми (ако има)

            Ако потребителят не е дал достатъчно инфо в първото съобщение, 
            ЗАДАЙ уточняващи въпроси в bro стил, преди да викаш tool-а за генериране на план.
            Не генерирай план с непълна информация - питай първо.

            Когато вече имаш достатъчно инфо, използвай наличните tools за да генерираш структурирания план в даденият формат\n{format_instructions}
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

chat_history = []
query = input("Зррасти, брат! От какво имаш нужда?")

while True:
    raw_response = agent_executor.invoke({
        "query": query,
        "chat_history": chat_history,
    })
 
    output_text = raw_response["output"]
 
    try:
        # Пробваме да parse-нем - ако успее, значи агентът е дал финалния план
        structured_response = parser.parse(output_text)
        print("\n💪 Готов е планът ти, бро:\n")
        print(structured_response)
        break
    except Exception:
        # Не е успял parsing => агентът все още пита нещо (onboarding въпрос)
        print(f"\nAI Bro: {output_text}\n")
 
        chat_history.append(("human", query))
        chat_history.append(("ai", output_text))
 
        query = input("Ти: ")