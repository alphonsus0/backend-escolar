from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.aluno import Aluno
from app.models.matricula import Matricula
from app.models.pessoa import Pessoa
from app.models.professor import Professor
from app.schemas.aluno import AlunoCreateSchema, AlunoUpdateSchema

class AlunoService:
    """Operações de negócio da entidade ALUNO (PESSOA + ALUNO)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Aluno]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")

        stmt = (
            select(Aluno)
            .options(joinedload(Aluno.pessoa))
            .order_by(Aluno.pessoa_id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).unique().all())

    def buscar_por_id(self, pessoa_id: int) -> Aluno:
        aluno = self._get_aluno_or_none(pessoa_id)
        if aluno is None:
            raise NotFoundError(f"Aluno com pessoa_id={pessoa_id} não encontrado")
        return aluno

    def criar(self, dados: AlunoCreateSchema) -> Aluno:
        self._validar_status_aluno(dados.statusAluno)
        self._validar_pessoa_id_disponivel(dados.pessoa_id)
        self._validar_cpf_unico(dados.cpf)
        self._validar_ra_unico(dados.RAaluno)

        pessoa = Pessoa(
            pessoa_id=dados.pessoa_id,
            nome=dados.nome,
            cpf=dados.cpf,
            dataNascimento=dados.dataNascimento,
            endereco=dados.endereco,
            telefone=dados.telefone,
        )
        aluno = Aluno(
            pessoa_id=dados.pessoa_id,
            RAaluno=dados.RAaluno,
            matriculaAluno=dados.matriculaAluno,
            statusAluno=dados.statusAluno,
            pessoa=pessoa,
        )

        try:
            self.db.add(pessoa)
            self.db.add(aluno)
            self.db.commit()
            self.db.refresh(aluno)
            self.db.refresh(pessoa)
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(self._mensagem_integridade(exc)) from exc

        return self.buscar_por_id(aluno.pessoa_id)

    def atualizar(self, pessoa_id: int, dados: AlunoUpdateSchema) -> Aluno:
        aluno = self.buscar_por_id(pessoa_id)
        pessoa = aluno.pessoa
        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")

        if "statusAluno" in payload:
            self._validar_status_aluno(payload["statusAluno"])

        if "cpf" in payload and payload["cpf"] != pessoa.cpf:
            self._validar_cpf_unico(payload["cpf"], ignorar_pessoa_id=pessoa_id)

        if "RAaluno" in payload and payload["RAaluno"] != aluno.RAaluno:
            self._validar_ra_unico(payload["RAaluno"], ignorar_pessoa_id=pessoa_id)

        campos_pessoa = ("nome", "cpf", "dataNascimento", "endereco", "telefone")
        for campo in campos_pessoa:
            if campo in payload:
                setattr(pessoa, campo, payload[campo])

        campos_aluno = ("RAaluno", "matriculaAluno", "statusAluno")
        for campo in campos_aluno:
            if campo in payload:
                setattr(aluno, campo, payload[campo])

        try:
            self.db.commit()
            self.db.refresh(aluno)
            self.db.refresh(pessoa)
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(self._mensagem_integridade(exc)) from exc

        return aluno

    def remover(self, pessoa_id: int) -> None:
        aluno = self.buscar_por_id(pessoa_id)
        self._validar_remocao_sem_matriculas(pessoa_id)

        pessoa = aluno.pessoa
        try:
            self.db.delete(aluno)
            self.db.delete(pessoa)
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                "Não é possível remover o aluno: existem registros vinculados no banco"
            ) from exc

    def _get_aluno_or_none(self, pessoa_id: int) -> Aluno | None:
        stmt = (
            select(Aluno)
            .options(joinedload(Aluno.pessoa))
            .where(Aluno.pessoa_id == pessoa_id)
        )
        return self.db.scalars(stmt).unique().first()

    def _validar_pessoa_id_disponivel(self, pessoa_id: int) -> None:
        if self.db.get(Pessoa, pessoa_id) is not None:
            raise ConflictError(f"pessoa_id={pessoa_id} já está cadastrado em PESSOA")
        if self.db.get(Professor, pessoa_id) is not None:
            raise ConflictError(f"pessoa_id={pessoa_id} já pertence a um professor")

    def _validar_cpf_unico(self, cpf: str, *, ignorar_pessoa_id: int | None = None) -> None:
        stmt = select(Pessoa).where(Pessoa.cpf == cpf)
        if ignorar_pessoa_id is not None:
            stmt = stmt.where(Pessoa.pessoa_id != ignorar_pessoa_id)
        if self.db.scalars(stmt).first() is not None:
            raise ConflictError(f"CPF {cpf} já cadastrado")

    def _validar_ra_unico(self, ra: int, *, ignorar_pessoa_id: int | None = None) -> None:
        stmt = select(Aluno).where(Aluno.RAaluno == ra)
        if ignorar_pessoa_id is not None:
            stmt = stmt.where(Aluno.pessoa_id != ignorar_pessoa_id)
        if self.db.scalars(stmt).first() is not None:
            raise ConflictError(f"RA {ra} já cadastrado")

    def _validar_status_aluno(self, status: str) -> None:
        status_normalizado = status.strip()
        if not status_normalizado:
            raise BusinessRuleError("statusAluno não pode ser vazio")
        if len(status_normalizado) > 20:
            raise BusinessRuleError("statusAluno deve ter no máximo 20 caracteres")

    def _validar_remocao_sem_matriculas(self, pessoa_id: int) -> None:
        stmt = select(Matricula.idMatricula).where(Matricula.pessoa_id == pessoa_id).limit(1)
        if self.db.scalars(stmt).first() is not None:
            raise BusinessRuleError(
                "Aluno possui matrículas vinculadas e não pode ser removido"
            )

    @staticmethod
    def _mensagem_integridade(exc: IntegrityError) -> str:
        mensagem = str(exc.orig) if exc.orig else str(exc)
        if "UNIQUE" in mensagem.upper() or "duplicate" in mensagem.lower():
            return "Violação de unicidade: registro duplicado"
        if "FOREIGN KEY" in mensagem.upper():
            return "Violação de integridade referencial"
        return "Erro de integridade ao persistir dados"
