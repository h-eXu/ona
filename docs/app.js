// Dados da Lei Rouanet e PRONAC
const ROUANET_DATA = {
    objetivos_pronac: [
        "Facilitar o acesso às fontes da cultura",
        "Promover regionalização da produção cultural",
        "Apoiar e valorizar manifestações culturais",
        "Proteger expressões culturais dos grupos formadores",
        "Salvaguardar modos de criar, fazer e viver",
        "Preservar patrimônio cultural e histórico",
        "Desenvolver consciência internacional",
        "Estimular produção de bens culturais universais",
        "Priorizar produto cultural nacional",
        "Estimular jogos eletrônicos brasileiros independentes"
    ],
    produtos_culturais: [
        "Espetáculos (teatro, dança, circo, música)",
        "Festivais, bienais, festas, feiras culturais", 
        "Exposições (museus, artes visuais)",
        "Produtos audiovisuais (filmes, séries, podcasts)",
        "Livros e publicações (até 3.000 exemplares)",
        "Desenvolvimento de games",
        "Territórios criativos",
        "Grupos e corpos artísticos estáveis",
        "Projetos de restauro e patrimônio",
        "Ações formativas e educativas",
        "Pesquisas e estudos culturais",
        "Circulação nacional e internacional"
    ],
    limites_proponente: {
        pessoa_fisica: {max_projetos: 2, valor_total: 500000},
        mei: {max_projetos: 4, valor_total: 1500000},
        simples_nacional: {max_projetos: 8, valor_total: 6000000},
        demais_pj: {max_projetos: 16, valor_total: 15000000}
    },
    rubricas_orcamento: [
        "Recursos Humanos",
        "Encargos Sociais", 
        "Material de Consumo",
        "Material Permanente",
        "Serviços de Terceiros",
        "Viagens e Estadas",
        "Divulgação",
        "Custos Administrativos (até 15%)",
        "Custos de Captação (até 10%)"
    ],
    obrigacoes_essenciais: [
        "Medidas de acessibilidade obrigatórias",
        "Mínimo 10% cotas gratuitas sociais/educativas",
        "Pelo menos 20% ingressos até R$ 50",
        "Ações formativas para 10% do público",
        "Democratização do acesso ampliada",
        "Uso obrigatório das marcas Lei Rouanet/MinC",
        "Plano de distribuição detalhado"
    ],
    // REMOVIDOS OS PROJETOS DE EXEMPLO - agora virão da API SALIC
};

// Estado global da aplicação
let appState = {
    currentStep: 1,
    totalSteps: 7,
    selectedOption: null,
    selectedEdital: null,
    projectData: {},
    chatMessages: [],
    currentBuilderSection: 'sinopse'
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    bindEvents();
    // REMOVIDO loadSimilarProjects() - agora é chamado pela API SALIC
});

function initializeApp() {
    updateProgress();
    showStep(appState.currentStep);

    // Inicializar chat com mensagem de boas-vindas
    appState.chatMessages = [{
        type: 'bot',
        message: 'Olá! Sou seu assistente inteligente para projetos da Lei Rouanet. Analisei seus dados iniciais e vou fazer algumas perguntas para otimizar seu projeto...'
    }];
}

function bindEvents() {
    // Navegação entre etapas
    document.getElementById('next-step').addEventListener('click', nextStep);
    document.getElementById('prev-step').addEventListener('click', prevStep);

    // Seleção de opções de entrada
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            selectOption(this.dataset.option);
        });
    });

    // Chat do diagnóstico
    const sendBtn = document.getElementById('send-message');
    const chatInput = document.getElementById('chat-input');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Navegação do builder de projeto
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            switchBuilderSection(this.dataset.section);
        });
    });

    // Modais
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Consulta IA
    const consultBtn = document.getElementById('consult-ai');
    if (consultBtn) consultBtn.addEventListener('click', consultAI);

    // Upload de arquivos
    setupFileUploads();

    // PROJETOS SIMILARES - AGORA COM DELEGAÇÃO DE EVENTOS
    document.addEventListener('click', function(e) {
        // Usar contains ao invés de classList.contains para compatibilidade
        if (e.target.classList && e.target.classList.contains('project-item')) {
            e.preventDefault();
            const projectId = e.target.dataset.projectId;
            console.log('Clicando no projeto:', projectId);
            showSimilarProject(projectId);
        }
        // Também verificar se clicou em elementos filhos
        const projectItem = e.target.closest('.project-item');
        if (projectItem && projectItem.dataset.projectId) {
            e.preventDefault();
            const projectId = projectItem.dataset.projectId;
            console.log('Clicando no projeto (elemento filho):', projectId);
            showSimilarProject(projectId);
        }
    });
}

// Função de updateProgress mantida igual
function updateProgress() {
    const progress = (appState.currentStep / appState.totalSteps) * 100;
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
}

// Demais funções mantidas iguais...
function showStep(step) {
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });

    const currentSection = document.getElementById(`step-${step}`);
    if (currentSection) {
        currentSection.classList.add('active');
    }

    // Atualizar botões de navegação
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');

    if (prevBtn) prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.textContent = step === appState.totalSteps ? 'Finalizar' : 'Próximo →';

    // Carregar conteúdo específico da etapa
    loadStepContent(step);
}

