class AppError(Exception):
    """Erro de domínio da aplicação."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Registro não encontrado") -> None:
        super().__init__(message, status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflito de dados") -> None:
        super().__init__(message, status_code=409)


class BusinessRuleError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=422)


class DatabaseConfigError(AppError):
    def __init__(
        self,
        message: str = (
            "DATABASE_URL não configurada. Copie .env.example para .env "
            "na raiz do projeto e defina a conexão com o SQL Server."
        ),
    ) -> None:
        super().__init__(message, status_code=503)
