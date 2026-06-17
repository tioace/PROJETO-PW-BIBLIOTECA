let usuario = null;

document.addEventListener('DOMContentLoaded', () => {
    usuario = exigirAutenticacao('bibliotecario');
    if (!usuario) return;

    document.getElementById('sidebar-nome').textContent = usuario.nome;
    document.getElementById('topbar-nome').textContent = usuario.nome;

    configurarLogout();

    carregarLivros();
    document.getElementById('form-livro').addEventListener('submit', salvarLivro);
});


function mostrarSecao(secao) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));
    event.currentTarget.classList.add('ativo');

    if (secao === 'livros') {
        document.getElementById('secao-livros').classList.remove('escondido');
        document.getElementById('secao-emprestimos').classList.add('escondido');
        document.getElementById('titulo-secao').textContent = 'Catálogo de Livros';
        carregarLivros();
    } else {
        document.getElementById('secao-livros').classList.add('escondido');
        document.getElementById('secao-emprestimos').classList.remove('escondido');
        document.getElementById('titulo-secao').textContent = 'Empréstimos';
        carregarEmprestimos();
    }
}


async function carregarLivros() {
    try {
        const livros = await apiRequest('/livro/listar');
        const tbody = document.getElementById('tbody-livros');

        if (!livros.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa">Nenhum livro cadastrado.</td></tr>';
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
                    <div class="acoes-linha">
                        <button class="btn-small btn-warning" onclick="editarLivro(${l.id_livro})">Editar</button>
                        <button class="btn-small btn-danger" onclick="excluirLivro(${l.id_livro})">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}

async function salvarLivro(e) {
    e.preventDefault();

    const id = document.getElementById('livro-id').value;
    const titulo = document.getElementById('livro-titulo').value.trim();
    const autor = document.getElementById('livro-autor').value.trim();
    const anoRaw = document.getElementById('livro-ano').value.trim();
    const quantidade_disponivel = Number(document.getElementById('livro-qtd').value);

    let ano_publicacao = null;
    if (anoRaw) {
        ano_publicacao = Number(anoRaw);
        if (isNaN(ano_publicacao) || ano_publicacao < 0 || ano_publicacao > 2100) {
            exibirMensagem('mensagem', 'Ano de publicação inválido.', 'erro');
            return;
        }
    }

    const body = { titulo, autor, ano_publicacao, quantidade_disponivel };

    try {
        if (id) {
            await apiRequest(`/livro/${id}`, { method: 'PUT', body });
            exibirMensagem('mensagem', 'Livro atualizado com sucesso!', 'sucesso');
            cancelarEdicaoLivro();
        } else {
            await apiRequest('/livro/cadastrar', { method: 'POST', body });
            exibirMensagem('mensagem', 'Livro cadastrado com sucesso!', 'sucesso');
            document.getElementById('form-livro').reset();
        }
        carregarLivros();
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}

async function editarLivro(id) {
    try {
        const livro = await apiRequest(`/livro/${id}`);
        document.getElementById('livro-id').value = livro.id_livro;
        document.getElementById('livro-titulo').value = livro.titulo;
        document.getElementById('livro-autor').value = livro.autor;
        document.getElementById('livro-ano').value = livro.ano_publicacao || '';
        document.getElementById('livro-qtd').value = livro.quantidade_disponivel;

        document.getElementById('titulo-form-livro').textContent = 'Editar Livro';
        document.getElementById('btn-salvar-livro').textContent = 'Salvar Alterações';
        document.getElementById('btn-cancelar-edicao').classList.remove('escondido');
        document.getElementById('form-livro').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}

function cancelarEdicaoLivro() {
    document.getElementById('form-livro').reset();
    document.getElementById('livro-id').value = '';
    document.getElementById('titulo-form-livro').textContent = 'Cadastrar Novo Livro';
    document.getElementById('btn-salvar-livro').textContent = 'Cadastrar Livro';
    document.getElementById('btn-cancelar-edicao').classList.add('escondido');
}

async function excluirLivro(id) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;
    try {
        await apiRequest(`/livro/${id}`, { method: 'DELETE' });
        exibirMensagem('mensagem', 'Livro excluído com sucesso!', 'sucesso');
        carregarLivros();
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}


async function carregarEmprestimos() {
    const tbody = document.getElementById('tbody-emprestimos');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Carregando...</td></tr>';
    try {
        const emprestimos = await apiRequest('/emprestimo/listar');

        if (!emprestimos.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa">Nenhum empréstimo registrado.</td></tr>';
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


            const podeAprovar = ['devolucao_solicitada'].includes(emp.status);

        
            const podeDesaprovar = emp.status === 'devolucao_solicitada';

            return `
                <tr>
                    <td>${emp.id_emprestimo}</td>
                    <td>${escapeHtml(emp.nome_usuario)}</td>
                    <td>${escapeHtml(emp.titulo_livro)}</td>
                    <td>${formatarData(emp.data_emprestimo)}</td>
                    <td>${formatarData(emp.data_devolucao_prevista)}</td>
                    <td><span class="status ${emp.status}">${statusLabel}</span></td>
                    <td>
                        <div class="acoes-linha">
                            ${podeAprovar
                                ? `<button class="btn-small btn-success" onclick="aprovarDevolucao(${emp.id_emprestimo})">Aprovar Dev.</button>`
                                : ''}
                            ${podeDesaprovar
                                ? `<button class="btn-small btn-warning" onclick="desaprovarDevolucao(${emp.id_emprestimo})">Desaprovar</button>`
                                : ''}
                            <button class="btn-small btn-danger" onclick="excluirEmprestimo(${emp.id_emprestimo})">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}

async function aprovarDevolucao(id) {
    if (!confirm('Confirmar a aprovação desta devolução?')) return;
    try {
        await apiRequest(`/emprestimo/devolver/${id}`, { method: 'PUT' });
        exibirMensagem('mensagem', 'Devolução aprovada com sucesso!', 'sucesso');
        carregarEmprestimos();
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}

async function desaprovarDevolucao(id) {
    if (!confirm('Deseja rejeitar esta solicitação de devolução? O empréstimo voltará ao status Ativo.')) return;
    try {
        await apiRequest(`/emprestimo/desaprovar-devolucao/${id}`, { method: 'PUT' });
        exibirMensagem('mensagem', 'Solicitação de devolução rejeitada. Empréstimo voltou para Ativo.', 'sucesso');
        carregarEmprestimos();
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}

async function excluirEmprestimo(id) {
    if (!confirm('Tem certeza que deseja excluir este empréstimo? Esta ação não pode ser desfeita.')) return;
    try {
        await apiRequest(`/emprestimo/${id}`, { method: 'DELETE' });
        exibirMensagem('mensagem', 'Empréstimo excluído com sucesso!', 'sucesso');
        carregarEmprestimos();
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
}
