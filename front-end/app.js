// app.js — arquivo único de frontend para as páginas
const API_BASE = "http://127.0.0.1:5000";

async function apiFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Erro na requisição');
  }
  // tentar analisar json, senão retornar texto
  const ct = res.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

/* ====== CLIENTES ====== */
const formCliente = document.getElementById('form-cliente');
if (formCliente) {
  formCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('cliente-nome').value.trim();
    const email = document.getElementById('cliente-email').value.trim();
    const telefone = document.getElementById('cliente-telefone').value.trim();
    const endereco = document.getElementById('cliente-endereco').value.trim();
    const msg = document.getElementById('cliente-msg');

    try {
      const data = await apiFetch('/clientes', {
        method: 'POST',
        body: JSON.stringify({ nome, email, telefone, endereco })
      });
      msg.innerText = `Cliente cadastrado com ID ${data.id || ''}`.trim();
      msg.style.color = 'green';
      formCliente.reset();
    } catch (err) {
      msg.innerText = 'Erro ao cadastrar: ' + err.message;
      msg.style.color = 'crimson';
    }
  });
}

/* ====== ANIMAIS ====== */
const formAnimal = document.getElementById('form-animal');
if (formAnimal) {
  formAnimal.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('animal-nome').value.trim();
    const tipo = document.getElementById('animal-tipo').value.trim();
    const raca = document.getElementById('animal-raca').value.trim();
    const data_nascimento = document.getElementById('animal-nasc').value || null;
    const cliente_id = parseInt(document.getElementById('animal-cliente-id').value, 10);
    const observacoes = document.getElementById('animal-observacoes').value.trim();
    const msg = document.getElementById('animal-msg');

    try {
      const data = await apiFetch('/animais', {
        method: 'POST',
        body: JSON.stringify({ nome, tipo, raca, data_nascimento, cliente_id, observacoes })
      });
      msg.innerText = `Animal cadastrado com ID ${data.id || ''}`;
      msg.style.color = 'green';
      formAnimal.reset();
    } catch (err) {
      msg.innerText = 'Erro ao cadastrar animal: ' + err.message;
      msg.style.color = 'crimson';
    }
  });
}

/* ====== SERVIÇOS: carregar lista em select ====== */
async function carregarServicosEmSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    const servs = await apiFetch('/servicos');
    sel.innerHTML = '';
    servs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.nome} — R$ ${Number(s.valor).toFixed(2)}`;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar serviços:", err);
  }
}

/* ====== MARCAR CONSULTA ====== */
const formConsulta = document.getElementById('form-consulta');
if (formConsulta) {
  carregarServicosEmSelect('consulta-servico-id');
  formConsulta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const animal_id = parseInt(document.getElementById('consulta-animal-id').value, 10);
    const servico_id = parseInt(document.getElementById('consulta-servico-id').value, 10);
    const data_hora_raw = document.getElementById('consulta-datahora').value;
    const observacoes = document.getElementById('consulta-observacoes').value.trim();
    const msg = document.getElementById('consulta-msg');

    if (!animal_id || !servico_id || !data_hora_raw) {
      msg.innerText = 'Preencha animal, serviço e data/hora.';
      msg.style.color = 'crimson';
      return;
    }

    // converter datetime-local para formato ISO "YYYY-MM-DD HH:MM:SS"
    const dt = data_hora_raw.replace('T', ' ');
    try {
      const data = await apiFetch('/consultas', {
        method: 'POST',
        body: JSON.stringify({ animal_id, servico_id, data_hora: dt, observacoes })
      });
      msg.innerText = `Consulta marcada (ID ${data.id || ''})`;
      msg.style.color = 'green';
      formConsulta.reset();
    } catch (err) {
      msg.innerText = 'Erro ao marcar consulta: ' + err.message;
      msg.style.color = 'crimson';
    }
  });
}

/* ====== LISTAR CLIENTES E ANIMAIS ====== */
async function listarClientes() {
  const container = document.getElementById('lista-clientes');
  if (!container) return;
  container.innerHTML = '<p>Carregando...</p>';
  try {
    const clientes = await apiFetch('/clientes');
    if (!clientes || clientes.length === 0) {
      container.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
      return;
    }

    const html = clientes.map(c => {
      let animaisHtml = '<p><em>Sem animais cadastrados.</em></p>';
      if (c.animais && c.animais.length > 0) {
        animaisHtml = '<ul style="margin-top:5px; padding-left:20px;">' +
          c.animais.map(a => `<li><strong>${a.nome}</strong> (${a.tipo} — ${a.raca || '-'}) <small>ID: ${a.id}</small></li>`).join('') +
          '</ul>';
      }

      // Escapar aspas para usar no onclick
      const clienteJson = JSON.stringify(c).replace(/"/g, '&quot;');

      return `
        <div class="item">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <strong>${c.nome}</strong> <small>(ID: ${c.id})</small><br>
              <small>Email: ${c.email || '-'} • Tel: ${c.telefone || '-'}</small>
            </div>
            <div style="display:flex; gap:5px;">
              <button class="btn" style="padding:4px 8px; font-size:12px;" onclick="abrirModalEdicao(${clienteJson})">Editar</button>
              <button class="btn" style="padding:4px 8px; font-size:12px; background:#ffebee; color:#c62828;" onclick="deletarCliente(${c.id})">Excluir</button>
            </div>
          </div>
          <div style="margin-top:8px; background:#f9f9f9; padding:8px; border-radius:6px;">
            <small style="font-weight:bold; color:#2f9e44;">Animais:</small>
            ${animaisHtml}
          </div>
        </div>
      `;
    }).join('<hr>');
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p>Erro: ${err.message}</p>`;
  }
}
if (document.getElementById('lista-clientes')) listarClientes();

