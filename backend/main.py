from agent_setup import EXIT_WORDS, agent_executor, get_bro_response

chat_history = []
query = input("\nbroGPT: Здрасти, брат! От какво имаш нужда?\n\nТи: ")

while True:

    if any(word in query.lower() for word in EXIT_WORDS):
        print("\nGo crush it, fam! Come back when you need something.\n")
        break

    result = get_bro_response(query, chat_history)
 
    if result["type"] == "plan":
        print(result["data"])
        break
    else:
        # Не е успял parsing => агентът все още пита нещо (onboarding въпрос)
        print(result["reply"])
 
        chat_history.append(("human", query))
        chat_history.append(("ai", result["reply"]))
 
        query = input("You: ")