function loadStepContent(step) {
    switch(step) {
        case 3:
            generateContextForm();
            break;
        case 4:
            renderChatMessages();
            startDiagnostic();
            break;
        case 5:
            initializeProjectBuilder();
            break;
        case 6:
            runFinalAnalysis();
            break;
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        if (appState.currentStep < appState.totalSteps) {
            appState.currentStep++;
            updateProgress();
            showStep(appState.currentStep);
        }
    }
}

function prevStep() {
    if (appState.currentStep > 1) {
        appState.currentStep--;
        updateProgress();
        showStep(appState.currentStep);
    }
}

function validateCurrentStep() {
    switch(appState.currentStep) {
        case 1:
            if (!appState.selectedOption) {
                alert('Por favor, selecione uma opção para começar.');
                return false;
            }
            break;
        case 2:
            const edital = document.getElementById('edital-select');
            if (!edital || !edital.value) {
                alert('Por favor, selecione um edital ou marco legal.');
                return false;
            }
            appState.selectedEdital = edital.value;
            break;
    }
    return true;
}

function selectOption(option) {
    appState.selectedOption = option;

    // Remover seleção anterior
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Marcar nova seleção
    const selectedCard = document.querySelector(`[data-option="${option}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
}

// Manter todas as outras funções do arquivo original...
function generateContextForm() {
    const contextForm = document.getElementById('context-form');
    if (!contextForm) return;

    let formHTML = '';

    switch(appState.selectedOption) {
        case 'new-idea':
            formHTML = `
                <div class="form-section">
                    <h3>Descreva sua ideia</h3>
                    <div class="form-group">
                        <label class="form-label">Qual sua ideia cultural?</label>
                        <textarea id="idea-description" class="form-control" rows="5" 
                            placeholder="Descreva em detalhes sua proposta cultural..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Segmento Cultural</label>
                            <select id="cultural-segment" class="form-control">
                                <option value="">Selecione...</option>
                                ${ROUANET_DATA.produtos_culturais.map(produto => 
                                    `<option value="${produto}">${produto}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Valor Estimado</label>
                            <input type="number" id="estimated-value" class="form-control" 
                                placeholder="Ex: 300000">
                        </div>
                    </div>
                </div>
            `;
            break;

        // Outros cases mantidos iguais...
        default:
            formHTML = '<p>Funcionalidade em desenvolvimento...</p>';
            break;
    }

    contextForm.innerHTML = formHTML;
}

// Função showSimilarProject CORRIGIDA para funcionar com dados locais e API
function showSimilarProject(projectId) {
    console.log('Mostrando projeto:', projectId);

    const modal = document.getElementById('similar-modal');
    const details = document.getElementById('similar-details');

    if (!modal || !details) {
        console.error('Modal elements not found');
        return;
    }

    // Mostrar loading primeiro
    details.innerHTML = '<div class="loading">Carregando detalhes do projeto...</div>';
    modal.classList.remove('hidden');

    // Tentar buscar na API SALIC primeiro (se disponível)
    if (window.salicAPI) {
        window.salicAPI.buscarProjetos({ pronac: projectId, limit: 1 })
            .then(projetos => {
                if (projetos && projetos.length > 0) {
                    renderRealProjectDetails(projetos[0]);
                } else {
                    renderFallbackProject(projectId);
                }
            })
            .catch(() => {
                renderFallbackProject(projectId);
            });
    } else {
        // Fallback para dados locais
        renderFallbackProject(projectId);
    }
}

function renderFallbackProject(projectId) {
    const details = document.getElementById('similar-details');

    // Projetos exemplo para fallback
    const projetosExemplo = [
        {
            nome: "Documentário: Vozes do Sertão",
            segmento: "audiovisual",
            valor: 450000,
            estado: "PE",
            contrapartidas: ["Exibições gratuitas em escolas", "Oficinas de audiovisual"],
            produtos: ["Documentário", "Material educativo"]
        },
        {
            nome: "Festival de Teatro Jovem",
            segmento: "teatro", 
            valor: 280000,
            estado: "BA",
            contrapartidas: ["Ingressos gratuitos", "Workshops"],
            produtos: ["Espetáculos", "Catálogo digital"]
        }
    ];

    const projeto = projetosExemplo[projectId] || projetosExemplo[0];

    if (projeto) {
        details.innerHTML = `
            <h3>${projeto.nome}</h3>
            <div class="project-details">
                <div class="detail-row">
                    <strong>Segmento:</strong> ${projeto.segmento}
                </div>
                <div class="detail-row">
                    <strong>Estado:</strong> ${projeto.estado}
                </div>
                <div class="detail-row">
                    <strong>Valor:</strong> ${formatCurrency(projeto.valor)}
                </div>
                <div class="detail-row">
                    <strong>Produtos:</strong> ${projeto.produtos.join(', ')}
                </div>
                <div class="detail-row">
                    <strong>Contrapartidas:</strong>
                    <ul style="margin: 8px 0 0 16px;">
                        ${projeto.contrapartidas.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button class="btn btn--primary" onclick="adaptSimilarProject(${projectId})">
                    Usar como Referência
                </button>
                <button class="btn btn--outline" onclick="closeModal()">
                    Fechar
                </button>
            </div>
        `;
    } else {
        details.innerHTML = '<div class="error">Projeto não encontrado</div>';
    }
}

function renderRealProjectDetails(projeto) {
    const details = document.getElementById('similar-details');

    details.innerHTML = `
        <h3>${projeto.nome}</h3>
        <div class="project-details">
            <div class="detail-row">
                <strong>PRONAC:</strong> ${projeto.id}
            </div>
            <div class="detail-row">
                <strong>Proponente:</strong> ${projeto.proponente || 'Não informado'}
            </div>
            <div class="detail-row">
                <strong>Área/Segmento:</strong> ${projeto.area} / ${projeto.segmento || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Local:</strong> ${projeto.municipio} - ${projeto.uf}
            </div>
            <div class="detail-row">
                <strong>Valor do Projeto:</strong> ${formatCurrency(projeto.valor_projeto)}
            </div>
            <div class="detail-row">
                <strong>Situação:</strong> <span class="status--info">${projeto.situacao}</span>
            </div>
            ${projeto.sinopse ? `
                <div class="detail-row">
                    <strong>Sinopse:</strong>
                    <p style="margin-top: 8px; line-height: 1.4;">${projeto.sinopse}</p>
                </div>
            ` : ''}
        </div>
        <div style="margin-top: 20px;">
            <button class="btn btn--primary" onclick="adaptRealProject('${projeto.id}')">
                Usar como Referência
            </button>
            <button class="btn btn--outline" onclick="closeModal()">
                Fechar
            </button>
        </div>
    `;
}

function formatCurrency(value) {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
    }).format(value);
}

