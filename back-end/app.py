from flask import Flask, request, jsonify, send_from_directory
from models import db, Cliente, Animal, Servico, Consulta
from config import Config
import sqlite3
import os
from flask_cors import CORS
import webbrowser

# Configurar o caminho para o front-end
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), 'front-end')

app = Flask(__name__, 
            static_folder=FRONTEND_DIR,
            static_url_path='')
CORS(app)
app.config.from_object(Config)

db.init_app(app)

# Criar banco automaticamente se não existir
with app.app_context():
    if not os.path.exists("database.db"):
        db.create_all()
        print("Banco SQLite criado com sucesso!")


# --------------------------
# ROTA PRINCIPAL (FRONT-END)
# --------------------------

@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


# --------------------------
# ROTAS CLIENTES
# --------------------------

@app.route("/clientes", methods=["POST"])
def criar_cliente():
    dados = request.json
    cliente = Cliente(
        nome=dados["nome"],
        email=dados.get("email"),
        telefone=dados.get("telefone"),
        endereco=dados.get("endereco")
    )
    db.session.add(cliente)
    db.session.commit()
    return jsonify({"message": "Cliente cadastrado", "id": cliente.id})

@app.route("/clientes", methods=["GET"])
def listar_clientes():
    clientes = Cliente.query.all()
    resultado = []
    for c in clientes:
        # Buscar animais deste cliente
        animais = Animal.query.filter_by(cliente_id=c.id).all()
        lista_animais = [{
            "id": a.id,
            "nome": a.nome,
            "tipo": a.tipo,
            "raca": a.raca
        } for a in animais]

        resultado.append({
            "id": c.id,
            "nome": c.nome,
            "email": c.email,
            "telefone": c.telefone,
            "endereco": c.endereco,
            "animais": lista_animais
        })
    return jsonify(resultado)

@app.route("/clientes/<int:id>", methods=["DELETE"])
def deletar_cliente(id):
    cliente = Cliente.query.get(id)
    if not cliente:
        return jsonify({"error": "Cliente não encontrado"}), 404
    
    db.session.delete(cliente)
    db.session.commit()
    return jsonify({"message": "Cliente deletado com sucesso"})

@app.route("/clientes/<int:id>", methods=["PUT"])
def atualizar_cliente(id):
    cliente = Cliente.query.get(id)
    if not cliente:
        return jsonify({"error": "Cliente não encontrado"}), 404
    
    dados = request.json
    cliente.nome = dados.get("nome", cliente.nome)
    cliente.email = dados.get("email", cliente.email)
    cliente.telefone = dados.get("telefone", cliente.telefone)
    cliente.endereco = dados.get("endereco", cliente.endereco)
    
    db.session.commit()
    return jsonify({"message": "Cliente atualizado com sucesso"})


# --------------------------
# ROTAS ANIMAIS
# --------------------------

@app.route("/animais", methods=["POST"])
def cadastrar_animal():
    dados = request.json
    animal = Animal(
        cliente_id=dados["cliente_id"],
        nome=dados["nome"],
        tipo=dados["tipo"],
        raca=dados.get("raca"),
        data_nascimento=dados.get("data_nascimento"),
        observacoes=dados.get("observacoes")
    )
    db.session.add(animal)
    db.session.commit()
    return jsonify({"message": "Animal cadastrado", "id": animal.id})

@app.route("/animais", methods=["GET"])
def listar_todos_animais():
    animais = Animal.query.all()
    return jsonify([{
        "id": a.id,
        "nome": a.nome,
        "tipo": a.tipo,
        "raca": a.raca,
        "cliente_id": a.cliente_id
    } for a in animais])

@app.route("/animais/<int:cliente_id>", methods=["GET"])
def listar_animais_cliente(cliente_id):
    animais = Animal.query.filter_by(cliente_id=cliente_id).all()
    return jsonify([{
        "id": a.id,
        "nome": a.nome,
        "tipo": a.tipo,
        "raca": a.raca
    } for a in animais])


# --------------------------
# ROTAS SERVIÇOS
# --------------------------

@app.route("/servicos", methods=["POST"])
def cadastrar_servico():
    dados = request.json
    servico = Servico(
        nome=dados["nome"],
        descricao=dados.get("descricao"),
        valor=dados["valor"],
        duracao_minutos=dados.get("duracao_minutos")
    )
    db.session.add(servico)
    db.session.commit()
    return jsonify({"message": "Serviço cadastrado", "id": servico.id})

@app.route("/servicos", methods=["GET"])
def listar_servicos():
    servicos = Servico.query.all()
    return jsonify([{
        "id": s.id,
        "nome": s.nome,
        "descricao": s.descricao,
        "valor": s.valor,
        "duracao": s.duracao_minutos
    } for s in servicos])


# --------------------------
# ROTAS CONSULTAS
# --------------------------

@app.route("/consultas", methods=["POST"])
def marcar_consulta():
    dados = request.json
    consulta = Consulta(
        animal_id=dados["animal_id"],
        servico_id=dados["servico_id"],
        data_hora=dados["data_hora"],
        status=dados.get("status", "agendada"),
        observacoes=dados.get("observacoes")
    )
    db.session.add(consulta)
    db.session.commit()
    return jsonify({"message": "Consulta marcada", "id": consulta.id})

@app.route("/consultas/<int:animal_id>", methods=["GET"])
def historico_animal(animal_id):
    consultas = Consulta.query.filter_by(animal_id=animal_id).all()
    return jsonify([{
        "id": c.id,
        "data_hora": c.data_hora,
        "status": c.status,
        "servico": c.servico.nome,
        "valor": c.servico.valor
    } for c in consultas])


# --------------------------
# POPULAR BANCO (SERVIÇOS)
# --------------------------
def popular_servicos():
    servicos_padrao = [
        {"nome": "Banho", "valor": 50.0, "duracao": 60},
        {"nome": "Tosa", "valor": 70.0, "duracao": 90},
        {"nome": "Banho e Tosa", "valor": 100.0, "duracao": 120},
        {"nome": "Consulta", "valor": 150.0, "duracao": 30},
        {"nome": "Vacinação", "valor": 80.0, "duracao": 15},
        {"nome": "Cirurgia", "valor": 500.0, "duracao": 180}
    ]
    with app.app_context():
        if Servico.query.count() == 0:
            for s in servicos_padrao:
                novo = Servico(nome=s["nome"], valor=s["valor"], duracao_minutos=s["duracao"])
                db.session.add(novo)
            db.session.commit()
            print("Serviços padrão cadastrados!")


if __name__ == "__main__":
    with app.app_context():
        # Garantir que as tabelas existam
        if not os.path.exists("database.db"):
            db.create_all()
        # Popular serviços se vazio
        popular_servicos()
    
    webbrowser.open("http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)