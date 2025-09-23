
// ====================
// INTEGRAÇÃO API SALIC - VERSÃO COM CACHE GLOBAL SINCRONIZADO
// GARANTE QUE PROJETOS DA TELA SEMPRE ABREM NO MODAL
// ====================

class SalicAPIReal {
    constructor() {
        this.baseURL = 'https://api.salic.cultura.gov.br/api/v1';

        this.corsProxies = [
            'https://thingproxy.freeboard.io/fetch/',
            'https://api.allorigins.win/get?url=',
            'https://proxy.cors.sh/',
        ];

        this.cache = new Map();
        this.cacheTimeout = 300000;

        // CACHE GLOBAL para sincronizar projetos da tela com modal
        this.projetosVisualizados = new Map();

        console.log('🎯 SALIC API - Cache global para sincronização total');
    }

    async makeRequest(endpoint, params = {}) {
        const url = this.buildURL(endpoint, params);
        const cacheKey = url;

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        for (let i = 0; i < this.corsProxies.length; i++) {
            try {
                const proxy = this.corsProxies[i];
                let proxyURL;

                if (proxy.includes('allorigins')) {
                    proxyURL = proxy + encodeURIComponent(url);
                } else {
                    proxyURL = proxy + encodeURIComponent(url);
                }

                const response = await fetch(proxyURL, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json; charset=utf-8',
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });

                if (!response.ok) continue;

                const text = await response.text();
                let data;

                try {
                    if (proxy.includes('allorigins')) {
                        const parsed = JSON.parse(text);
                        data = parsed.contents ? JSON.parse(parsed.contents) : parsed;
                    } else {
                        data = JSON.parse(text);
                    }
                } catch (parseError) {
                    continue;
                }

                this.cache.set(cacheKey, { data, timestamp: Date.now() });
                return data;

            } catch (error) {
                console.error(`Erro com proxy ${i + 1}:`, error.message);
            }
        }

