from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT DB_NAME()"))

    for row in result:
        print("Banco conectado:", row[0])