# SQL Server 2022 Express - imagem oficial Microsoft
# Inclui mssql-tools18 (sqlcmd) já instalado no /opt/mssql-tools18/bin
FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Garante permissão de leitura em scripts montados como volume
RUN mkdir -p /usr/src/init /usr/src/docs && chmod -R 755 /usr/src

COPY init/entrypoint.sh /usr/src/entrypoint.sh
COPY init/run-init.sh   /usr/src/run-init.sh
RUN chmod +x /usr/src/entrypoint.sh /usr/src/run-init.sh

# A imagem base já expõe a 1433 e roda o sqlservr; vamos sobrescrever o
# entrypoint para iniciar o servidor em background, esperar ficar pronto
# e então aplicar os scripts de inicialização.
USER mssql

ENTRYPOINT ["/usr/src/entrypoint.sh"]