/* ====== DELETAR CLIENTE ====== */
async function deletarCliente(id) {
  if (!confirm('Tem certeza que deseja excluir este cliente? Todos os animais e consultas vinculados serão removidos.')) return;

  try {
    await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
    alert('Cliente excluído com sucesso!');
    listarClientes(); // Recarregar lista
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

/* ====== EDITAR CLIENTE (MODAL) ====== */
function abrirModalEdicao(cliente) {
  const modal = document.getElementById('modal-editar');
  if (!modal) return;

  document.getElementById('edit-id').value = cliente.id;
  document.getElementById('edit-nome').value = cliente.nome;
  document.getElementById('edit-email').value = cliente.email || '';
  document.getElementById('edit-telefone').value = cliente.telefone || '';
  document.getElementById('edit-endereco').value = cliente.endereco || '';

  modal.classList.add('active');
}

function fecharModalEdicao() {
  const modal = document.getElementById('modal-editar');
  if (modal) modal.classList.remove('active');
}

// Listener para o form de edição
const formEditar = document.getElementById('form-editar-cliente');
if (formEditar) {
  formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('edit-nome').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const telefone = document.getElementById('edit-telefone').value.trim();
    const endereco = document.getElementById('edit-endereco').value.trim();

    try {
      await apiFetch(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nome, email, telefone, endereco })
      });
      alert('Cliente atualizado!');
      fecharModalEdicao();
      listarClientes();
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message);
    }
  });
}

/* ====== HISTÓRICO DO ANIMAL ====== */
const btnBuscarHist = document.getElementById('btn-buscar-hist');
if (btnBuscarHist) {
  btnBuscarHist.addEventListener('click', async () => {
    const id = parseInt(document.getElementById('hist-animal-id').value, 10);
    const container = document.getElementById('hist-resultado');
    container.innerHTML = '';
    if (!id) {
      container.innerHTML = '<p>Informe o ID do animal.</p>';
      return;
    }
    container.innerHTML = '<p>Carregando histórico...</p>';
    try {
      const dados = await apiFetch(`/consultas/${id}`);
      if (!dados || dados.length === 0) {
        container.innerHTML = '<p>Sem histórico para este animal.</p>';
        return;
      }
      const html = dados.map(c => {
        return `<div class="hist-item">
          <strong>${c.data_hora}</strong> — ${c.servico} — R$ ${Number(c.valor).toFixed(2)}<br>
          <small>Status: ${c.status || '-'} • ID: ${c.id}</small>
        </div>`;
      }).join('<hr>');
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<p>Erro ao buscar histórico: ${err.message}</p>`;
    }
  });
}

/* ====== INICIALIZAÇÃO (carregar serviços se existirem selects) ====== */
document.addEventListener('DOMContentLoaded', () => {
  // pré-carregar serviços em qualquer select presente
  carregarServicosEmSelect('consulta-servico-id');
});
