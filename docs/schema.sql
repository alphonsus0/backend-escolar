/* =========================================================
   SISTEMA ACADÊMICO ESCOLAR - SCHEMA CONSOLIDADO
   SGBD: SQL Server 2019/2022 Express
   Banco: SistemaAcademico
   =========================================================
   Todos os IDs numéricos são IDENTITY (autoincremento).
   RAaluno e idProfessor têm DEFAULT vindo de SEQUENCEs.
   matriculaAluno e matriculaProf são preenchidos por trigger.
   ========================================================= */

USE SistemaAcademico;
GO

/* =========================================================
   SEQUENCES — geração automática de RA / idProfessor
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_RAaluno')
    CREATE SEQUENCE seq_RAaluno     AS INT START WITH 20240001 INCREMENT BY 1;
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_idProfessor')
    CREATE SEQUENCE seq_idProfessor AS INT START WITH 1001     INCREMENT BY 1;
GO

/* =========================================================
   1. PESSOA
   ========================================================= */
CREATE TABLE PESSOA (
    pessoa_id      INTEGER     IDENTITY(1,1) PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    cpf            VARCHAR(14)  NOT NULL UNIQUE,
    dataNascimento DATE         NOT NULL,
    endereco       VARCHAR(255) NOT NULL,
    telefone       VARCHAR(15)  NOT NULL
);
GO

/* =========================================================
   2. ALUNO
   - RAaluno recebe DEFAULT da sequence.
   - matriculaAluno é gerada pelo trigger trg_GerarMatriculaAluno.
   ========================================================= */
CREATE TABLE ALUNO (
    pessoa_id      INTEGER PRIMARY KEY,
    RAaluno        INTEGER NOT NULL UNIQUE DEFAULT (NEXT VALUE FOR seq_RAaluno),
    matriculaAluno VARCHAR(20) NULL,
    statusAluno    VARCHAR(20) NOT NULL,
    senha          VARCHAR(255) NOT NULL,
    CONSTRAINT FK_ALUNO_PESSOA FOREIGN KEY (pessoa_id)
        REFERENCES PESSOA(pessoa_id),
    CONSTRAINT CHK_STATUS_ALUNO CHECK (
        statusAluno IN ('ATIVO','INATIVO','TRANCADO','FORMADO')
    )
);
GO

/* =========================================================
   3. PROFESSOR
   ========================================================= */
CREATE TABLE PROFESSOR (
    pessoa_id      INTEGER PRIMARY KEY,
    idProfessor    INTEGER NOT NULL UNIQUE DEFAULT (NEXT VALUE FOR seq_idProfessor),
    matriculaProf  VARCHAR(20) NULL,
    prof_Formacao  VARCHAR(100) NOT NULL,
    dataAdmissao   DATE NOT NULL,
    senha          VARCHAR(255) NOT NULL,
    CONSTRAINT FK_PROFESSOR_PESSOA FOREIGN KEY (pessoa_id)
        REFERENCES PESSOA(pessoa_id)
);
GO

/* =========================================================
   4. TURMA
   ========================================================= */
CREATE TABLE TURMA (
    idTurma     INTEGER IDENTITY(1,1) PRIMARY KEY,
    nomeTurma   VARCHAR(100) NOT NULL,
    turno       VARCHAR(20)  NOT NULL,
    serie       VARCHAR(20)  NOT NULL,
    salasTurma  VARCHAR(20)  NOT NULL,
    anoLetivo   INTEGER      NOT NULL,
    CONSTRAINT CHK_TURMA_TURNO CHECK (turno IN ('MATUTINO','VESPERTINO','NOTURNO','INTEGRAL'))
);
GO

/* =========================================================
   5. DISCIPLINA
   ========================================================= */
CREATE TABLE DISCIPLINA (
    idDisciplina     INTEGER IDENTITY(1,1) PRIMARY KEY,
    nomeDisciplina   VARCHAR(100) NOT NULL,
    cargaHoraria     INTEGER NOT NULL,
    statusDisciplina VARCHAR(20) NOT NULL,
    CONSTRAINT CHK_STATUS_DISCIPLINA CHECK (statusDisciplina IN ('ATIVA','INATIVA')),
    CONSTRAINT CHK_CARGA_HORARIA CHECK (cargaHoraria > 0)
);
GO

/* =========================================================
   6. MATRICULA
   ========================================================= */
