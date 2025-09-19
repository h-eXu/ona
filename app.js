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
    projetos_salic_exemplo: [
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
        },
        {
            nome: "Exposição de Arte Popular",
            segmento: "artes visuais",
            valor: 320000,
            estado: "MG",
            contrapartidas: ["Visitas guiadas gratuitas", "Oficinas de pintura"],
            produtos: ["Exposição", "Catálogo impresso"]
        },
        {
            nome: "Circulação Musical Nordeste",
            segmento: "música",
            valor: 180000,
            estado: "CE",
            contrapartidas: ["Apresentações em escolas", "Masterclass"],
            produtos: ["Apresentações", "Álbum digital"]
        }
    ]
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
    loadSimilarProjects();
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
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
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
    document.getElementById('consult-ai').addEventListener('click', consultAI);
    
    // Upload de arquivos
    setupFileUploads();
    
    // Projetos similares
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('project-item')) {
            showSimilarProject(e.target.dataset.projectId);
        }
    });
}

function updateProgress() {
    const progress = (appState.currentStep / appState.totalSteps) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

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
    
    prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    nextBtn.textContent = step === appState.totalSteps ? 'Finalizar' : 'Próximo →';
    
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
            const edital = document.getElementById('edital-select').value;
            if (!edital) {
                alert('Por favor, selecione um edital ou marco legal.');
                return false;
            }
            appState.selectedEdital = edital;
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
    document.querySelector(`[data-option="${option}"]`).classList.add('selected');
}