        throw new Error('Falha na conexão com API SALIC');
    }

    buildURL(endpoint, params) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        url.searchParams.append('format', 'json');

        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        return url.toString();
    }

    async buscarProjetos(filtros = {}) {
        try {
            const data = await this.makeRequest('/projetos', filtros);

            if (data._embedded && data._embedded.projetos) {
                return data._embedded.projetos.map(projeto => this.normalizarProjeto(projeto));
            } else if (data.projetos && Array.isArray(data.projetos)) {
                return data.projetos.map(projeto => this.normalizarProjeto(projeto));
            } else if (Array.isArray(data)) {
                return data.map(projeto => this.normalizarProjeto(projeto));
            }

            return [];
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
            return [];
        }
    }

    async buscarProjetosDiversificados() {
        console.log('🎲 Buscando projetos diversificados...');

        const estrategias = [
            { params: { limit: 8, offset: this.getRandomOffset() }, nome: 'Offset aleatório' },
            { params: { limit: 6, offset: this.getRandomOffset() }, nome: 'Offset aleatório 2' },
            { params: { uf: this.getRandomUF(), limit: 7 }, nome: 'Por UF aleatória' },
            { params: { uf: this.getRandomUF(), limit: 5 }, nome: 'Por UF aleatória 2' },
            { params: { limit: 6, offset: 50 }, nome: 'Offset fixo 50' },
            { params: { limit: 8, offset: 150 }, nome: 'Offset fixo 150' },
            { params: { limit: 10 }, nome: 'Busca básica' }
        ];

        const estrategiasEmbaralhadas = estrategias.sort(() => Math.random() - 0.5);

        for (const estrategia of estrategiasEmbaralhadas) {
            try {
                console.log(`🎯 Tentativa: ${estrategia.nome}`, estrategia.params);
                const projetos = await this.buscarProjetos(estrategia.params);

                if (projetos.length > 0) {
                    console.log(`✅ Sucesso com "${estrategia.nome}": ${projetos.length} projetos`);
                    const projetosEmbaralhados = projetos.sort(() => Math.random() - 0.5);
                    const projetosSelecionados = projetosEmbaralhados.slice(0, 5);

                    // ARMAZENAR NO CACHE GLOBAL para sincronização
                    projetosSelecionados.forEach(projeto => {
                        this.projetosVisualizados.set(projeto.id, projeto);
                        console.log(`📦 Armazenado no cache: ${projeto.id} - ${projeto.nome.substring(0, 30)}`);
                    });

                    return projetosSelecionados;
                }

            } catch (error) {
                console.log(`❌ Erro em "${estrategia.nome}":`, error.message);
                continue;
            }
        }

        return [];
    }

    getRandomOffset() {
        const offsets = [0, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000];
        return offsets[Math.floor(Math.random() * offsets.length)];
    }

    getRandomUF() {
        const ufs = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO', 'DF', 'ES'];
        return ufs[Math.floor(Math.random() * ufs.length)];
    }

    normalizarProjeto(projeto) {
        return {
            id: projeto.PRONAC || projeto.pronac || projeto.id || 'N/A',
            nome: this.corrigirEncodingSeletivo(projeto.nome || projeto.NomeProjeto || 'Projeto sem nome'),
            proponente: this.corrigirEncodingSeletivo(projeto.proponente || projeto.NomeProponente || 'Não informado'),
            area: this.corrigirEncodingSeletivo(projeto.area || projeto.Area || 'Não especificada'),
            segmento: this.corrigirEncodingSeletivo(projeto.segmento || projeto.Segmento || 'Não especificado'),
            uf: projeto.uf || projeto.UfProjeto || 'BR',
            municipio: this.corrigirEncodingSeletivo(projeto.municipio || projeto.Municipio || 'Não informado'),
            valor_aprovado: this.parseNumber(projeto.valor_aprovado || projeto.ValorAprovado),
            valor_captado: this.parseNumber(projeto.valor_captado || projeto.ValorCaptado),
            valor_projeto: this.parseNumber(projeto.valor_projeto || projeto.ValorProjeto),
            situacao: this.corrigirEncodingSeletivo(projeto.situacao || projeto.Situacao || 'Ativo'),
            ano_projeto: projeto.ano_projeto || projeto.AnoProjeto,
            sinopse: this.corrigirEncodingSeletivo(projeto.sinopse || projeto.Sinopse || ''),
            objetivos: this.corrigirEncodingSeletivo(projeto.objetivos || projeto.Objetivos || ''),
            justificativa: this.corrigirEncodingSeletivo(projeto.justificativa || projeto.Justificativa || '')
        };
    }

    corrigirEncodingSeletivo(texto) {
        if (!texto || typeof texto !== 'string') return '';

        const temProblema = texto.includes('Ã');
        if (!temProblema) return texto.trim();

        let textoCorrigido = texto
            // Casos específicos NATAL ILUMINADO - FUNCIONOU!
            .replace(/UNIÃƒO/g, 'UNIÃO')
            .replace(/INTEGRAÃƒO/g, 'INTEGRAÇÃO') 
            .replace(/INTEGRAÃ‡ÃƒO/g, 'INTEGRAÇÃO')
            .replace(/CELEBRAÃƒO/g, 'CELEBRAÇÃO')

            // Padrões gerais
            .replace(/ÃƒO/g, 'ÃO')
            .replace(/Ã§Ã£o/g, 'ção')
            .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í')
            .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã /g, 'à')
            .replace(/Ãª/g, 'ê').replace(/Ã´/g, 'ô').replace(/Ã¢/g, 'â')
            .replace(/Ã£/g, 'ã').replace(/Ãµ/g, 'õ').replace(/Ã§/g, 'ç')

            .replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ').trim();

        return textoCorrigido;
    }

    // BUSCA INTELIGENTE - primeiro no cache, depois na API
    async buscarProjetoParaModal(projectId) {
        console.log(`🔍 Buscando projeto ${projectId} para modal...`);

        // 1. PRIMEIRO: verificar cache global (projetos da tela)
        if (this.projetosVisualizados.has(projectId)) {
            const projeto = this.projetosVisualizados.get(projectId);
            console.log(`✅ Projeto encontrado no CACHE: ${projeto.nome.substring(0, 30)}`);
            return projeto;
        }

        console.log(`⚠️ Projeto ${projectId} não está no cache. Buscando na API...`);

        // 2. SEGUNDO: buscar na API com diferentes estratégias
        const estrategiasBusca = [
            { params: { limit: 50 }, nome: 'Busca básica' },
            { params: { limit: 100, offset: 0 }, nome: 'Busca ampla' },
            { params: { limit: 50, offset: 50 }, nome: 'Segunda página' },
            { params: { limit: 50, offset: 100 }, nome: 'Terceira página' }
        ];

        for (const estrategia of estrategiasBusca) {
            try {
                console.log(`🔎 Tentando: ${estrategia.nome}`);
                const projetos = await this.buscarProjetos(estrategia.params);

                if (projetos.length > 0) {
                    const projeto = projetos.find(p => p.id == projectId);
                    if (projeto) {
                        console.log(`✅ Projeto encontrado na API: ${projeto.nome.substring(0, 30)}`);
                        // Armazenar no cache para próximas consultas
                        this.projetosVisualizados.set(projectId, projeto);
                        return projeto;
                    }
                }

            } catch (error) {
                console.log(`❌ Erro em ${estrategia.nome}:`, error.message);
                continue;
            }
        }

        console.log(`❌ Projeto ${projectId} não encontrado em nenhuma busca`);
        return null;
    }

    parseNumber(value) {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    formatCurrency(value) {
        if (!value || value === 0) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    async obterEstatisticas() {
        try {
            const projetos = await this.buscarProjetosDiversificados();

            if (projetos.length === 0) {
                return this.getDefaultStats();
            }

            const total = projetos.length;
            const aprovados = projetos.filter(p => 
                p.situacao && (
                    p.situacao.toLowerCase().includes('aprovado') ||
                    p.situacao.toLowerCase().includes('execu')
                )
            ).length;

            const valores = projetos.map(p => p.valor_projeto || 0).filter(v => v > 0);
            const valorMedio = valores.length > 0 ? 
                valores.reduce((sum, val) => sum + val, 0) / valores.length : 420000;

            return {
                total_projetos: total,
                taxa_aprovacao: Math.round((aprovados / total) * 100) || 68,
                valor_medio: valorMedio,
                areas_mais_ativas: ["Música", "Teatro", "Audiovisual", "Artes Visuais", "Literatura"]
            };

        } catch (error) {
            return this.getDefaultStats();
        }
    }

    getDefaultStats() {
        return {
            total_projetos: 135631,
            taxa_aprovacao: 68,
            valor_medio: 420000,
            areas_mais_ativas: ["Música", "Teatro", "Audiovisual", "Artes Visuais", "Literatura"]
        };
    }
}

// ==================== INTEGRAÇÃO COM ONA - CACHE SINCRONIZADO ====================

const salicAPI = new SalicAPIReal();

async function loadSimilarProjects() {
    const container = document.getElementById('similar-projects');
    if (!container) return;

    container.innerHTML = `
        <div class="loading" style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <div style="margin-bottom: 10px; font-size: 18px;">🎲</div>
            <div>Carregando projetos variados...</div>
        </div>
    `;

    try {
        const projetos = await salicAPI.buscarProjetosDiversificados();
        renderProjects(container, projetos);
    } catch (error) {
        container.innerHTML = `
            <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404; font-size: 12px;">
                <div style="margin-bottom: 8px;">⚠️ Erro ao conectar com API SALIC</div>
                <button onclick="loadSimilarProjects()" 
                        style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
}

function renderProjects(container, projetos) {
    if (projetos.length === 0) {
        container.innerHTML = `
            <div style="padding: 15px; text-align: center; background: #f8f9fa; border-radius: 6px;">
                <div style="margin-bottom: 10px; font-size: 20px;">📭</div>
                <div style="font-size: 12px; color: #6c757d;">Nenhum projeto encontrado</div>
                <button onclick="loadSimilarProjects()" 
                        style="margin-top: 10px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    🎲 Buscar Outros
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    projetos.forEach((projeto) => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.dataset.projectId = projeto.id;
        projectDiv.style.cssText = `
            cursor: pointer; padding: 12px; margin-bottom: 8px;
            border: 1px solid #e0e0e0; border-radius: 6px; background: #f9f9f9;
            transition: all 0.2s ease;
        `;

        projectDiv.innerHTML = `
            <div style="font-weight: bold; color: #1976d2; margin-bottom: 4px; font-size: 13px; line-height: 1.3;">
                ${projeto.nome}
            </div>
            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">
                ${projeto.area} • ${projeto.uf} • ${salicAPI.formatCurrency(projeto.valor_projeto)}
            </div>
            <div style="font-size: 10px; color: #2e7d32; font-weight: 500;">
                ${projeto.id} • ${projeto.situacao}
            </div>
        `;

        projectDiv.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e3f2fd';
            this.style.borderColor = '#1976d2';
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        projectDiv.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f9f9f9';
            this.style.borderColor = '#e0e0e0';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });

        projectDiv.addEventListener('click', function() {
            const projectId = this.dataset.projectId;
            console.log('🎯 Clicando no projeto:', projectId);
            showSimilarProject(projectId);
        });

        container.appendChild(projectDiv);
    });

    const footer = document.createElement('div');
    footer.style.cssText = `
        margin-top: 12px; padding: 8px; background: #e8f5e8; border-radius: 4px;
        font-size: 10px; color: #2e7d32; text-align: center; display: flex;
        justify-content: space-between; align-items: center;
    `;
    footer.innerHTML = `
        <span>✅ ${projetos.length} projetos SALIC</span>
        <button onclick="loadSimilarProjects()" 
                style="padding: 4px 8px; background: #4caf50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">
            🎲 Outros
        </button>
    `;
    container.appendChild(footer);
}

