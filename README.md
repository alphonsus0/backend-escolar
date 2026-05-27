# Sistema Acadêmico Escolar

Trabalho de Banco de Dados II — sistema acadêmico em **SQL Server Express**
com toda a lógica de escrita encapsulada em **stored procedures** e **triggers**,
exposta via **FastAPI** e consumida por um frontend HTML/CSS/JS.

> Todas as operações de INSERT/UPDATE/DELETE passam por procedures.
> Regras de negócio (médias, faltas, pesos, situações) são aplicadas por
> triggers no próprio SGBD. O backend é uma fina camada HTTP em cima do DB.

---

## Estrutura do repositório

```
backend-escolar/
├── app/                          # Backend FastAPI
│   ├── api/v1/endpoints/         # Rotas REST por entidade
│   ├── core/                     # Config, DB engine, security (JWT)
│   ├── models/                   # Models SQLAlchemy (espelham as tabelas)
│   ├── schemas/                  # DTOs Pydantic
│   └── services/                 # Lógica de aplicação
│       ├── db_procedures.py      # ★ Helper exec_proc — chama todas as SPs
│       └── *_service.py          # 1 service por entidade (lista, cria, edita, exclui)
├── docs/
│   ├── schema.sql                # ★ DDL consolidado (tabelas + checks + índices)
│   ├── procedures.sql            # ★ Stored procedures (CRUD + acadêmicas)
│   ├── triggers.sql              # ★ Triggers (validação, recálculo, auditoria)
│   └── seeds.sql                 # Dados de exemplo (3 prof, 5 alunos, 3 ofertas...)
├── docker/
│   ├── docker-compose.yml        # SQL Server 2022 Express
│   ├── Dockerfile                # Imagem custom com init automático
│   └── init/                     # Scripts de bootstrap
├── frontend/sistema-academico-front-end/
│   └── frontend/                 # SPA HTML/CSS/JS (multi-página)
│       ├── pages/                # 1 .html por entidade
│       ├── js/                   # CRUD JS por entidade + api.js, auth.js, ui.js
│       └── css/                  # global, dashboard, tables, forms, auth
├── .env.example                  # Modelo de configuração
└── requirements.txt              # Dependências Python
```

---

## Modelo de dados

10 tabelas principais + 1 de auditoria. Relacionamentos:

```
PESSOA (1) ──┬── (1) ALUNO ─── (1:N) MATRICULA ─── (N:1) TURMA
             └── (1) PROFESSOR ─── (1:N) OFERTADISCIPLINA ─── (N:1) DISCIPLINA
                                          │                  ─── (N:1) TURMA
                                          └── (1:N) CURSAMENTO ◇── (N:1) MATRICULA
                                          └── (1:N) AVALIACAO
                                                       │
                                                       └── (1:N) NOTA ─── (N:1) CURSAMENTO
```

Pontos sutis:
- **PESSOA é tabela de herança** — `ALUNO.pessoa_id` e `PROFESSOR.pessoa_id`
  são FKs para `PESSOA.pessoa_id`, mas a mesma pessoa **não** pode ser aluno
  e professor simultaneamente (validado em `sp_InserirAluno`/`sp_InserirProfessor`).
- **CURSAMENTO** tem PK composta `(siMatricula, idOfertaDisciplina)` — é a
  matrícula do aluno em uma oferta específica de disciplina.
- **NOTA → AVALIACAO** (não o inverso): cada nota pertence a uma avaliação,
  e cada avaliação pode ter várias notas (uma por aluno cursando a oferta).
- **AUDITORIA** registra INSERT/UPDATE/DELETE em NOTA, mudanças de status em
  ALUNO e MATRICULA. Persistente em formato JSON (`FOR JSON PATH`).

Schema completo: [docs/schema.sql](docs/schema.sql).

---

## Procedures (resumo)

Todas em [docs/procedures.sql](docs/procedures.sql):

### CRUD (uma família por entidade)