function generateContextForm() {
    const contextForm = document.getElementById('context-form');
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
            
        case 'previous-project':
            formHTML = `
                <div class="form-section">
                    <h3>Projeto Anterior</h3>
                    <div class="form-group">
                        <label class="form-label">Upload do Projeto</label>
                        <div class="upload-area">
                            <p>Arraste seu projeto aqui ou clique para selecionar</p>
                            <input type="file" accept=".pdf,.doc,.docx">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ou cole o texto aqui</label>
                        <textarea class="form-control" rows="8" 
                            placeholder="Cole o conteúdo do seu projeto anterior..."></textarea>
                    </div>
                </div>
            `;
            break;
            
        case 'portfolio':
            formHTML = `
                <div class="form-section">
                    <h3>Portfólio e Equipe</h3>
                    <div class="form-group">
                        <label class="form-label">Currículos da Equipe</label>
                        <div class="upload-area">
                            <p>Upload de múltiplos currículos (PDF)</p>
                            <input type="file" multiple accept=".pdf">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Portfólio de Trabalhos Anteriores</label>
                        <div class="upload-area">
                            <p>Imagens, vídeos, documentos</p>
                            <input type="file" multiple accept=".pdf,.jpg,.png,.mp4">
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'adapt-project':
            formHTML = `
                <div class="form-section">
                    <h3>Adaptação de Projeto</h3>
                    <div class="form-group">
                        <label class="form-label">Projeto Original</label>
                        <div class="upload-area">
                            <p>Upload do projeto a ser adaptado</p>
                            <input type="file" accept=".pdf,.doc,.docx">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contexto da Adaptação</label>
                        <textarea class="form-control" rows="4" 
                            placeholder="Explique o que precisa ser adaptado e por quê..."></textarea>
                    </div>
                </div>
            `;
            break;
    }
    
    contextForm.innerHTML = formHTML;
}

function startDiagnostic() {
    // Adicionar perguntas específicas baseadas no contexto
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
    
    const editalQuestions = {
        'rouanet-continuo': [
            "Como pretende garantir as cotas de democratização (10% gratuitas)?",
            "Quais contrapartidas sociais planeja oferecer?"
        ],
        'rouanet-nordeste': [
            "Como o projeto valoriza a cultura nordestina?",
            "Planeja envolver artistas locais da região?"
        ],
        'rouanet-favelas': [
            "Como o projeto impactará diretamente as comunidades periféricas?",
            "Há parcerias com organizações comunitárias?"
        ]
    };
    
    const contextQuestions = editalQuestions[appState.selectedEdital] || [];
    return [...baseQuestions, ...contextQuestions];
}

function sendMessage() {
    const input = document.getElementById('chat-input');
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

function initializeProjectBuilder() {
    const sectionsContainer = document.getElementById('builder-sections');
    loadBuilderSection('sinopse');
}

function switchBuilderSection(sectionName) {
    appState.currentBuilderSection = sectionName;
    
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Carregar seção
    loadBuilderSection(sectionName);
}

function loadBuilderSection(sectionName) {
    const container = document.getElementById('builder-sections');
    
    const sectionTemplates = {
        sinopse: `
            <div class="builder-section active">
                <div class="section-header">
                    <h3>Sinopse do Projeto</h3>
                    <div class="section-actions">
                        <button class="btn-icon" onclick="openAIModal('sinopse')" title="Consultar IA">🤖</button>
                        <button class="btn-icon" onclick="addComment('sinopse')" title="Adicionar comentário">💬</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Título do Projeto</label>
                    <input type="text" class="form-control" placeholder="Ex: Festival de Cinema Independente do Nordeste">
                </div>
                <div class="form-group">
                    <label class="form-label">Sinopse (máximo 500 caracteres)</label>
                    <textarea class="form-control" rows="6" maxlength="500" 
                        placeholder="Descreva de forma concisa e atraente o seu projeto cultural..."></textarea>
                    <small class="form-text">Restam <span id="char-count">500</span> caracteres</small>
                </div>
                <div class="form-group">
                    <label class="form-label">Palavras-chave</label>
                    <input type="text" class="form-control" 
                        placeholder="Ex: cinema, juventude, nordeste, formação">
                </div>
            </div>
        `,
        
        justificativa: `
            <div class="builder-section active">
                <div class="section-header">
                    <h3>Justificativa</h3>
                    <div class="section-actions">
                        <button class="btn-icon" onclick="openAIModal('justificativa')" title="Consultar IA">🤖</button>
                        <button class="btn-icon" onclick="addComment('justificativa')" title="Adicionar comentário">💬</button>
                    </div>
                </div>
                <div class="alert alert-info">
                    <strong>Dica:</strong> Alinhe com os objetivos do PRONAC listados abaixo
                </div>
                <div class="form-group">
                    <label class="form-label">Objetivos PRONAC relacionados</label>
                    <div class="checkbox-group">
                        ${ROUANET_DATA.objetivos_pronac.map((obj, i) => `
                            <label class="checkbox-label">
                                <input type="checkbox" value="${i}"> ${obj}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Justificativa detalhada</label>
                    <textarea class="form-control" rows="8" 
                        placeholder="Explique por que este projeto é importante, qual problema resolve, que impacto terá..."></textarea>
                </div>
            </div>
        `,
        
        objetivos: `
            <div class="builder-section active">
                <div class="section-header">
                    <h3>Objetivos</h3>
                    <div class="section-actions">
                        <button class="btn-icon" onclick="openAIModal('objetivos')" title="Consultar IA">🤖</button>
                        <button class="btn-icon" onclick="addComment('objetivos')" title="Adicionar comentário">💬</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Objetivo Geral</label>
                    <textarea class="form-control" rows="3" 
                        placeholder="Objetivo principal e abrangente do projeto..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Objetivos Específicos</label>
                    <div id="specific-objectives">
                        <div class="objective-item">
                            <input type="text" class="form-control" placeholder="Objetivo específico 1">
                        </div>
                    </div>
                    <button type="button" class="btn btn--secondary" onclick="addObjective()">+ Adicionar Objetivo</button>
                </div>
            </div>
        `,
        
        orcamento: `
            <div class="builder-section active">
                <div class="section-header">
                    <h3>Orçamento</h3>
                    <div class="section-actions">
                        <button class="btn-icon" onclick="openAIModal('orcamento')" title="Consultar IA">🤖</button>
                        <button class="btn-icon" onclick="addComment('orcamento')" title="Adicionar comentário">💬</button>
                    </div>
                </div>
                <div class="budget-summary">
                    <div class="budget-item">
                        <span>Valor Total:</span>
                        <span id="total-budget">R$ 0,00</span>
                    </div>
                    <div class="budget-item">
                        <span>Limite para seu perfil:</span>
                        <span>R$ 500.000,00</span>
                    </div>
                </div>
                <div class="budget-table">
                    ${ROUANET_DATA.rubricas_orcamento.map(rubrica => `
                        <div class="budget-row">
                            <label class="budget-label">${rubrica}</label>
                            <input type="number" class="form-control budget-input" 
                                data-rubrica="${rubrica}" placeholder="0.00">
                        </div>
                    `).join('')}
                </div>
            </div>
        `
    };
    
    container.innerHTML = sectionTemplates[sectionName] || '<p>Seção em desenvolvimento...</p>';
    
    // Adicionar listeners específicos da seção
    addSectionListeners(sectionName);
}

function addSectionListeners(sectionName) {
    if (sectionName === 'sinopse') {
        const textarea = container.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', function() {
                const remaining = 500 - this.value.length;
                document.getElementById('char-count').textContent = remaining;
            });
        }
    }
    
    if (sectionName === 'orcamento') {
        document.querySelectorAll('.budget-input').forEach(input => {
            input.addEventListener('input', updateBudgetTotal);
        });
    }
}

