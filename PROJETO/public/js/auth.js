function mostrarAba(aba) {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const tabLogin = document.getElementById('tab-login');
    const tabRegistro = document.getElementById('tab-registro');
    const mensagem = document.getElementById('mensagem');

    mensagem.classList.add('escondido');

    if (aba === 'login') {
        formLogin.classList.remove('escondido');
        formRegistro.classList.add('escondido');
        tabLogin.classList.add('ativo');
        tabRegistro.classList.remove('ativo');
    } else {
        formLogin.classList.add('escondido');
        formRegistro.classList.remove('escondido');
        tabRegistro.classList.add('ativo');
        tabLogin.classList.remove('ativo');
    }
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    try {
        const usuario = await apiRequest('/usuario/login', {
            method: 'POST',
            body: { email, senha }
        });
        salvarSessao(usuario);
        window.location.href = usuario.perfil === 'bibliotecario' ? 'bibliotecario.html' : 'leitor.html';
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
});

document.getElementById('form-registro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('registro-nome').value.trim();
    const email = document.getElementById('registro-email').value.trim();
    const senha = document.getElementById('registro-senha').value;
    const perfil = document.getElementById('registro-perfil').value;

    try {
        await apiRequest('/usuario/cadastrar', {
            method: 'POST',
            body: { nome, email, senha, perfil }
        });
        exibirMensagem('mensagem', 'Cadastro realizado! Faça login.', 'sucesso');
        mostrarAba('login');
    } catch (err) {
        exibirMensagem('mensagem', err.message, 'erro');
    }
});