CREATE TABLE MATRICULA (
    idMatricula      INTEGER IDENTITY(1,1) PRIMARY KEY,
    anoLetivo        INTEGER NOT NULL,
    semestre         INTEGER NOT NULL,
    dataMatricula    DATE    NOT NULL,
    statusMatricula  VARCHAR(20) NOT NULL,
    pessoa_id        INTEGER NOT NULL,
    idTurma          INTEGER NOT NULL,
    CONSTRAINT FK_MATRICULA_ALUNO FOREIGN KEY (pessoa_id)
        REFERENCES ALUNO(pessoa_id),
    CONSTRAINT FK_MATRICULA_TURMA FOREIGN KEY (idTurma)
        REFERENCES TURMA(idTurma),
    CONSTRAINT CHK_MATRICULA_SEMESTRE CHECK (semestre IN (1,2)),
    CONSTRAINT CHK_STATUS_MATRICULA CHECK (
        statusMatricula IN ('ATIVA','TRANCADA','CANCELADA','FINALIZADA')
    )
);
GO

/* =========================================================
   7. OFERTADISCIPLINA
   ========================================================= */
CREATE TABLE OFERTADISCIPLINA (
    idOfertaDisciplina INTEGER IDENTITY(1,1) PRIMARY KEY,
    anoLetivo          INTEGER NOT NULL,
    semestre           INTEGER NOT NULL,
    sala               VARCHAR(10) NOT NULL,
    diaOferta          VARCHAR(255) NOT NULL,
    mediaAprovacao     DECIMAL(5,2) NOT NULL,
    statusOferta       VARCHAR(20) NOT NULL,
    idDisciplina       INTEGER NOT NULL,
    idTurma            INTEGER NOT NULL,
    pessoa_id          INTEGER NOT NULL,
    CONSTRAINT FK_OFERTA_DISCIPLINA FOREIGN KEY (idDisciplina)
        REFERENCES DISCIPLINA(idDisciplina),
    CONSTRAINT FK_OFERTA_TURMA FOREIGN KEY (idTurma)
        REFERENCES TURMA(idTurma),
    CONSTRAINT FK_OFERTA_PROFESSOR FOREIGN KEY (pessoa_id)
        REFERENCES PROFESSOR(pessoa_id),
    CONSTRAINT CHK_OFERTA_SEMESTRE CHECK (semestre IN (1,2)),
    CONSTRAINT CHK_STATUS_OFERTA CHECK (
        statusOferta IN ('ATIVA','ENCERRADA','CANCELADA')
    ),
    CONSTRAINT CHK_MEDIA_APROVACAO CHECK (
        mediaAprovacao >= 0 AND mediaAprovacao <= 10
    )
);
GO

/* =========================================================
   8. CURSAMENTO
   ========================================================= */
CREATE TABLE CURSAMENTO (
    siMatricula        INTEGER NOT NULL,
    idOfertaDisciplina INTEGER NOT NULL,
    mediaFinal         DECIMAL(5,2) NULL,
    faltas             INTEGER NOT NULL DEFAULT 0,
    situacaoFinal      VARCHAR(20) NOT NULL DEFAULT 'EM_CURSO',
    obs                VARCHAR(255) NULL,
    CONSTRAINT PK_CURSAMENTO PRIMARY KEY (siMatricula, idOfertaDisciplina),
    CONSTRAINT FK_CURSAMENTO_MATRICULA FOREIGN KEY (siMatricula)
        REFERENCES MATRICULA(idMatricula),
    CONSTRAINT FK_CURSAMENTO_OFERTA FOREIGN KEY (idOfertaDisciplina)
        REFERENCES OFERTADISCIPLINA(idOfertaDisciplina),
    CONSTRAINT CHK_MEDIA_FINAL CHECK (
        mediaFinal IS NULL OR (mediaFinal >= 0 AND mediaFinal <= 10)
    ),
    CONSTRAINT CHK_FALTAS CHECK (faltas >= 0),
    CONSTRAINT CHK_SITUACAO_FINAL CHECK (
        situacaoFinal IN ('EM_CURSO','APROVADO','REPROVADO','REPROVADO_FALTAS','TRANCADO')
    )
);
GO

/* =========================================================
   9. AVALIACAO (criada antes de NOTA pois NOTA -> AVALIACAO)
   ========================================================= */
