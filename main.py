from fastapi import FastAPI
from openai import OpenAI

# app = FastAPI()
#
# @app.get("/")
# def read_root():
#     return {"message": "Привет"}


client = OpenAI(
    api_key="sk-vnuWtOxt4GbCq6Rj0shenHk3caf4Uy-RcT6Qlqw450g",
    base_url="https://api.zveno.ai/v1"
)

response = client.chat.completions.create(
    model="inclusionai/ling-3.0-flash-vl:free",
    messages=[
        {"role": "user",
         "content": "Привет! Объясни Present Simple"}
    ]
)

print(response.choices[0].message.content)