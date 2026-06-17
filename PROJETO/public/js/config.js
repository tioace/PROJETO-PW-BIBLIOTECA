
function salvarSessao(usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
}

function obterUsuario() {
    const dados = localStorage.getItem('usuario');
    return dados ? JSON.parse(dados) : null;
}

function limparSessao() {
    localStorage.removeItem('usuario');
}


function exigirAutenticacao(perfilEsperado) {
    const usuario = obterUsuario();

    if (!usuario) {
        window.location.href = 'index.html';
        return null;
    }

    if (perfilEsperado && usuario.perfil !== perfilEsperado) {
        window.location.href = usuario.perfil === 'bibliotecario' ? 'bibliotecario.html' : 'leitor.html';
        return null;
    }

    return usuario;
}


async function apiRequest(endpoint, { method = 'GET', body = null } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    const usuarioAtual = obterUsuario();
    if (usuarioAtual && usuarioAtual.id_usuario) {
        headers['x-usuario-id'] = usuarioAtual.id_usuario;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const resposta = await fetch(endpoint, options);

    let dados = {};
    if (resposta.status !== 204) {
        dados = await resposta.json().catch(() => ({}));
    }

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro na requisição.');
    }

    return dados;
}

 
function exibirMensagem(elementoId, texto, tipo = 'erro') {
    const el = document.getElementById(elementoId);
    if (!el) return;
    el.textContent = texto;
    el.className = `mensagem ${tipo}`;
    el.classList.remove('escondido');

    setTimeout(() => {
        el.classList.add('escondido');
    }, 5000);
}


function configurarLogout() {
    const btn = document.getElementById('btn-logout');
    if (btn) {
        btn.addEventListener('click', () => {
            limparSessao();
            window.location.href = 'index.html';
        });
    }
}


function formatarData(dataStr) {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}