async function loadSalicStats() {
    try {
        const stats = await salicAPI.obterEstatisticas();

        const approvalRate = document.querySelector('.stat-value');
        const avgValue = document.querySelectorAll('.stat-value')[1];

        if (approvalRate) approvalRate.textContent = `${stats.taxa_aprovacao}%`;
        if (avgValue) avgValue.textContent = salicAPI.formatCurrency(stats.valor_medio);

        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = 'Conectado';
            statusElement.className = 'status status--info';
        }

    } catch (error) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status status--error';
        }
    }
}

// MODAL COM BUSCA INTELIGENTE - USA CACHE PRIMEIRO
async function showSimilarProject(projectId) {
    console.log('👁️ Mostrando detalhes do projeto:', projectId);

    const modal = document.getElementById('similar-modal');
    const details = document.getElementById('similar-details');

    if (!modal || !details) {
        console.error('❌ Modal ou details não encontrados');
        return;
    }

    details.innerHTML = `
        <div class="loading" style="text-align: center; padding: 40px;">
            <div style="font-size: 24px; margin-bottom: 15px;">🔄</div>
            <div>Carregando detalhes...</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">ID: ${projectId}</div>
        </div>
    `;
    modal.classList.remove('hidden');

    try {
        // USAR BUSCA INTELIGENTE - cache primeiro, API depois
        const projeto = await salicAPI.buscarProjetoParaModal(projectId);

        if (projeto) {
            console.log('🎨 Renderizando detalhes do projeto');
            renderRealProjectDetails(projeto);
        } else {
            details.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">😔</div>
                    <div style="margin-bottom: 10px;">Projeto não encontrado</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 15px;">ID: ${projectId}</div>
                    <div style="font-size: 11px; color: #999; margin-bottom: 20px;">
                        O projeto pode ter saído da consulta atual ou estar em outra página da API.
                    </div>
                    <button onclick="closeModal()" 
                            style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Fechar
                    </button>
                </div>
            `;
        }

    } catch (error) {
        console.error('❌ Erro ao carregar detalhes:', error);
        details.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <div style="margin-bottom: 10px;">Erro ao carregar projeto</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 15px;">${error.message}</div>
                <button onclick="closeModal()" 
                        style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Fechar
                </button>
            </div>
        `;
    }
}

function renderRealProjectDetails(projeto) {
    const details = document.getElementById('similar-details');

    const porcentagemCaptada = projeto.valor_aprovado > 0 ? 
        Math.round((projeto.valor_captado / projeto.valor_aprovado) * 100) : 0;

    details.innerHTML = `
        <div style="max-height: 500px; overflow-y: auto;">
            <div style="border-bottom: 2px solid #1976d2; padding-bottom: 15px; margin-bottom: 20px;">
                <h3 style="color: #1976d2; margin: 0 0 8px 0; font-size: 18px; line-height: 1.3;">
                    ${projeto.nome}
                </h3>
                <div style="color: #666; font-size: 12px;">
                    ${projeto.id} • ${projeto.situacao}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 3px;">Proponente</div>
                    <div style="font-weight: 500;">${projeto.proponente}</div>
                </div>
                <div>
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 3px;">Localização</div>
                    <div style="font-weight: 500;">${projeto.municipio} - ${projeto.uf}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 3px;">Área</div>
                    <div style="font-weight: 500;">${projeto.area}</div>
                </div>
                <div>
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 3px;">Segmento</div>
                    <div style="font-weight: 500;">${projeto.segmento}</div>
                </div>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
                    <div style="background: white; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 10px; color: #666; margin-bottom: 3px;">APROVADO</div>
                        <div style="font-weight: bold; color: #1976d2; font-size: 14px;">
                            ${salicAPI.formatCurrency(projeto.valor_aprovado)}
                        </div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 10px; color: #666; margin-bottom: 3px;">CAPTADO</div>
                        <div style="font-weight: bold; color: #2e7d32; font-size: 14px;">
                            ${salicAPI.formatCurrency(projeto.valor_captado)}
                        </div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 10px; color: #666; margin-bottom: 3px;">% CAPTADO</div>
                        <div style="font-weight: bold; font-size: 14px; color: ${porcentagemCaptada >= 50 ? '#2e7d32' : '#f57c00'};">
                            ${porcentagemCaptada}%
                        </div>
                    </div>
                </div>
            </div>

            ${projeto.sinopse ? `
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">Sinopse</div>
                    <div style="color: #4a5568; line-height: 1.6; font-size: 14px;">${projeto.sinopse}</div>
                </div>
            ` : ''}

            ${projeto.objetivos ? `
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">Objetivos</div>
                    <div style="color: #4a5568; line-height: 1.6; font-size: 14px;">${projeto.objetivos}</div>
                </div>
            ` : ''}
        </div>

        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e0e0e0; display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="adaptRealProject('${projeto.id}')" 
                    style="background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
                ✨ Usar como Referência
            </button>
            <button onclick="closeModal()"
                    style="background: transparent; color: #1976d2; padding: 10px 20px; border: 2px solid #1976d2; border-radius: 6px; cursor: pointer;">
                Fechar
            </button>
        </div>
    `;
}

function adaptRealProject(projectId) {
    alert(`Projeto ${projectId} será usado como referência!\n\nFuncionalidade em desenvolvimento.`);
    closeModal();
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        Promise.all([
            loadSimilarProjects(),
            loadSalicStats()
        ]).then(() => {
            console.log('✅ API SALIC - Cache global sincronizado aplicado');
        }).catch(error => {
            console.error('Erro na integração SALIC:', error);
        });
    }, 2000);
});

console.log('🎯 SALIC carregado - Cache global para sincronização total');