function updateBudgetTotal() {
    let total = 0;
    document.querySelectorAll('.budget-input').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    
    document.getElementById('total-budget').textContent = 
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(total);
}

function addObjective() {
    const container = document.getElementById('specific-objectives');
    const div = document.createElement('div');
    div.className = 'objective-item';
    div.innerHTML = `
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="text" class="form-control" placeholder="Novo objetivo específico">
            <button type="button" class="btn btn--outline" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    container.appendChild(div);
}

function openAIModal(section) {
    const modal = document.getElementById('ai-modal');
    modal.classList.remove('hidden');
    
    // Configurar textarea com sugestão contextual
    const textarea = document.getElementById('ai-input');
    const suggestions = {
        sinopse: 'Melhore esta sinopse para torná-la mais atrativa e alinhada com a Lei Rouanet...',
        justificativa: 'Preciso de uma justificativa mais forte que demonstre o impacto cultural...',
        objetivos: 'Refine estes objetivos para melhor aderência aos critérios do PRONAC...',
        orcamento: 'Analise este orçamento e sugira otimizações dentro dos limites legais...'
    };
    
    textarea.placeholder = suggestions[section] || 'Descreva o que você quer melhorar...';
}

function consultAI() {
    const input = document.getElementById('ai-input').value;
    const responseDiv = document.getElementById('ai-response');
    
    if (!input.trim()) {
        alert('Por favor, descreva o que você quer consultar.');
        return;
    }
    
    // Simular chamada à API do Perplexity
    responseDiv.innerHTML = '<div class="loading">Consultando Perplexity Pro...</div>';
    responseDiv.classList.add('loading');
    
    setTimeout(() => {
        const response = generateAIResponse(input);
        responseDiv.classList.remove('loading');
        responseDiv.innerHTML = `
            <h4>💡 Sugestão da IA:</h4>
            <p>${response}</p>
            <div style="margin-top: 12px;">
                <button class="btn btn--primary" onclick="applyAISuggestion()">Aplicar Sugestão</button>
                <button class="btn btn--outline" onclick="closeModal()">Fechar</button>
            </div>
        `;
    }, 2500);
}

function generateAIResponse(input) {
    const responses = [
        "Com base na análise da Lei Rouanet, sugiro enfatizar mais o aspecto de democratização do acesso à cultura. Adicione informações sobre como o projeto beneficiará comunidades em situação de vulnerabilidade social e inclua contrapartidas educativas.",
        
        "Para fortalecer seu projeto, recomendo alinhar melhor com os objetivos do PRONAC, especialmente 'facilitar o acesso às fontes da cultura' e 'promover regionalização'. Considere parcerias com escolas públicas e organizações comunitárias.",
        
        "Sua proposta está bem estruturada, mas poderia se beneficiar de mais detalhes sobre sustentabilidade e continuidade. Projetos que demonstram impacto duradouro têm maior chance de aprovação na Lei Rouanet.",
        
        "Sugiro incluir mais dados quantitativos sobre o público-alvo e métricas de impacto. Também recomendo revisar o orçamento para garantir que está dentro dos limites para seu perfil de proponente e que as rubricas estão bem distribuídas."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function loadSimilarProjects() {
    const container = document.getElementById('similar-projects');
    
    // Simular carregamento
    setTimeout(() => {
        container.innerHTML = '';
        
        ROUANET_DATA.projetos_salic_exemplo.forEach((projeto, index) => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'project-item';
            projectDiv.dataset.projectId = index;
            projectDiv.innerHTML = `
                <div class="project-name">${projeto.nome}</div>
                <div class="project-meta">
                    ${projeto.segmento} • ${projeto.estado} • 
                    ${new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0
                    }).format(projeto.valor)}
                </div>
            `;
            container.appendChild(projectDiv);
        });
    }, 1500);
}

function showSimilarProject(projectId) {
    const projeto = ROUANET_DATA.projetos_salic_exemplo[projectId];
    const modal = document.getElementById('similar-modal');
    const details = document.getElementById('similar-details');
    
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
                <strong>Valor:</strong> ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(projeto.valor)}
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
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function adaptSimilarProject(projectId) {
    alert('Funcionalidade de adaptação será implementada na próxima versão!');
    closeModal();
}

function runFinalAnalysis() {
    const analysisContainer = document.getElementById('final-analysis');
    
    // Simular análise
    setTimeout(() => {
        analysisContainer.innerHTML = `
            <div class="analysis-results">
                <div class="analysis-section">
                    <h3>📊 Pontuação Estimada</h3>
                    <div class="score-display">
                        <div class="score-number">87/100</div>
                        <div class="score-label">Muito Bom</div>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h3>✅ Pontos Fortes</h3>
                    <ul>
                        <li>Forte alinhamento com objetivos do PRONAC</li>
                        <li>Contrapartidas sociais bem definidas</li>
                        <li>Orçamento dentro dos limites legais</li>
                        <li>Público-alvo claramente identificado</li>
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h3>⚠️ Pontos de Atenção</h3>
                    <ul>
                        <li>Considere ampliar as ações de acessibilidade</li>
                        <li>Detalhe melhor o plano de distribuição</li>
                        <li>Inclua mais parcerias institucionais</li>
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h3>💡 Recomendações Finais</h3>
                    <ul>
                        <li>Revise a seção de justificativa para maior impacto</li>
                        <li>Inclua cronograma detalhado de execução</li>
                        <li>Prepare documentação complementar</li>
                    </ul>
                </div>
            </div>
        `;
    }, 2000);
}

function setupFileUploads() {
    document.querySelectorAll('.upload-area').forEach(area => {
        const input = area.querySelector('input[type="file"]');
        
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--color-primary)';
            this.style.backgroundColor = 'var(--color-bg-1)';
        });
        
        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--color-border)';
            this.style.backgroundColor = 'transparent';
        });
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--color-border)';
            this.style.backgroundColor = 'transparent';
            
            if (input) {
                input.files = e.dataTransfer.files;
                handleFileUpload(input);
            }
        });
        
        if (input) {
            input.addEventListener('change', function() {
                handleFileUpload(this);
            });
        }
    });
}

function handleFileUpload(input) {
    const files = Array.from(input.files);
    if (files.length > 0) {
        const fileNames = files.map(f => f.name).join(', ');
        const status = document.createElement('div');
        status.className = 'upload-status';
        status.innerHTML = `
            <div class="status status--success">
                📎 ${files.length} arquivo(s): ${fileNames}
            </div>
        `;
        
        const uploadArea = input.closest('.upload-area');
        const existingStatus = uploadArea.querySelector('.upload-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        uploadArea.appendChild(status);
    }
}

// Função para aplicar sugestões da IA
function applyAISuggestion() {
    alert('Sugestão aplicada! (Esta funcionalidade seria implementada para modificar o campo atual)');
    closeModal();
}

// Função para adicionar comentários
function addComment(section) {
    const comment = prompt(`Adicionar comentário para a seção ${section}:`);
    if (comment) {
        alert(`Comentário salvo: "${comment}"`);
        // Aqui seria implementado o sistema de comentários/anotações
    }
}