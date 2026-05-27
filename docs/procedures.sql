/* =========================================================
   SISTEMA ACADÊMICO ESCOLAR - STORED PROCEDURES
   SGBD: SQL Server Express
   - PKs numéricas são IDENTITY: as procedures de inserção NÃO
     recebem o ID; ele é gerado pelo banco e devolvido via
     SELECT SCOPE_IDENTITY().
   - matriculaAluno / matriculaProf são geradas por triggers.
   ========================================================= */

USE SistemaAcademico;
GO

/* =========================================================
   PESSOA - INSERIR
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirPessoa
    @nome           VARCHAR(100),
    @cpf            VARCHAR(14),
    @dataNascimento DATE,
    @endereco       VARCHAR(255),
    @telefone       VARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM PESSOA WHERE cpf = @cpf)
            THROW 51101, 'CPF já cadastrado.', 1;

        INSERT INTO PESSOA (nome, cpf, dataNascimento, endereco, telefone)
        VALUES (@nome, @cpf, @dataNascimento, @endereco, @telefone);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS pessoa_id;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

/* =========================================================
   ALUNO - INSERIR (transação PESSOA + ALUNO)
   - Não recebe pessoa_id, RAaluno nem matriculaAluno:
     pessoa_id é IDENTITY, RAaluno tem DEFAULT (sequence),
     matriculaAluno é gerada por trigger.
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirAluno
    @nome           VARCHAR(100),
    @cpf            VARCHAR(14),
    @dataNascimento DATE,
    @endereco       VARCHAR(255),
    @telefone       VARCHAR(15),
    @statusAluno    VARCHAR(20),
    @senha          VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM PESSOA WHERE cpf = @cpf)
            THROW 51101, 'CPF já cadastrado.', 1;

        BEGIN TRANSACTION;

        INSERT INTO PESSOA (nome, cpf, dataNascimento, endereco, telefone)
        VALUES (@nome, @cpf, @dataNascimento, @endereco, @telefone);

        DECLARE @novo_pessoa_id INT = CAST(SCOPE_IDENTITY() AS INT);

        INSERT INTO ALUNO (pessoa_id, statusAluno, senha)
        VALUES (@novo_pessoa_id, @statusAluno, @senha);

        COMMIT TRANSACTION;

        SELECT @novo_pessoa_id AS pessoa_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   ALUNO - ATUALIZAR
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_AtualizarAluno
    @pessoa_id      INT,
    @nome           VARCHAR(100) = NULL,
    @cpf            VARCHAR(14)  = NULL,
    @dataNascimento DATE         = NULL,
    @endereco       VARCHAR(255) = NULL,
    @telefone       VARCHAR(15)  = NULL,
    @statusAluno    VARCHAR(20)  = NULL,
    @senha          VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ALUNO WHERE pessoa_id = @pessoa_id)
            THROW 51120, 'Aluno não encontrado.', 1;

        IF @cpf IS NOT NULL AND EXISTS (
            SELECT 1 FROM PESSOA WHERE cpf = @cpf AND pessoa_id <> @pessoa_id
        )
            THROW 51121, 'CPF já em uso por outra pessoa.', 1;

        BEGIN TRANSACTION;

        UPDATE PESSOA SET
            nome           = COALESCE(@nome, nome),
            cpf            = COALESCE(@cpf, cpf),
            dataNascimento = COALESCE(@dataNascimento, dataNascimento),
            endereco       = COALESCE(@endereco, endereco),
            telefone       = COALESCE(@telefone, telefone)
        WHERE pessoa_id = @pessoa_id;

        UPDATE ALUNO SET
            statusAluno    = COALESCE(@statusAluno, statusAluno),
            senha          = COALESCE(@senha, senha)
        WHERE pessoa_id = @pessoa_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   ALUNO - DELETAR
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_DeletarAluno
    @pessoa_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ALUNO WHERE pessoa_id = @pessoa_id)
            THROW 51130, 'Aluno não encontrado.', 1;

        IF EXISTS (SELECT 1 FROM MATRICULA WHERE pessoa_id = @pessoa_id)
            THROW 51131, 'Não é possível excluir este aluno: existem matrículas vinculadas.', 1;

        BEGIN TRANSACTION;
        DELETE FROM ALUNO  WHERE pessoa_id = @pessoa_id;
        DELETE FROM PESSOA WHERE pessoa_id = @pessoa_id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   PROFESSOR - INSERIR
   - Não recebe pessoa_id, idProfessor nem matriculaProf.
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirProfessor
    @nome           VARCHAR(100),
    @cpf            VARCHAR(14),
    @dataNascimento DATE,
    @endereco       VARCHAR(255),
    @telefone       VARCHAR(15),
    @prof_Formacao  VARCHAR(100),
    @dataAdmissao   DATE,
    @senha          VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM PESSOA WHERE cpf = @cpf)
            THROW 51101, 'CPF já cadastrado.', 1;

        BEGIN TRANSACTION;

        INSERT INTO PESSOA (nome, cpf, dataNascimento, endereco, telefone)
        VALUES (@nome, @cpf, @dataNascimento, @endereco, @telefone);

        DECLARE @novo_pessoa_id INT = CAST(SCOPE_IDENTITY() AS INT);

        INSERT INTO PROFESSOR (pessoa_id, prof_Formacao, dataAdmissao, senha)
        VALUES (@novo_pessoa_id, @prof_Formacao, @dataAdmissao, @senha);

        COMMIT TRANSACTION;

        SELECT @novo_pessoa_id AS pessoa_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   PROFESSOR - ATUALIZAR
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_AtualizarProfessor
    @pessoa_id      INT,
    @nome           VARCHAR(100) = NULL,
    @cpf            VARCHAR(14)  = NULL,
    @dataNascimento DATE         = NULL,
    @endereco       VARCHAR(255) = NULL,
    @telefone       VARCHAR(15)  = NULL,
    @prof_Formacao  VARCHAR(100) = NULL,
    @dataAdmissao   DATE         = NULL,
    @senha          VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM PROFESSOR WHERE pessoa_id = @pessoa_id)
            THROW 51150, 'Professor não encontrado.', 1;

        BEGIN TRANSACTION;
        UPDATE PESSOA SET
            nome           = COALESCE(@nome, nome),
            cpf            = COALESCE(@cpf, cpf),
            dataNascimento = COALESCE(@dataNascimento, dataNascimento),
            endereco       = COALESCE(@endereco, endereco),
            telefone       = COALESCE(@telefone, telefone)
        WHERE pessoa_id = @pessoa_id;

        UPDATE PROFESSOR SET
            prof_Formacao = COALESCE(@prof_Formacao, prof_Formacao),
            dataAdmissao  = COALESCE(@dataAdmissao, dataAdmissao),
            senha         = COALESCE(@senha, senha)
        WHERE pessoa_id = @pessoa_id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   PROFESSOR - DELETAR
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_DeletarProfessor
    @pessoa_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM PROFESSOR WHERE pessoa_id = @pessoa_id)
            THROW 51160, 'Professor não encontrado.', 1;
        IF EXISTS (SELECT 1 FROM OFERTADISCIPLINA WHERE pessoa_id = @pessoa_id)
            THROW 51161, 'Professor possui ofertas de disciplina vinculadas.', 1;

        BEGIN TRANSACTION;
        DELETE FROM PROFESSOR WHERE pessoa_id = @pessoa_id;
        DELETE FROM PESSOA    WHERE pessoa_id = @pessoa_id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   TURMA - CRUD
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirTurma
    @nomeTurma  VARCHAR(100),
    @turno      VARCHAR(20),
    @serie      VARCHAR(20),
    @salasTurma VARCHAR(20),
    @anoLetivo  INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO TURMA (nomeTurma, turno, serie, salasTurma, anoLetivo)
        VALUES (@nomeTurma, @turno, @serie, @salasTurma, @anoLetivo);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS idTurma;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AtualizarTurma
    @idTurma    INT,
    @nomeTurma  VARCHAR(100) = NULL,
    @turno      VARCHAR(20)  = NULL,
    @serie      VARCHAR(20)  = NULL,
    @salasTurma VARCHAR(20)  = NULL,
    @anoLetivo  INT          = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM TURMA WHERE idTurma = @idTurma)
            THROW 51171, 'Turma não encontrada.', 1;
        UPDATE TURMA SET
            nomeTurma  = COALESCE(@nomeTurma, nomeTurma),
            turno      = COALESCE(@turno, turno),
            serie      = COALESCE(@serie, serie),
            salasTurma = COALESCE(@salasTurma, salasTurma),
            anoLetivo  = COALESCE(@anoLetivo, anoLetivo)
        WHERE idTurma = @idTurma;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DeletarTurma
    @idTurma INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM MATRICULA WHERE idTurma = @idTurma)
            THROW 51172, 'Turma possui matrículas vinculadas.', 1;
        IF EXISTS (SELECT 1 FROM OFERTADISCIPLINA WHERE idTurma = @idTurma)
            THROW 51173, 'Turma possui ofertas de disciplina vinculadas.', 1;
        DELETE FROM TURMA WHERE idTurma = @idTurma;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

/* =========================================================
   DISCIPLINA - CRUD
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirDisciplina
    @nomeDisciplina   VARCHAR(100),
    @cargaHoraria     INT,
    @statusDisciplina VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO DISCIPLINA (nomeDisciplina, cargaHoraria, statusDisciplina)
        VALUES (@nomeDisciplina, @cargaHoraria, @statusDisciplina);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS idDisciplina;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AtualizarDisciplina
    @idDisciplina     INT,
    @nomeDisciplina   VARCHAR(100) = NULL,
    @cargaHoraria     INT          = NULL,
    @statusDisciplina VARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DISCIPLINA WHERE idDisciplina = @idDisciplina)
            THROW 51181, 'Disciplina não encontrada.', 1;
        UPDATE DISCIPLINA SET
            nomeDisciplina   = COALESCE(@nomeDisciplina, nomeDisciplina),
            cargaHoraria     = COALESCE(@cargaHoraria, cargaHoraria),
            statusDisciplina = COALESCE(@statusDisciplina, statusDisciplina)
        WHERE idDisciplina = @idDisciplina;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DeletarDisciplina
    @idDisciplina INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM OFERTADISCIPLINA WHERE idDisciplina = @idDisciplina)
            THROW 51182, 'Disciplina possui ofertas no histórico — não pode ser excluída.', 1;
        DELETE FROM DISCIPLINA WHERE idDisciplina = @idDisciplina;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

/* =========================================================
   OFERTADISCIPLINA - CRUD
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirOfertaDisciplina
    @anoLetivo          INT,
    @semestre           INT,
    @sala               VARCHAR(10),
    @diaOferta          VARCHAR(255),
    @mediaAprovacao     DECIMAL(5,2),
    @statusOferta       VARCHAR(20),
    @idDisciplina       INT,
    @idTurma            INT,
    @pessoa_id          INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DISCIPLINA WHERE idDisciplina = @idDisciplina AND statusDisciplina = 'ATIVA')
            THROW 51191, 'Disciplina inexistente ou inativa.', 1;
        IF NOT EXISTS (SELECT 1 FROM TURMA WHERE idTurma = @idTurma)
            THROW 51192, 'Turma inexistente.', 1;
        IF NOT EXISTS (SELECT 1 FROM PROFESSOR WHERE pessoa_id = @pessoa_id)
            THROW 51193, 'Professor inexistente.', 1;

        INSERT INTO OFERTADISCIPLINA (
            anoLetivo, semestre, sala, diaOferta,
            mediaAprovacao, statusOferta, idDisciplina, idTurma, pessoa_id
        ) VALUES (
            @anoLetivo, @semestre, @sala, @diaOferta,
            @mediaAprovacao, @statusOferta, @idDisciplina, @idTurma, @pessoa_id
        );

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS idOfertaDisciplina;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AtualizarOfertaDisciplina
    @idOfertaDisciplina INT,
    @anoLetivo          INT          = NULL,
    @semestre           INT          = NULL,
    @sala               VARCHAR(10)  = NULL,
    @diaOferta          VARCHAR(255) = NULL,
    @mediaAprovacao     DECIMAL(5,2) = NULL,
    @statusOferta       VARCHAR(20)  = NULL,
    @idDisciplina       INT          = NULL,
    @idTurma            INT          = NULL,
    @pessoa_id          INT          = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM OFERTADISCIPLINA WHERE idOfertaDisciplina = @idOfertaDisciplina)
            THROW 51194, 'Oferta não encontrada.', 1;
        UPDATE OFERTADISCIPLINA SET
            anoLetivo      = COALESCE(@anoLetivo, anoLetivo),
            semestre       = COALESCE(@semestre, semestre),
            sala           = COALESCE(@sala, sala),
            diaOferta      = COALESCE(@diaOferta, diaOferta),
            mediaAprovacao = COALESCE(@mediaAprovacao, mediaAprovacao),
            statusOferta   = COALESCE(@statusOferta, statusOferta),
            idDisciplina   = COALESCE(@idDisciplina, idDisciplina),
            idTurma        = COALESCE(@idTurma, idTurma),
            pessoa_id      = COALESCE(@pessoa_id, pessoa_id)
        WHERE idOfertaDisciplina = @idOfertaDisciplina;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DeletarOfertaDisciplina
    @idOfertaDisciplina INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM CURSAMENTO WHERE idOfertaDisciplina = @idOfertaDisciplina)
            THROW 51195, 'Existem alunos cursando esta oferta.', 1;

        BEGIN TRANSACTION;
        DELETE FROM AVALIACAO        WHERE idOfertaDisciplina = @idOfertaDisciplina;
        DELETE FROM OFERTADISCIPLINA WHERE idOfertaDisciplina = @idOfertaDisciplina;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   MATRICULA - CRUD
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirMatricula
    @anoLetivo       INT,
    @semestre        INT,
    @dataMatricula   DATE,
    @statusMatricula VARCHAR(20),
    @pessoa_id       INT,
    @idTurma         INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ALUNO WHERE pessoa_id = @pessoa_id)
            THROW 51201, 'Aluno inexistente.', 1;
        IF NOT EXISTS (SELECT 1 FROM TURMA WHERE idTurma = @idTurma)
            THROW 51202, 'Turma inexistente.', 1;
        IF EXISTS (
            SELECT 1 FROM MATRICULA
            WHERE pessoa_id = @pessoa_id
              AND idTurma   = @idTurma
              AND anoLetivo = @anoLetivo
              AND semestre  = @semestre
        )
            THROW 51203, 'Aluno já possui matrícula nesta turma/semestre.', 1;

        INSERT INTO MATRICULA (
            anoLetivo, semestre, dataMatricula,
            statusMatricula, pessoa_id, idTurma
        ) VALUES (
            @anoLetivo, @semestre, @dataMatricula,
            @statusMatricula, @pessoa_id, @idTurma
        );

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS idMatricula;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AtualizarMatricula
    @idMatricula     INT,
    @statusMatricula VARCHAR(20) = NULL,
    @dataMatricula   DATE        = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM MATRICULA WHERE idMatricula = @idMatricula)
            THROW 51204, 'Matrícula não encontrada.', 1;
        UPDATE MATRICULA SET
            statusMatricula = COALESCE(@statusMatricula, statusMatricula),
            dataMatricula   = COALESCE(@dataMatricula, dataMatricula)
        WHERE idMatricula = @idMatricula;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DeletarMatricula
    @idMatricula INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM CURSAMENTO WHERE siMatricula = @idMatricula)
            THROW 51205, 'Matrícula possui cursamentos vinculados.', 1;
        DELETE FROM MATRICULA WHERE idMatricula = @idMatricula;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

/* =========================================================
   AVALIACAO - CRUD
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirAvaliacao
    @peso               DECIMAL(5,2),
    @nomeAvaliacao      VARCHAR(100),
    @dataAvaliacao      DATE,
    @tipoAvaliacao      VARCHAR(50),
    @descAvaliacao      VARCHAR(255) = NULL,
    @idOfertaDisciplina INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM OFERTADISCIPLINA WHERE idOfertaDisciplina = @idOfertaDisciplina)
            THROW 51211, 'Oferta de disciplina inexistente.', 1;

        DECLARE @somaPesos DECIMAL(5,2) = (
            SELECT COALESCE(SUM(peso),0) FROM AVALIACAO
            WHERE idOfertaDisciplina = @idOfertaDisciplina
        );
        IF (@somaPesos + @peso) > 10
            THROW 51212, 'Soma dos pesos das avaliações ultrapassa 10.', 1;

        INSERT INTO AVALIACAO (
            peso, nomeAvaliacao, dataAvaliacao,
            tipoAvaliacao, descAvaliacao, idOfertaDisciplina
        ) VALUES (
            @peso, @nomeAvaliacao, @dataAvaliacao,
            @tipoAvaliacao, @descAvaliacao, @idOfertaDisciplina
        );

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS idAvaliacao;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AtualizarAvaliacao
    @idAvaliacao   INT,
    @peso          DECIMAL(5,2) = NULL,
    @nomeAvaliacao VARCHAR(100) = NULL,
    @dataAvaliacao DATE         = NULL,
    @tipoAvaliacao VARCHAR(50)  = NULL,
    @descAvaliacao VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM AVALIACAO WHERE idAvaliacao = @idAvaliacao)
            THROW 51213, 'Avaliação não encontrada.', 1;

        IF @peso IS NOT NULL
        BEGIN
            DECLARE @idOferta INT, @pesoAtual DECIMAL(5,2);
            SELECT @idOferta = idOfertaDisciplina, @pesoAtual = peso
              FROM AVALIACAO WHERE idAvaliacao = @idAvaliacao;
            DECLARE @somaOutros DECIMAL(5,2) = (
                SELECT COALESCE(SUM(peso),0) FROM AVALIACAO
                WHERE idOfertaDisciplina = @idOferta AND idAvaliacao <> @idAvaliacao
            );
            IF (@somaOutros + @peso) > 10
                THROW 51214, 'Soma dos pesos das avaliações ultrapassa 10.', 1;
        END

        UPDATE AVALIACAO SET
            peso          = COALESCE(@peso, peso),
            nomeAvaliacao = COALESCE(@nomeAvaliacao, nomeAvaliacao),
            dataAvaliacao = COALESCE(@dataAvaliacao, dataAvaliacao),
            tipoAvaliacao = COALESCE(@tipoAvaliacao, tipoAvaliacao),
            descAvaliacao = COALESCE(@descAvaliacao, descAvaliacao)
        WHERE idAvaliacao = @idAvaliacao;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DeletarAvaliacao
    @idAvaliacao INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM NOTA WHERE idAvaliacao = @idAvaliacao)
            THROW 51215, 'Avaliação possui notas lançadas — não pode ser excluída.', 1;
        DELETE FROM AVALIACAO WHERE idAvaliacao = @idAvaliacao;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

/* =========================================================
   CURSAMENTO - CRUD
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirCursamento
    @siMatricula        INT,
    @idOfertaDisciplina INT,
    @faltas             INT = 0,
    @obs                VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (
            SELECT 1 FROM CURSAMENTO
            WHERE siMatricula = @siMatricula AND idOfertaDisciplina = @idOfertaDisciplina
        )
            THROW 51220, 'Cursamento já existe.', 1;
        IF NOT EXISTS (SELECT 1 FROM MATRICULA WHERE idMatricula = @siMatricula)
            THROW 51221, 'Matrícula inexistente.', 1;
        IF NOT EXISTS (SELECT 1 FROM OFERTADISCIPLINA WHERE idOfertaDisciplina = @idOfertaDisciplina)
            THROW 51222, 'Oferta de disciplina inexistente.', 1;

        INSERT INTO CURSAMENTO (siMatricula, idOfertaDisciplina, mediaFinal, faltas, situacaoFinal, obs)
        VALUES (@siMatricula, @idOfertaDisciplina, NULL, @faltas, 'EM_CURSO', @obs);
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AtualizarCursamento
    @siMatricula        INT,
    @idOfertaDisciplina INT,
    @faltas             INT = NULL,
    @situacaoFinal      VARCHAR(20) = NULL,
    @obs                VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM CURSAMENTO
            WHERE siMatricula = @siMatricula AND idOfertaDisciplina = @idOfertaDisciplina
        )
            THROW 51223, 'Cursamento não encontrado.', 1;

        UPDATE CURSAMENTO SET
            faltas        = COALESCE(@faltas, faltas),
            situacaoFinal = COALESCE(@situacaoFinal, situacaoFinal),
            obs           = COALESCE(@obs, obs)
        WHERE siMatricula = @siMatricula AND idOfertaDisciplina = @idOfertaDisciplina;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DeletarCursamento
    @siMatricula        INT,
    @idOfertaDisciplina INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM NOTA       WHERE siMatricula = @siMatricula AND idOfertaDisciplina = @idOfertaDisciplina;
        DELETE FROM CURSAMENTO WHERE siMatricula = @siMatricula AND idOfertaDisciplina = @idOfertaDisciplina;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   NOTA - CRUD
   ========================================================= */
