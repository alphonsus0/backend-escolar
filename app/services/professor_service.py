from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.aluno import Aluno
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.pessoa import Pessoa
from app.models.professor import Professor
from app.schemas.professor import ProfessorCreateSchema, ProfessorUpdateSchema


class ProfessorService:
    """Operações de negócio da entidade PROFESSOR (PESSOA + PROFESSOR)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Professor]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")

        stmt = (
            select(Professor)
            .options(joinedload(Professor.pessoa))
            .order_by(Professor.pessoa_id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).unique().all())

    def buscar_por_id(self, pessoa_id: int) -> Professor:
        professor = self._get_professor_or_none(pessoa_id)
        if professor is None:
            raise NotFoundError(f"Professor com pessoa_id={pessoa_id} não encontrado")
        return professor

    def criar(self, dados: ProfessorCreateSchema) -> Professor:
        self._validar_pessoa_id_disponivel(dados.pessoa_id)
        self._validar_cpf_unico(dados.cpf)
        self._validar_id_professor_unico(dados.idProfessor)

        pessoa = Pessoa(
            pessoa_id=dados.pessoa_id,
            nome=dados.nome,
            cpf=dados.cpf,
            dataNascimento=dados.dataNascimento,
            endereco=dados.endereco,
            telefone=dados.telefone,
        )
        professor = Professor(
            pessoa_id=dados.pessoa_id,
            idProfessor=dados.idProfessor,
            matriculaProf=dados.matriculaProf,
            prof_Formacao=dados.prof_Formacao,
            dataAdmissao=dados.dataAdmissao,
            pessoa=pessoa,
        )

        try:
            self.db.add(pessoa)
            self.db.add(professor)
            self.db.commit()
            self.db.refresh(professor)
            self.db.refresh(pessoa)
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(self._mensagem_integridade(exc)) from exc

        return self.buscar_por_id(professor.pessoa_id)

    def atualizar(self, pessoa_id: int, dados: ProfessorUpdateSchema) -> Professor:
        professor = self.buscar_por_id(pessoa_id)
        pessoa = professor.pessoa
        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")

        if "cpf" in payload and payload["cpf"] != pessoa.cpf:
            self._validar_cpf_unico(payload["cpf"], ignorar_pessoa_id=pessoa_id)

        if "idProfessor" in payload and payload["idProfessor"] != professor.idProfessor:
            self._validar_id_professor_unico(
                payload["idProfessor"],
                ignorar_pessoa_id=pessoa_id,
            )

        campos_pessoa = ("nome", "cpf", "dataNascimento", "endereco", "telefone")
        for campo in campos_pessoa:
            if campo in payload:
                setattr(pessoa, campo, payload[campo])

        campos_professor = ("idProfessor", "matriculaProf", "prof_Formacao", "dataAdmissao")
        for campo in campos_professor:
            if campo in payload:
                setattr(professor, campo, payload[campo])

        try:
            self.db.commit()
            self.db.refresh(professor)
            self.db.refresh(pessoa)
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(self._mensagem_integridade(exc)) from exc

        return professor

    def remover(self, pessoa_id: int) -> None:
        professor = self.buscar_por_id(pessoa_id)
        self._validar_remocao_sem_ofertas(pessoa_id)

        pessoa = professor.pessoa
        try:
            self.db.delete(professor)
            self.db.delete(pessoa)
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                "Não é possível remover o professor: existem registros vinculados no banco"
            ) from exc

    def _get_professor_or_none(self, pessoa_id: int) -> Professor | None:
        stmt = (
            select(Professor)
            .options(joinedload(Professor.pessoa))
            .where(Professor.pessoa_id == pessoa_id)
        )
        return self.db.scalars(stmt).unique().first()

    def _validar_pessoa_id_disponivel(self, pessoa_id: int) -> None:
        if self.db.get(Pessoa, pessoa_id) is not None:
            raise ConflictError(f"pessoa_id={pessoa_id} já está cadastrado em PESSOA")
        if self.db.get(Aluno, pessoa_id) is not None:
            raise ConflictError(f"pessoa_id={pessoa_id} já pertence a um aluno")

    def _validar_cpf_unico(self, cpf: str, *, ignorar_pessoa_id: int | None = None) -> None:
        stmt = select(Pessoa).where(Pessoa.cpf == cpf)
        if ignorar_pessoa_id is not None:
            stmt = stmt.where(Pessoa.pessoa_id != ignorar_pessoa_id)
        if self.db.scalars(stmt).first() is not None:
            raise ConflictError(f"CPF {cpf} já cadastrado")

    def _validar_id_professor_unico(
        self,
        id_professor: int,
        *,
        ignorar_pessoa_id: int | None = None,
    ) -> None:
        stmt = select(Professor).where(Professor.idProfessor == id_professor)
        if ignorar_pessoa_id is not None:
            stmt = stmt.where(Professor.pessoa_id != ignorar_pessoa_id)
        if self.db.scalars(stmt).first() is not None:
            raise ConflictError(f"idProfessor {id_professor} já cadastrado")

    def _validar_remocao_sem_ofertas(self, pessoa_id: int) -> None:
        stmt = (
            select(OfertaDisciplina.idOfertaDisciplina)
            .where(OfertaDisciplina.pessoa_id == pessoa_id)
            .limit(1)
        )
        if self.db.scalars(stmt).first() is not None:
            raise BusinessRuleError(
                "Professor possui ofertas de disciplina vinculadas e não pode ser removido"
            )

    @staticmethod
    def _mensagem_integridade(exc: IntegrityError) -> str:
        mensagem = str(exc.orig) if exc.orig else str(exc)
        if "UNIQUE" in mensagem.upper() or "duplicate" in mensagem.lower():
            return "Violação de unicidade: registro duplicado"
        if "FOREIGN KEY" in mensagem.upper():
            return "Violação de integridade referencial"
        return "Erro de integridade ao persistir dados"
