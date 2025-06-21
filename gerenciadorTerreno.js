/**
 * gerencia os blocos de terreno para criar a ilusão de um cenário infinito.
 * @param {Image} textura - A imagem de textura a ser aplicada no terreno.
 */
function GerenciadorTerreno(textura) {
    this.terrenos = [];
    this.textura = textura;

    // Parâmetros dos blocos de terreno. Devem ser consistentes com o que estava em main.js.
    this.qtdX = 30;
    this.qtdZ = 30;
    this.tamanhoX = 1200; // Largura de cada bloco de terreno
    this.tamanhoZ = 600;
    this.alturaMax = 20;
    this.cor_ambiente = vec4(0.2, 0.8, 0.2, 1.0);
    this.cor_difusao = vec4(0.2, 0.8, 0.2, 1.0);
    this.alpha_especular = 10;

    // Mantém o controle de quantos blocos de terreno devem existir simultaneamente.
    this.terrenosVisiveis = 3; 
    // Guarda a posição X central onde o próximo bloco de terreno (na direção -X) será criado.
    this.proximoX = 0;

    /**
     * Inicializa o gerenciador, criando os primeiros blocos de terreno.
     */
    this.init = function() {
        // O caminhão se move em direção a -X. Criamos um bloco na posição atual,
        // um à frente e um atrás para começar.
        this.proximoX = this.tamanhoX;
        for (let i = 0; i < this.terrenosVisiveis; i++) {
            this.adicionarTerreno(this.proximoX);
            this.proximoX -= this.tamanhoX;
        }
    };

    /**
     * Cria um novo bloco de terreno em uma posição X específica.
     * @param {number} posX - A coordenada X central do novo bloco de terreno.
     */
    this.adicionarTerreno = function(posX) {
        let posicao = vec3(posX, 0, 0);
        let novoTerreno = new TerrenoProcedural(
            posicao,
            this.qtdX, this.qtdZ, this.tamanhoX, this.tamanhoZ, this.alturaMax,
            this.cor_ambiente, this.cor_difusao, this.alpha_especular,
            this.textura, false
        );
        novoTerreno.init();
        this.terrenos.push(novoTerreno);
    };

    /**
     * Verifica a posição do caminhão e decide se um novo bloco de terreno precisa ser
     * adicionado à frente ou se um bloco antigo precisa ser removido de trás.
     */
    this.atualiza_posicao_orientacao = function(delta) {
        const posCaminhaoX = caminhao.posicao[0];

        // --- Lógica para ADICIONAR terreno ---
        // O gatilho para adicionar um novo terreno é quando o caminhão passa da metade
        // do bloco de terreno que está mais à frente.
        const gatilhoParaAdicionar = this.proximoX + this.tamanhoX / 2;
        if (posCaminhaoX < gatilhoParaAdicionar) {
            this.adicionarTerreno(this.proximoX);
            this.proximoX -= this.tamanhoX;
        }

        // --- Lógica para REMOVER terreno ---
        // Remove o terreno que ficou para trás para otimizar a performance.
        if (this.terrenos.length > this.terrenosVisiveis) {
            const terrenoDeTras = this.terrenos[0];
            const bordaDianteiraDoTerrenoDeTras = terrenoDeTras.posicao[0] - this.tamanhoX / 2;

            // Se o caminhão já passou completamente pelo terreno mais antigo, remove-o.
            if (posCaminhaoX < bordaDianteiraDoTerrenoDeTras) {
                this.terrenos.shift(); // Remove o primeiro terreno da lista.
            }
        }
    };

    /**
     * Atualiza a matriz 'model' de cada bloco de terreno.
     */
    this.atualiza_model = function() {
        this.terrenos.forEach(t => t.atualiza_model());
    };

    /**
     * Desenha cada bloco de terreno visível.
     */
    this.desenha = function() {
        this.terrenos.forEach(t => t.desenha());
    };

    /**
     * Adiciona o gerenciador à lista de objetos da cena para que seja atualizado e renderizado.
     */
    this.adiciona_ao_cenario = function() {
        gObjetos.push(this);
    };
}