CREATE OR ALTER PROCEDURE sp_InserirNota
    @nota               DECIMAL(5,2),
    @siMatricula        INT,
    @idOfertaDisciplina INT,
    @idAvaliacao        INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM CURSAMENTO
            WHERE siMatricula = @siMatricula AND idOfertaDisciplina = @idOfertaDisciplina
        )
            THROW 51231, 'Cursamento inexistente para esta matrícula/oferta.', 1;
        IF NOT EXISTS (SELECT 1 FROM AVALIACAO WHERE idAvaliacao = @idAvaliacao)
            THROW 51232, 'Avaliação inexistente.', 1;
        IF EXISTS (
            SELECT 1 FROM NOTA
            WHERE idAvaliacao = @idAvaliacao
              AND siMatricula = @siMatricula
              AND idOfertaDisciplina = @idOfertaDisciplina
        )
            THROW 51233, 'Já existe nota para este aluno nesta avaliação.', 1;

        INSERT INTO NOTA (nota, siMatricula, idOfertaDisciplina, idAvaliacao)
        VALUES (@nota, @siMatricula, @idOfertaDisciplina, @idAvaliacao);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS idNota;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AtualizarNota
    @idNota INT,
    @nota   DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NOTA WHERE idNota = @idNota)
            THROW 51234, 'Nota não encontrada.', 1;
        UPDATE NOTA SET nota = @nota WHERE idNota = @idNota;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DeletarNota
    @idNota INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NOTA WHERE idNota = @idNota)
            THROW 51235, 'Nota não encontrada.', 1;
        DELETE FROM NOTA WHERE idNota = @idNota;
    END TRY
    BEGIN CATCH THROW; END CATCH
