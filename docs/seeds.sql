/* =========================================================
   SISTEMA ACADÊMICO ESCOLAR - DADOS DE EXEMPLO
   Senha padrão em todos os usuários: "senha123"
   Hash bcrypt gerado com cost=12.
   - IDs e matrículas são gerados automaticamente pelo banco.
   - Capturamos os IDs gerados em variáveis para amarrar as FKs.
   ========================================================= */

USE SistemaAcademico;
GO

-- bcrypt("senha123")
DECLARE @SENHA VARCHAR(255) = '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

/* =========================================================
   PROFESSORES
   ========================================================= */
DECLARE @prof1 INT, @prof2 INT, @prof3 INT;
DECLARE @t TABLE(id INT);

INSERT @t EXEC sp_InserirProfessor 'Carlos Mendes', '111.111.111-11', '1980-04-12', 'Rua A, 100', '(11) 90000-0001', 'Mestre em Matemática',  '2018-02-01', @SENHA;
SELECT @prof1 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirProfessor 'Ana Souza',     '222.222.222-22', '1985-09-22', 'Rua B, 200', '(11) 90000-0002', 'Doutora em Letras',     '2019-08-15', @SENHA;
SELECT @prof2 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirProfessor 'Roberto Alves', '333.333.333-33', '1978-01-05', 'Rua C, 300', '(11) 90000-0003', 'Mestre em Física',      '2017-03-10', @SENHA;
SELECT @prof3 = id FROM @t; DELETE @t;

/* =========================================================
   ALUNOS
   ========================================================= */
DECLARE @al1 INT, @al2 INT, @al3 INT, @al4 INT, @al5 INT;

INSERT @t EXEC sp_InserirAluno 'João Silva',     '400.000.000-01', '2008-03-14', 'Av X, 10', '(11) 99000-0001', 'ATIVO', @SENHA;
SELECT @al1 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirAluno 'Maria Oliveira', '400.000.000-02', '2008-07-23', 'Av X, 11', '(11) 99000-0002', 'ATIVO', @SENHA;
SELECT @al2 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirAluno 'Pedro Santos',   '400.000.000-03', '2009-01-30', 'Av Y, 12', '(11) 99000-0003', 'ATIVO', @SENHA;
SELECT @al3 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirAluno 'Júlia Costa',    '400.000.000-04', '2008-11-09', 'Av Y, 13', '(11) 99000-0004', 'ATIVO', @SENHA;
SELECT @al4 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirAluno 'Lucas Pereira',  '400.000.000-05', '2009-05-17', 'Av Z, 14', '(11) 99000-0005', 'ATIVO', @SENHA;
SELECT @al5 = id FROM @t; DELETE @t;

/* =========================================================
   TURMAS
   ========================================================= */
DECLARE @turma1 INT, @turma2 INT;
INSERT @t EXEC sp_InserirTurma '1º Ano A', 'MATUTINO',   '1º Ano', 'Sala 101', 2026;
SELECT @turma1 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirTurma '1º Ano B', 'VESPERTINO', '1º Ano', 'Sala 102', 2026;
SELECT @turma2 = id FROM @t; DELETE @t;

/* =========================================================
   DISCIPLINAS
   ========================================================= */
DECLARE @disc1 INT, @disc2 INT, @disc3 INT;
INSERT @t EXEC sp_InserirDisciplina 'Matemática', 80, 'ATIVA';
SELECT @disc1 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirDisciplina 'Português',  80, 'ATIVA';
SELECT @disc2 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirDisciplina 'Física',     60, 'ATIVA';
SELECT @disc3 = id FROM @t; DELETE @t;

/* =========================================================
   OFERTAS - turma 1, 2026/1
   ========================================================= */
DECLARE @of1 INT, @of2 INT, @of3 INT;
INSERT @t EXEC sp_InserirOfertaDisciplina 2026, 1, '101', 'SEG,QUA', 6.00, 'ATIVA', @disc1, @turma1, @prof1;
SELECT @of1 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirOfertaDisciplina 2026, 1, '101', 'TER,QUI', 6.00, 'ATIVA', @disc2, @turma1, @prof2;
SELECT @of2 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirOfertaDisciplina 2026, 1, '101', 'SEX',     6.00, 'ATIVA', @disc3, @turma1, @prof3;
SELECT @of3 = id FROM @t; DELETE @t;

/* =========================================================
   MATRÍCULAS - todos os 5 alunos na turma 1, 2026/1
   ========================================================= */
DECLARE @m1 INT, @m2 INT, @m3 INT, @m4 INT, @m5 INT;
INSERT @t EXEC sp_InserirMatricula 2026, 1, '2026-02-01', 'ATIVA', @al1, @turma1;
SELECT @m1 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirMatricula 2026, 1, '2026-02-01', 'ATIVA', @al2, @turma1;
SELECT @m2 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirMatricula 2026, 1, '2026-02-01', 'ATIVA', @al3, @turma1;
SELECT @m3 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirMatricula 2026, 1, '2026-02-01', 'ATIVA', @al4, @turma1;
SELECT @m4 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirMatricula 2026, 1, '2026-02-01', 'ATIVA', @al5, @turma1;
SELECT @m5 = id FROM @t; DELETE @t;

/* ENTURMAÇÃO automática (cria CURSAMENTOs para cada matrícula) */
EXEC sp_EnturmarAluno @m1;
EXEC sp_EnturmarAluno @m2;
EXEC sp_EnturmarAluno @m3;
EXEC sp_EnturmarAluno @m4;
EXEC sp_EnturmarAluno @m5;

/* =========================================================
   AVALIAÇÕES - Matemática (oferta 1): Prova(5) + Trabalho(3) + Seminário(2)
   ========================================================= */
DECLARE @av1 INT, @av2 INT, @av3 INT, @av4 INT, @av5 INT;
INSERT @t EXEC sp_InserirAvaliacao 5.0, 'Prova Bimestral', '2026-04-15', 'PROVA',     NULL, @of1;
SELECT @av1 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirAvaliacao 3.0, 'Trabalho',        '2026-05-10', 'TRABALHO',  NULL, @of1;
SELECT @av2 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirAvaliacao 2.0, 'Seminário',       '2026-06-05', 'SEMINARIO', NULL, @of1;
SELECT @av3 = id FROM @t; DELETE @t;

/* AVALIAÇÕES - Português (oferta 2) */
INSERT @t EXEC sp_InserirAvaliacao 6.0, 'Prova',   '2026-04-20', 'PROVA',    NULL, @of2;
SELECT @av4 = id FROM @t; DELETE @t;
INSERT @t EXEC sp_InserirAvaliacao 4.0, 'Redação', '2026-05-25', 'TRABALHO', NULL, @of2;
SELECT @av5 = id FROM @t; DELETE @t;

/* NOTAS - João (m1) em Matemática */
EXEC sp_InserirNota 8.0, @m1, @of1, @av1;
EXEC sp_InserirNota 7.0, @m1, @of1, @av2;
EXEC sp_InserirNota 9.0, @m1, @of1, @av3;
GO
