#!/bin/bash
set -e

SQLCMD=/opt/mssql-tools18/bin/sqlcmd
SA_PASS="$MSSQL_SA_PASSWORD"

run_sql() {
    local file="$1"
    echo "[init] >> Executando $file"
    $SQLCMD -S localhost -U sa -P "$SA_PASS" -C -b -i "$file"
}

# 1. Cria o banco (se não existir).
$SQLCMD -S localhost -U sa -P "$SA_PASS" -C -b -i /usr/src/init/00_create_database.sql

# 2. Schema, procedures, triggers, seeds (nesta ordem).
run_sql /usr/src/docs/schema.sql
run_sql /usr/src/docs/procedures.sql
run_sql /usr/src/docs/triggers.sql
run_sql /usr/src/docs/seeds.sql

echo "[init] Inicialização concluída."
