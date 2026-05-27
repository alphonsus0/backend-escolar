/* Cria o banco SistemaAcademico se ainda não existir. */
IF DB_ID('SistemaAcademico') IS NULL
BEGIN
    CREATE DATABASE SistemaAcademico;
END
GO
