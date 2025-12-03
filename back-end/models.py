from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Cliente(db.Model):
    __tablename__ = "clientes"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150))
    telefone = db.Column(db.String(40))
    endereco = db.Column(db.String(255))
    criado_em = db.Column(db.String, default="CURRENT_TIMESTAMP")

    animais = db.relationship("Animal", backref="cliente", cascade="all, delete-orphan")

class Animal(db.Model):
    __tablename__ = "animais"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey("clientes.id"), nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    raca = db.Column(db.String(100))
    data_nascimento = db.Column(db.String)
    observacoes = db.Column(db.Text)
    criado_em = db.Column(db.String, default="CURRENT_TIMESTAMP")

    consultas = db.relationship("Consulta", backref="animal", cascade="all, delete-orphan")

class Servico(db.Model):
    __tablename__ = "servicos"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(150), nullable=False)
    descricao = db.Column(db.Text)
    valor = db.Column(db.Float, nullable=False)
    duracao_minutos = db.Column(db.Integer)
    criado_em = db.Column(db.String, default="CURRENT_TIMESTAMP")

    consultas = db.relationship("Consulta", backref="servico", cascade="all, delete")

class Consulta(db.Model):
    __tablename__ = "consultas"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    animal_id = db.Column(db.Integer, db.ForeignKey("animais.id"), nullable=False)
    servico_id = db.Column(db.Integer, db.ForeignKey("servicos.id"), nullable=False)
    data_hora = db.Column(db.String, nullable=False)
    status = db.Column(db.String, default="agendada")
    observacoes = db.Column(db.Text)
    criado_em = db.Column(db.String, default="CURRENT_TIMESTAMP")