| Entidade   | Inserir                       | Atualizar                      | Deletar                       |
|------------|-------------------------------|--------------------------------|-------------------------------|
| Aluno      | `sp_InserirAluno`             | `sp_AtualizarAluno`            | `sp_DeletarAluno`             |
| Professor  | `sp_InserirProfessor`         | `sp_AtualizarProfessor`        | `sp_DeletarProfessor`         |
| Turma      | `sp_InserirTurma`             | `sp_AtualizarTurma`            | `sp_DeletarTurma`             |
| Disciplina | `sp_InserirDisciplina`        | `sp_AtualizarDisciplina`       | `sp_DeletarDisciplina`        |
| Matrícula  | `sp_InserirMatricula`         | `sp_AtualizarMatricula`        | `sp_DeletarMatricula`         |
| Oferta     | `sp_InserirOfertaDisciplina`  | `sp_AtualizarOfertaDisciplina` | `sp_DeletarOfertaDisciplina`  |
| Avaliação  | `sp_InserirAvaliacao`         | `sp_AtualizarAvaliacao`        | `sp_DeletarAvaliacao`         |
| Cursamento | `sp_InserirCursamento`        | `sp_AtualizarCursamento`       | `sp_DeletarCursamento`        |
| Nota       | `sp_InserirNota`              | `sp_AtualizarNota`             | `sp_DeletarNota`              |

Procedures de UPDATE recebem todos os campos como `NULL` por padrão e usam
`COALESCE(novoValor, valorAtual)` — funcionam como **PATCH parcial**.

Erros são lançados via `THROW 51xxx, 'mensagem', 1` — o backend traduz
o código de erro para HTTP 404/409/422 em [app/services/db_procedures.py](app/services/db_procedures.py).

### Acadêmicas

- **`sp_CalcularMediaFinalAluno(@siMatricula, @idOfertaDisciplina)`** — média
  ponderada (`SUM(nota * peso) / SUM(peso)`) sobre TODAS as avaliações da oferta
  (avaliações sem nota contam zero). Atualiza `mediaFinal` e calcula
  `situacaoFinal` (APROVADO / REPROVADO / REPROVADO_FALTAS / EM_CURSO) com
  regra de **25% de faltas sobre a carga horária**.
- **`sp_EnturmarAluno(@idMatricula)`** — cria CURSAMENTOs para todas as
  ofertas ATIVAs da turma/ano/semestre da matrícula. Idempotente.
- **`sp_FecharSemestre(@anoLetivo, @semestre)`** — encerra ofertas, recalcula
  médias de todos os cursamentos do período, marca matrículas ATIVAs como
  FINALIZADA. Roda em transação.

---

## Triggers

Em [docs/triggers.sql](docs/triggers.sql):

| Trigger                          | Tabela    | Quando             | O que faz                                              |
|----------------------------------|-----------|--------------------|--------------------------------------------------------|
| `trg_ValidarMatricula`           | MATRICULA | AFTER INSERT       | Exige oferta ATIVA na turma/ano/semestre               |
| `trg_ImpedirMatriculaDuplicada`  | MATRICULA | AFTER INSERT       | Bloqueia segunda matrícula do mesmo aluno na turma/sem |
| `trg_ValidarSomaPesos`           | AVALIACAO | AFTER INSERT/UPDATE| Soma dos pesos por oferta ≤ 10                         |
| `trg_RecalcularMediaFinal`       | NOTA      | AFTER ALL          | Recalcula `mediaFinal` e `situacaoFinal` dos afetados  |
| `trg_RecalcularMediaPorFaltas`   | CURSAMENTO| AFTER UPDATE       | Reaplica regra de faltas quando `faltas` muda          |
| `trg_Audit_Nota`                 | NOTA      | AFTER ALL          | Grava JSON antes/depois em AUDITORIA                   |
| `trg_Audit_Aluno`                | ALUNO     | AFTER UPDATE/DELETE| Audita mudanças de status/RA/matrícula                 |
| `trg_Audit_Matricula`            | MATRICULA | AFTER UPDATE       | Audita troca de `statusMatricula`                      |

---

## Como rodar

### 1. Banco de dados (Docker)

```bash
cd docker
cp .env.example .env             # ajuste MSSQL_SA_PASSWORD se quiser
docker compose up -d --build
docker compose logs -f sqlserver # aguarde "Inicialização concluída."
```

