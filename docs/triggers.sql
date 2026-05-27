/* =========================================================
   SISTEMA ACADÊMICO ESCOLAR - TRIGGERS
   ========================================================= */

USE SistemaAcademico;
GO

/* =========================================================
   trg_GerarMatriculaAluno
   - Após inserir um ALUNO, gera matriculaAluno no formato
     'MAT-<ANO>-<RAaluno zero-padded em 6 dígitos>'.
   - O ano usado é o ano corrente do insert.
   ========================================================= */
CREATE OR ALTER TRIGGER trg_GerarMatriculaAluno
ON ALUNO
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE a
       SET a.matriculaAluno =
           CONCAT('MAT-', YEAR(SYSDATETIME()), '-',
                  RIGHT('000000' + CONVERT(VARCHAR(10), i.RAaluno), 6))
      FROM ALUNO a
      JOIN inserted i ON i.pessoa_id = a.pessoa_id
     WHERE a.matriculaAluno IS NULL;
END;
GO

/* =========================================================
   trg_GerarMatriculaProf
   - Após inserir um PROFESSOR, gera matriculaProf no formato
     'PRF-<idProfessor zero-padded em 3 dígitos>'.
   ========================================================= */
CREATE OR ALTER TRIGGER trg_GerarMatriculaProf
ON PROFESSOR
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
       SET p.matriculaProf =
           CONCAT('PRF-', RIGHT('000' + CONVERT(VARCHAR(10), i.idProfessor), 3))
      FROM PROFESSOR p
      JOIN inserted i ON i.pessoa_id = p.pessoa_id
     WHERE p.matriculaProf IS NULL;
END;
GO

/* =========================================================
   trg_ValidarMatricula
   - Garante que existe oferta ATIVA na turma+semestre+ano
     no momento da inserção da matrícula.
   ========================================================= */