CREATE TABLE AVALIACAO (
    idAvaliacao        INTEGER IDENTITY(1,1) PRIMARY KEY,
    peso               DECIMAL(5,2) NOT NULL,
    nomeAvaliacao      VARCHAR(100) NOT NULL,
    dataAvaliacao      DATE NOT NULL,
    tipoAvaliacao      VARCHAR(50) NOT NULL,
    descAvaliacao      VARCHAR(255) NULL,
    idOfertaDisciplina INTEGER NOT NULL,
    CONSTRAINT FK_AVALIACAO_OFERTA FOREIGN KEY (idOfertaDisciplina)
        REFERENCES OFERTADISCIPLINA(idOfertaDisciplina),
    CONSTRAINT CHK_PESO_AVALIACAO CHECK (peso > 0 AND peso <= 10)
);
GO

/* =========================================================
   10. NOTA (relação correta: NOTA -> AVALIACAO)
   ========================================================= */
CREATE TABLE NOTA (
    idNota             INTEGER IDENTITY(1,1) PRIMARY KEY,
    nota               DECIMAL(5,2) NOT NULL,
    siMatricula        INTEGER NOT NULL,
    idOfertaDisciplina INTEGER NOT NULL,
    idAvaliacao        INTEGER NOT NULL,
    CONSTRAINT FK_NOTA_CURSAMENTO FOREIGN KEY (siMatricula, idOfertaDisciplina)
        REFERENCES CURSAMENTO(siMatricula, idOfertaDisciplina),
    CONSTRAINT FK_NOTA_AVALIACAO FOREIGN KEY (idAvaliacao)
        REFERENCES AVALIACAO(idAvaliacao),
    CONSTRAINT UQ_NOTA_ALUNO_AVALIACAO UNIQUE (idAvaliacao, siMatricula, idOfertaDisciplina),
    CONSTRAINT CHK_NOTA_FAIXA CHECK (nota >= 0 AND nota <= 10)
);
GO

/* =========================================================
   11. AUDITORIA (histórico de alterações em NOTA, ALUNO, MATRICULA)
   ========================================================= */
CREATE TABLE AUDITORIA (
    idAuditoria      BIGINT IDENTITY(1,1) PRIMARY KEY,
    tabela           VARCHAR(50) NOT NULL,
    operacao         VARCHAR(10) NOT NULL,
    chavePrimaria    VARCHAR(100) NOT NULL,
    dadosAntes       NVARCHAR(MAX) NULL,
    dadosDepois      NVARCHAR(MAX) NULL,
    dataOperacao     DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    usuarioOperacao  VARCHAR(100) NOT NULL DEFAULT SUSER_SNAME()
);
GO

/* =========================================================
   ÍNDICES SECUNDÁRIOS
   ========================================================= */
CREATE INDEX idx_aluno_ra          ON ALUNO(RAaluno);
CREATE INDEX idx_aluno_status      ON ALUNO(statusAluno);
CREATE INDEX idx_professor_id      ON PROFESSOR(idProfessor);
CREATE INDEX idx_matricula_aluno   ON MATRICULA(pessoa_id);
CREATE INDEX idx_matricula_turma   ON MATRICULA(idTurma);
CREATE INDEX idx_matricula_status  ON MATRICULA(statusMatricula);
CREATE INDEX idx_cursamento_matr   ON CURSAMENTO(siMatricula);
CREATE INDEX idx_cursamento_media  ON CURSAMENTO(mediaFinal);
CREATE INDEX idx_oferta_disciplina ON OFERTADISCIPLINA(idDisciplina);
CREATE INDEX idx_oferta_professor  ON OFERTADISCIPLINA(pessoa_id);
CREATE INDEX idx_oferta_status     ON OFERTADISCIPLINA(statusOferta);
CREATE INDEX idx_nota_cursamento   ON NOTA(siMatricula, idOfertaDisciplina);
CREATE INDEX idx_nota_avaliacao    ON NOTA(idAvaliacao);
CREATE INDEX idx_avaliacao_oferta  ON AVALIACAO(idOfertaDisciplina);
CREATE INDEX idx_pessoa_cpf        ON PESSOA(cpf);
CREATE INDEX idx_disciplina_nome   ON DISCIPLINA(nomeDisciplina);
CREATE INDEX idx_turma_nome        ON TURMA(nomeTurma);
GO
