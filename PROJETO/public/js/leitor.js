let usuario = null;

document.addEventListener('DOMContentLoaded', () => {
    usuario = exigirAutenticacao('leitor');
    if (!usuario) return;

    document.getElementById('sidebar-nome').textContent = usuario.nome;
    document.getElementById('topbar-nome').textContent = usuario.nome;

    configurarLogout();
    carregarLivros();
});

//NAVEGAÇÃO 
function mostrarSecao(secao, el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));
    if (el) el.classList.add('ativo');

    if (secao === 'catalogo') {
        document.getElementById('secao-catalogo').classList.remove('escondido');
        document.getElementById('secao-meus-emprestimos').classList.add('escondido');
        document.getElementById('titulo-secao').textContent = 'Catálogo de Livros';
        carregarLivros();
    } else {
        document.getElementById('secao-catalogo').classList.add('escondido');
        document.getElementById('secao-meus-emprestimos').classList.remove('escondido');
        document.getElementById('titulo-secao').textContent = 'Meus Empréstimos';
        carregarMeusEmprestimos();
    }
}

//CATÁLOGO
async function carregarLivros() {
    try {
        const livros = await apiRequest('/livro/listar');
        const tbody = document.getElementById('tbody-livros');

        if (!livros.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa">Nenhum livro disponível.</td></tr>';
            return;
        }

        tbody.innerHTML = livros.map(l => `
            <tr>
                <td>${l.id_livro}</td>
                <td>${escapeHtml(l.titulo)}</td>
                <td>${escapeHtml(l.autor)}</td>
                <td>${l.ano_publicacao || '-'}</td>
                <td>${l.quantidade_disponivel}</td>
                <td>
                    ${l.quantidade_disponivel > 0
                        ? `<button class="btn-small" onclick="solicitarEmprestimo(${l.id_livro})">📥 Solicitar Empréstimo</button>`
                        : `<span style="color:#aaa;font-size:.82rem;">Indisponível</span>`
                    }
                </td>
            </tr>
        `).join('');
    } catch (err) {
        exibirMensagem('mensagem', 'Erro ao carregar livros: ' + err.message, 'erro');
    }
}

async function solicitarEmprestimo(id_livro) {
    if (!confirm('Confirmar solicitação de empréstimo deste livro?')) return;
    try {
        await apiRequest('/emprestimo/cadastrar', {
            method: 'POST',
            body: { id_livro, id_usuario: usuario.id_usuario }
        });
        exibirMensagem('mensagem', 'Empréstimo solicitado com sucesso! Prazo: 14 dias.', 'sucesso');
        carregarLivros();
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}

//MEUS EMPRÉSTIMOS 
async function carregarMeusEmprestimos() {
    const tbody = document.getElementById('tbody-emprestimos');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Carregando...</td></tr>';
    try {
        const emprestimos = await apiRequest(`/emprestimo/usuario/${usuario.id_usuario}`);

        if (!emprestimos.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa">Você ainda não possui empréstimos.</td></tr>';
            return;
        }

        const statusMap = {
            'ativo': 'Ativo',
            'devolvido': 'Devolvido',
            'atrasado': 'Atrasado',
            'devolucao_solicitada': 'Dev. Solicitada'
        };

        tbody.innerHTML = emprestimos.map(emp => {
            const statusLabel = statusMap[emp.status] || emp.status;
            const podeSolicitar = emp.status === 'ativo' || emp.status === 'atrasado';

            return `
                <tr>
                    <td>${emp.id_emprestimo}</td>
                    <td>${escapeHtml(emp.titulo_livro)}</td>
                    <td>${escapeHtml(emp.autor_livro)}</td>
                    <td>${formatarData(emp.data_emprestimo)}</td>
                    <td>${formatarData(emp.data_devolucao_prevista)}</td>
                    <td><span class="status ${emp.status}">${statusLabel}</span></td>
                    <td>
                        ${podeSolicitar
                            ? `<button class="btn-small btn-warning" onclick="solicitarDevolucao(${emp.id_emprestimo})">Solicitar Devolução</button>`
                            : '<span style="color:#aaa;font-size:.82rem;">-</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red">Erro ao carregar.</td></tr>';
        exibirMensagem('mensagem', 'Erro ao carregar empréstimos: ' + err.message, 'erro');
    }
}

async function solicitarDevolucao(id) {
    if (!confirm('Confirmar solicitação de devolução deste livro?')) return;

    try {
        await apiRequest(`/emprestimo/solicitar-devolucao/${id}`, { method: 'PUT' });
        exibirMensagem('mensagem', 'Solicitação enviada! Aguarde a aprovação do bibliotecário.', 'sucesso');
        carregarMeusEmprestimos();
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}