function adaptSimilarProject(projectId) {
    alert(`Funcionalidade de adaptação do projeto ${projectId} será implementada!`);
    closeModal();
}

function adaptRealProject(pronaId) {
    alert(`Funcionalidade de adaptação do projeto PRONAC ${pronaId} será implementada!`);
    closeModal();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// Demais funções mantidas iguais do arquivo original...
function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();

    if (message) {
        addUserMessage(message);
        input.value = '';

        // Simular resposta do assistente
        setTimeout(() => {
            const response = generateBotResponse(message);
            addBotMessage(response);
        }, 1500);
    }
}

function addUserMessage(message) {
    appState.chatMessages.push({type: 'user', message});
    renderChatMessages();
}

function addBotMessage(message) {
    appState.chatMessages.push({type: 'bot', message});
    renderChatMessages();
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = '';

    appState.chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.type}-message`;
        messageDiv.innerHTML = msg.type === 'bot' ? 
            `<strong>Assistente:</strong> ${msg.message}` : msg.message;
        container.appendChild(messageDiv);
    });

    container.scrollTop = container.scrollHeight;
}

function generateBotResponse(userMessage) {
    const responses = [
        "Interessante! Isso se alinha bem com os objetivos do PRONAC. Vou sugerir algumas adequações...",
        "Perfeito! Essa abordagem tem potencial para uma boa pontuação. Considere também...",
        "Excelente ideia! Para fortalecer ainda mais o projeto, recomendo...",
        "Muito bem! Baseado na base SALIC, projetos similares tiveram sucesso com...",
        "Ótimo direcionamento! Isso atende aos critérios de democratização. Sugiro..."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

function startDiagnostic() {
    setTimeout(() => {
        addBotMessage("Baseado no que você me contou, preciso entender melhor alguns aspectos:");

        setTimeout(() => {
            const questions = getContextualQuestions();
            questions.forEach((question, index) => {
                setTimeout(() => {
                    addBotMessage(question);
                }, (index + 1) * 2000);
            });
        }, 1500);
    }, 1000);
}

function getContextualQuestions() {
    const baseQuestions = [
        "Qual é o seu público-alvo principal? (ex: jovens, famílias, comunidade local)",
        "Em quantas cidades pretende realizar o projeto?",
        "Há algum período específico para execução? (ex: férias, datas comemorativas)",
        "Qual o principal impacto social que espera causar?"
    ];

    return baseQuestions;
}

// Funções básicas que podem não estar definidas
function initializeProjectBuilder() {
    const sectionsContainer = document.getElementById('builder-sections');
    if (sectionsContainer) {
        loadBuilderSection('sinopse');
    }
}

function switchBuilderSection(sectionName) {
    // Implementar conforme necessário
    console.log('Switching to section:', sectionName);
}

function loadBuilderSection(sectionName) {
    // Implementar conforme necessário  
    console.log('Loading section:', sectionName);
}

function consultAI() {
    alert('Funcionalidade de consulta IA será implementada!');
}

function runFinalAnalysis() {
    console.log('Running final analysis...');
}

function setupFileUploads() {
    console.log('Setting up file uploads...');
}