CREATE OR ALTER TRIGGER trg_ValidarMatricula
ON MATRICULA
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
          FROM inserted i
         WHERE NOT EXISTS (
             SELECT 1
               FROM OFERTADISCIPLINA od
              WHERE od.idTurma     = i.idTurma
                AND od.anoLetivo   = i.anoLetivo
                AND od.semestre    = i.semestre
                AND od.statusOferta = 'ATIVA'
         )
    )
    BEGIN
        RAISERROR('Não existe oferta de disciplina ATIVA para a turma/ano/semestre informados.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

/* =========================================================
   trg_ImpedirMatriculaDuplicada
   - Defesa em profundidade caso a procedure seja contornada.
   ========================================================= */
CREATE OR ALTER TRIGGER trg_ImpedirMatriculaDuplicada
ON MATRICULA
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
          FROM inserted i
          JOIN MATRICULA m
            ON  m.pessoa_id  = i.pessoa_id
            AND m.idTurma    = i.idTurma
            AND m.anoLetivo  = i.anoLetivo
            AND m.semestre   = i.semestre
            AND m.idMatricula <> i.idMatricula
    )
    BEGIN
        RAISERROR('Aluno já matriculado nesta turma/ano/semestre.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

/* =========================================================
   trg_ValidarSomaPesos
   - Impede que a soma dos pesos das avaliações de uma oferta
     ultrapasse 10 (defesa contra escrita direta).
   ========================================================= */
CREATE OR ALTER TRIGGER trg_ValidarSomaPesos
ON AVALIACAO
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
          FROM AVALIACAO
         WHERE idOfertaDisciplina IN (SELECT idOfertaDisciplina FROM inserted)
         GROUP BY idOfertaDisciplina
        HAVING SUM(peso) > 10
    )
    BEGIN
        RAISERROR('A soma dos pesos das avaliações da oferta não pode exceder 10.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

/* =========================================================
   trg_RecalcularMediaFinal
   - Após qualquer INSERT/UPDATE/DELETE em NOTA, recalcula a
     mediaFinal e situacaoFinal de cada cursamento afetado.
   ========================================================= */
CREATE OR ALTER TRIGGER trg_RecalcularMediaFinal
ON NOTA
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @afetados TABLE (siMatricula INT, idOfertaDisciplina INT);
    INSERT INTO @afetados
        SELECT DISTINCT siMatricula, idOfertaDisciplina FROM inserted
        UNION
        SELECT DISTINCT siMatricula, idOfertaDisciplina FROM deleted;

    DECLARE @si INT, @io INT;
    DECLARE cur CURSOR FAST_FORWARD FOR
        SELECT siMatricula, idOfertaDisciplina FROM @afetados;
    OPEN cur;
    FETCH NEXT FROM cur INTO @si, @io;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC sp_CalcularMediaFinalAluno @si, @io;
        FETCH NEXT FROM cur INTO @si, @io;
    END
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

/* =========================================================
   trg_RecalcularMediaPorFaltas
   - Recalcula a situação quando o número de faltas é
     atualizado em CURSAMENTO (regra dos 25%).
   ========================================================= */
CREATE OR ALTER TRIGGER trg_RecalcularMediaPorFaltas
ON CURSAMENTO
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(faltas) RETURN;

    DECLARE @si INT, @io INT;
    DECLARE cur CURSOR FAST_FORWARD FOR
        SELECT i.siMatricula, i.idOfertaDisciplina
          FROM inserted i
          JOIN deleted d
            ON d.siMatricula = i.siMatricula AND d.idOfertaDisciplina = i.idOfertaDisciplina
         WHERE i.faltas <> d.faltas;
    OPEN cur;
    FETCH NEXT FROM cur INTO @si, @io;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC sp_CalcularMediaFinalAluno @si, @io;
        FETCH NEXT FROM cur INTO @si, @io;
    END
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

/* =========================================================
   AUDITORIA - NOTA
   ========================================================= */
CREATE OR ALTER TRIGGER trg_Audit_Nota
ON NOTA
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AUDITORIA (tabela, operacao, chavePrimaria, dadosAntes, dadosDepois)
    SELECT 'NOTA', 'UPDATE',
           CONVERT(VARCHAR(20), i.idNota),
           (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
      FROM inserted i
      JOIN deleted  d ON d.idNota = i.idNota;

    INSERT INTO AUDITORIA (tabela, operacao, chavePrimaria, dadosAntes, dadosDepois)
    SELECT 'NOTA', 'INSERT',
           CONVERT(VARCHAR(20), i.idNota),
           NULL,
           (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
      FROM inserted i
      WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.idNota = i.idNota);

    INSERT INTO AUDITORIA (tabela, operacao, chavePrimaria, dadosAntes, dadosDepois)
    SELECT 'NOTA', 'DELETE',
           CONVERT(VARCHAR(20), d.idNota),
           (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           NULL
      FROM deleted d
      WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.idNota = d.idNota);
END;
GO

/* =========================================================
   AUDITORIA - ALUNO (mudança de status)
   ========================================================= */
CREATE OR ALTER TRIGGER trg_Audit_Aluno
ON ALUNO
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AUDITORIA (tabela, operacao, chavePrimaria, dadosAntes, dadosDepois)
    SELECT 'ALUNO', 'UPDATE',
           CONVERT(VARCHAR(20), i.pessoa_id),
           (SELECT d.pessoa_id, d.RAaluno, d.matriculaAluno, d.statusAluno FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           (SELECT i.pessoa_id, i.RAaluno, i.matriculaAluno, i.statusAluno FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
      FROM inserted i
      JOIN deleted  d ON d.pessoa_id = i.pessoa_id
     WHERE i.statusAluno <> d.statusAluno
        OR i.RAaluno <> d.RAaluno
        OR i.matriculaAluno <> d.matriculaAluno;

    INSERT INTO AUDITORIA (tabela, operacao, chavePrimaria, dadosAntes, dadosDepois)
    SELECT 'ALUNO', 'DELETE',
           CONVERT(VARCHAR(20), d.pessoa_id),
           (SELECT d.pessoa_id, d.RAaluno, d.matriculaAluno, d.statusAluno FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           NULL
      FROM deleted d
      WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.pessoa_id = d.pessoa_id);
END;
GO

/* =========================================================
   AUDITORIA - MATRICULA (troca de status)
   ========================================================= */
CREATE OR ALTER TRIGGER trg_Audit_Matricula
ON MATRICULA
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(statusMatricula) RETURN;

    INSERT INTO AUDITORIA (tabela, operacao, chavePrimaria, dadosAntes, dadosDepois)
    SELECT 'MATRICULA', 'UPDATE_STATUS',
           CONVERT(VARCHAR(20), i.idMatricula),
           (SELECT d.idMatricula, d.statusMatricula FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           (SELECT i.idMatricula, i.statusMatricula FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
      FROM inserted i
      JOIN deleted  d ON d.idMatricula = i.idMatricula
     WHERE i.statusMatricula <> d.statusMatricula;
END;
GO