A imagem custom já roda, na primeira inicialização:
1. `docker/init/00_create_database.sql` — `CREATE DATABASE SistemaAcademico`
2. `docs/schema.sql` — DDL
3. `docs/procedures.sql` — todas as SPs
4. `docs/triggers.sql` — todas as triggers
5. `docs/seeds.sql` — dados de exemplo

Marcador `/var/opt/mssql/.initialized` evita repetir. Para resetar do zero:
`docker compose down -v` (apaga o volume).

Conectar manualmente:
```bash
docker exec -it sistema-academico-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'SenhaForte!123' -C -d SistemaAcademico
```

### 2. Backend (FastAPI)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Driver ODBC 18 do SQL Server (Linux/Mac)
# https://learn.microsoft.com/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server

cp .env.example .env             # já vem apontando para o container
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

### 3. Frontend

Serve estático qualquer (Live Server, `python -m http.server`, etc.):

```bash
cd frontend/sistema-academico-front-end/frontend
python -m http.server 5500
# Abrir http://localhost:5500/login.html
```

O `js/api.js` aponta para `http://localhost:8000/api/v1` por padrão. Para
sobrescrever, defina `window.API_BASE_URL` antes de incluir o script:

```html
<script>window.API_BASE_URL = 'http://10.0.0.5:8000/api/v1';</script>
<script src="/frontend/js/api.js"></script>
```

---

## Endpoints REST principais

Todos sob prefixo `/api/v1`. Operações de escrita executam procedures.

### Cadastros (CRUD padrão)

| Recurso        | GET                          | POST          | PUT                | DELETE             |
|----------------|------------------------------|---------------|--------------------|--------------------|
| `/alunos`      | lista, `/{pessoa_id}`        | criar         | `/{pessoa_id}`     | `/{pessoa_id}`     |
| `/professores` | lista, `/{pessoa_id}`        | criar         | `/{pessoa_id}`     | `/{pessoa_id}`     |
| `/turmas`      | lista, `/{idTurma}`          | criar         | `/{idTurma}`       | `/{idTurma}`       |
| `/disciplinas` | lista, `/{idDisciplina}`     | criar         | `/{idDisciplina}`  | `/{idDisciplina}`  |
| `/matriculas`  | lista, `/{idMatricula}`      | criar         | `/{idMatricula}`   | `/{idMatricula}`   |
| `/ofertas`     | lista, `/{idOferta}`         | criar         | `/{idOferta}`      | `/{idOferta}`      |
| `/avaliacoes`  | lista, `/{idAvaliacao}`      | criar         | `/{idAvaliacao}`   | `/{idAvaliacao}`   |
| `/notas`       | lista, `/{idNota}`           | criar         | `/{idNota}`        | `/{idNota}`        |
| `/cursamentos` | lista, `/{si}/{oferta}`      | criar         | `/{si}/{oferta}`   | `/{si}/{oferta}`   |

### Processos acadêmicos

| Método | Rota                                                 | Procedure                    |
|--------|------------------------------------------------------|------------------------------|
| POST   | `/matriculas/{id}/enturmar`                          | `sp_EnturmarAluno`           |
| POST   | `/cursamentos/{si}/{oferta}/recalcular-media`        | `sp_CalcularMediaFinalAluno` |
| POST   | `/academico/fechar-semestre` (body: `{anoLetivo,semestre}`) | `sp_FecharSemestre`   |

### Autenticação

| Método | Rota                  | O que faz                              |
|--------|-----------------------|----------------------------------------|
| POST   | `/auth/login`         | OAuth2 password flow — retorna JWT     |

---

## Dados de exemplo (seeds)

- 3 professores (pessoa_id 1, 2, 3) — login: matrícula `PRF-001` / senha `senha123`
- 5 alunos (pessoa_id 100..104) — login: matrícula `MAT-2024-001` / senha `senha123`
- 2 turmas (`1º Ano A`, `1º Ano B`)
- 3 disciplinas (Matemática 80h, Português 80h, Física 60h)
- 3 ofertas em 2026/1 na turma 1
- 5 matrículas + enturmação automática
- 5 avaliações + 3 notas (João Silva em Matemática)