END;
GO

/* =========================================================
   PROCEDURES ACADÊMICAS
   ========================================================= */

/* Recalcula média ponderada de UM cursamento.
   Fórmula: SUM(nota * peso) / SUM(peso) — sobre TODAS as avaliações
   da oferta (avaliações sem nota lançada contam zero). */
CREATE OR ALTER PROCEDURE sp_CalcularMediaFinalAluno
    @siMatricula        INT,
    @idOfertaDisciplina INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @somaPesos     DECIMAL(10,4);
    DECLARE @somaNotaPeso  DECIMAL(10,4);
    DECLARE @mediaAprov    DECIMAL(5,2);
    DECLARE @faltas        INT;
    DECLARE @cargaHoraria  INT;
    DECLARE @limiteFaltas  INT;

    SELECT @somaPesos = COALESCE(SUM(a.peso), 0)
      FROM AVALIACAO a
     WHERE a.idOfertaDisciplina = @idOfertaDisciplina;

    SELECT @somaNotaPeso = COALESCE(SUM(n.nota * a.peso), 0)
      FROM AVALIACAO a
      LEFT JOIN NOTA n
        ON n.idAvaliacao        = a.idAvaliacao
       AND n.siMatricula        = @siMatricula
       AND n.idOfertaDisciplina = @idOfertaDisciplina
     WHERE a.idOfertaDisciplina = @idOfertaDisciplina;

    SELECT @mediaAprov = od.mediaAprovacao,
           @cargaHoraria = d.cargaHoraria
      FROM OFERTADISCIPLINA od
      JOIN DISCIPLINA d ON d.idDisciplina = od.idDisciplina
     WHERE od.idOfertaDisciplina = @idOfertaDisciplina;

    SELECT @faltas = faltas
      FROM CURSAMENTO
     WHERE siMatricula = @siMatricula AND idOfertaDisciplina = @idOfertaDisciplina;

    -- limite de 25% da carga horária
    SET @limiteFaltas = CAST(@cargaHoraria * 0.25 AS INT);

    DECLARE @media    DECIMAL(5,2) = CASE WHEN @somaPesos = 0 THEN NULL
                                          ELSE CAST(@somaNotaPeso / @somaPesos AS DECIMAL(5,2)) END;
    DECLARE @situacao VARCHAR(20);

    IF @faltas > @limiteFaltas
        SET @situacao = 'REPROVADO_FALTAS';
    ELSE IF @media IS NULL
        SET @situacao = 'EM_CURSO';
    ELSE IF @media >= @mediaAprov
        SET @situacao = 'APROVADO';
    ELSE
        SET @situacao = 'REPROVADO';

    UPDATE CURSAMENTO
       SET mediaFinal    = @media,
           situacaoFinal = @situacao
     WHERE siMatricula        = @siMatricula
       AND idOfertaDisciplina = @idOfertaDisciplina;
