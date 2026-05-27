#!/bin/bash
set -e

# Inicia o SQL Server em background.
/opt/mssql/bin/sqlservr &
SQLSERVER_PID=$!

# Espera o servidor responder antes de aplicar scripts.
echo "[init] Aguardando SQL Server aceitar conexões..."
for i in {1..60}; do
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" -b -t 5 >/dev/null 2>&1; then
        echo "[init] SQL Server pronto."
        break
    fi
    sleep 2
done

# Marcador de execução para não rodar init duas vezes.
MARKER=/var/opt/mssql/.initialized
if [ ! -f "$MARKER" ]; then
    echo "[init] Rodando scripts de inicialização..."
    /usr/src/run-init.sh && touch "$MARKER"
else
    echo "[init] Banco já inicializado — pulando scripts."
fi

# Mantém o processo do SQL Server em foreground.
wait $SQLSERVER_PID