A senha `senha123` é hasheada com bcrypt cost=12 — hash em [docs/seeds.sql](docs/seeds.sql).

---

## Mapa procedure → service → endpoint

Toda procedure tem um caminho rastreável:

```
sp_InserirAluno
  └── exec_proc em app/services/db_procedures.py
       └── AlunoService.criar em app/services/aluno_service.py
            └── POST /api/v1/alunos em app/api/v1/endpoints/alunos.py
                 └── window.api.postData('/alunos', payload) em frontend/js/alunos.js
```

Erros `THROW 51xxx` viram exceções tipadas:
- 51120, 51130, 51150, ... → `NotFoundError` → HTTP 404
- 51100, 51110, 51140, ... → `ConflictError` → HTTP 409
- Demais 51xxx → `BusinessRuleError` → HTTP 422

---

## Decisões de design

1. **Procedures encapsulam toda escrita.** O service Python só monta o dict
   de parâmetros e chama `exec_proc`. Não há regra de negócio Python.
2. **SELECTs continuam via SQLAlchemy.** Leituras paginadas com joinedload
   não ganhariam clareza sendo procedures.
3. **Triggers como rede de segurança.** Mesmo que alguém faça `INSERT INTO NOTA`
   por fora das procedures, `trg_RecalcularMediaFinal` mantém o estado consistente.
4. **PKs manuais.** O schema usa PK não-autoincremento — `pessoa_id`, `idTurma`,
   etc. precisam ser informados. Reflete o requisito do trabalho e permite
   importação previsível em seeds.
5. **AUDITORIA em JSON.** Usa `FOR JSON PATH, WITHOUT_ARRAY_WRAPPER` — mais
   flexível que tabelas espelho por entidade. Consulta com `JSON_VALUE`/`OPENJSON`.
6. **Container SQL Server Express.** Edition fixada via `MSSQL_PID=Express`
   (gratuita, sem limite de tempo). Em dev pode trocar para `Developer` para
   habilitar recursos completos.

---

## Solução de problemas

| Sintoma                                                | Causa provável                                                       | Solução                                                                  |
|--------------------------------------------------------|----------------------------------------------------------------------|--------------------------------------------------------------------------|
| `[AVISO] DATABASE_URL não configurada`                 | `.env` ausente ou variável vazia                                     | `cp .env.example .env`                                                   |
| `Login failed for user 'sa'`                           | Senha do container != `DATABASE_URL`                                 | Alinhe `MSSQL_SA_PASSWORD` em `docker/.env` e a senha em `.env` da raiz  |
| `Can't open lib 'ODBC Driver 18 for SQL Server'`       | Driver ODBC não instalado                                            | Instale msodbcsql18 (Linux/Mac)                                          |
| `THROW 51131 — Aluno possui matrículas vinculadas`    | Tentou deletar aluno com matrículas                                  | Delete as matrículas/cursamentos primeiro                                |
| `Soma dos pesos das avaliações ultrapassa 10`         | Inseriu avaliação que estoura o limite                               | Reduza peso ou remova outra avaliação da oferta                          |
| Container reinicia em loop                             | Senha SA inválida (< 8 chars, sem caractere especial)                | Ajuste `MSSQL_SA_PASSWORD` e `docker compose up -d --force-recreate`     |
| `Inicialização concluída.` não aparece                | Scripts em `docs/` com erro SQL                                      | `docker compose logs sqlserver | grep -i error`                          |

---

## Roadmap (deixado pendente para iteração)

- Refatorar páginas/JS restantes do frontend (professores, disciplinas,
  turmas, ofertas, matrículas, cursamentos, avaliações, notas) seguindo o
  template já aplicado em `alunos.js` / `alunos.html`.
- Telas dedicadas para os processos acadêmicos (`fechar-semestre`,
  `enturmar`, `recalcular-media`).
- View `vw_HistoricoAluno` materializando boletim por aluno + período.
- Testes de integração rodando contra o container.