END;
GO

/* Enturmação automática: cria CURSAMENTOs para todas as ofertas
   ATIVAs da turma+semestre da matrícula. */
CREATE OR ALTER PROCEDURE sp_EnturmarAluno
    @idMatricula INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @idTurma INT, @anoLetivo INT, @semestre INT;

        SELECT @idTurma = idTurma, @anoLetivo = anoLetivo, @semestre = semestre
          FROM MATRICULA WHERE idMatricula = @idMatricula;

        IF @idTurma IS NULL
            THROW 51300, 'Matrícula não encontrada.', 1;

        BEGIN TRANSACTION;

        INSERT INTO CURSAMENTO (siMatricula, idOfertaDisciplina, mediaFinal, faltas, situacaoFinal, obs)
        SELECT @idMatricula, od.idOfertaDisciplina, NULL, 0, 'EM_CURSO', NULL
          FROM OFERTADISCIPLINA od
         WHERE od.idTurma   = @idTurma
           AND od.anoLetivo = @anoLetivo
           AND od.semestre  = @semestre
           AND od.statusOferta = 'ATIVA'
           AND NOT EXISTS (
               SELECT 1 FROM CURSAMENTO c
                WHERE c.siMatricula        = @idMatricula
                  AND c.idOfertaDisciplina = od.idOfertaDisciplina
           );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* Fecha um semestre inteiro: encerra ofertas, calcula médias
   finais de todos os cursamentos e finaliza matrículas. */
CREATE OR ALTER PROCEDURE sp_FecharSemestre
    @anoLetivo INT,
    @semestre  INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @cur CURSOR;
        DECLARE @si INT, @io INT;

        SET @cur = CURSOR FAST_FORWARD FOR
            SELECT c.siMatricula, c.idOfertaDisciplina
              FROM CURSAMENTO c
              JOIN OFERTADISCIPLINA od ON od.idOfertaDisciplina = c.idOfertaDisciplina
             WHERE od.anoLetivo = @anoLetivo
               AND od.semestre  = @semestre;

        OPEN @cur;
        FETCH NEXT FROM @cur INTO @si, @io;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            EXEC sp_CalcularMediaFinalAluno @si, @io;
            FETCH NEXT FROM @cur INTO @si, @io;
        END
        CLOSE @cur;
        DEALLOCATE @cur;

        UPDATE OFERTADISCIPLINA
           SET statusOferta = 'ENCERRADA'
         WHERE anoLetivo = @anoLetivo AND semestre = @semestre;

        UPDATE MATRICULA
           SET statusMatricula = 'FINALIZADA'
         WHERE anoLetivo = @anoLetivo
           AND semestre  = @semestre
           AND statusMatricula = 'ATIVA';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
