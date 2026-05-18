-- Referência do schema (somente leitura — não executar no backend).

-- Tabela PESSOA
CREATE TABLE PESSOA (
    pessoa_id INTEGER PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    dataNascimento DATE NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    telefone VARCHAR(15) NOT NULL
);

-- Tabela ALUNO
CREATE TABLE ALUNO (
    pessoa_id INTEGER PRIMARY KEY,
    RAaluno INTEGER NOT NULL UNIQUE,
    matriculaAluno VARCHAR(20) NOT NULL,
    statusAluno VARCHAR(20) NOT NULL,
    FOREIGN KEY (pessoa_id) REFERENCES PESSOA(pessoa_id)
);

-- Tabela PROFESSOR
CREATE TABLE PROFESSOR (
    pessoa_id INTEGER PRIMARY KEY,
    idProfessor INTEGER NOT NULL UNIQUE,
    matriculaProf VARCHAR(20) NOT NULL,
    prof_Formacao VARCHAR(100) NOT NULL,
    dataAdmissao DATE NOT NULL,
    FOREIGN KEY (pessoa_id) REFERENCES PESSOA(pessoa_id)
);

-- Tabela TURMA
CREATE TABLE TURMA (
    idTurma INTEGER PRIMARY KEY,
    nomeTurma VARCHAR(100) NOT NULL,
    turno VARCHAR(20) NOT NULL,
    serie VARCHAR(20) NOT NULL,
    salasTurma VARCHAR(20) NOT NULL,
    anoLetivo INTEGER NOT NULL
);

-- Tabela DISCIPLINA
CREATE TABLE DISCIPLINA (
    idDisciplina INTEGER PRIMARY KEY,
    nomeDisciplina VARCHAR(100) NOT NULL,
    cargaHoraria INTEGER NOT NULL,
    statusDisciplina VARCHAR(20) NOT NULL
);

-- Tabela MATRICULA
CREATE TABLE MATRICULA (
    idMatricula INTEGER PRIMARY KEY,
    anoLetivo INTEGER NOT NULL,
    semestre INTEGER NOT NULL,
    dataMatricula DATE NOT NULL,
    statusMatricula VARCHAR(20) NOT NULL,
    pessoa_id INTEGER NOT NULL,
    idTurma INTEGER NOT NULL,
    FOREIGN KEY (pessoa_id) REFERENCES ALUNO(pessoa_id),
    FOREIGN KEY (idTurma) REFERENCES TURMA(idTurma)
);

-- Tabela OFERTADISCIPLINA
CREATE TABLE OFERTADISCIPLINA (
    idOfertaDisciplina INTEGER PRIMARY KEY,
    anoLetivo INTEGER NOT NULL,
    semestre INTEGER NOT NULL,
    sala VARCHAR(10) NOT NULL,
    diaOferta VARCHAR(255) NOT NULL,
    mediaAprovacao DECIMAL(5,2) NOT NULL,
    statusOferta VARCHAR(20) NOT NULL,
    idDisciplina INTEGER NOT NULL,
    idTurma INTEGER NOT NULL,
    pessoa_id INTEGER NOT NULL,
    FOREIGN KEY (idDisciplina) REFERENCES DISCIPLINA(idDisciplina),
    FOREIGN KEY (idTurma) REFERENCES TURMA(idTurma),
    FOREIGN KEY (pessoa_id) REFERENCES PROFESSOR(pessoa_id)
);

-- Tabela CURSAMENTO
CREATE TABLE CURSAMENTO (
    siMatricula INTEGER NOT NULL,
    idOfertaDisciplina INTEGER NOT NULL,
    mediaFinal DECIMAL(5,2) NOT NULL,
    faltas INTEGER NOT NULL,
    situacaoFinal VARCHAR(20) NOT NULL,
    obs VARCHAR(255),
    PRIMARY KEY (siMatricula, idOfertaDisciplina),
    FOREIGN KEY (siMatricula) REFERENCES MATRICULA(idMatricula),
    FOREIGN KEY (idOfertaDisciplina) REFERENCES OFERTADISCIPLINA(idOfertaDisciplina)
);

-- Tabela NOTA
CREATE TABLE NOTA (
    idNota INTEGER PRIMARY KEY,
    nota DECIMAL(5,2) NOT NULL,
    siMatricula INTEGER NOT NULL,
    idOfertaDisciplina INTEGER NOT NULL,
    FOREIGN KEY (siMatricula, idOfertaDisciplina) REFERENCES CURSAMENTO(siMatricula, idOfertaDisciplina)
);

-- Tabela AVALIACAO
CREATE TABLE AVALIACAO (
    idAvaliacao INTEGER PRIMARY KEY,
    peso DECIMAL(3,2) NOT NULL,
    nomeAvaliacao VARCHAR(100) NOT NULL,
    dataAvaliacao DATE NOT NULL,
    tipoAvaliacao VARCHAR(50) NOT NULL,
    descAvaliacao VARCHAR(255),
    idNota INTEGER NOT NULL,
    idOfertaDisciplina INTEGER NOT NULL,
    FOREIGN KEY (idNota) REFERENCES NOTA(idNota),
    FOREIGN KEY (idOfertaDisciplina) REFERENCES OFERTADISCIPLINA(idOfertaDisciplina)
);
