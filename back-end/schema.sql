PRAGMA foreign_keys = ON;

CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE animais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    raca TEXT,
    data_nascimento TEXT,
    observacoes TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor REAL NOT NULL,
    duracao_minutos INTEGER,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    data_hora TEXT NOT NULL,
    status TEXT DEFAULT 'agendada', 
    observacoes TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (servico_id) REFERENCES servicos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
