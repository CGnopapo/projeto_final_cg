/**
 * Gerencia os blocos de terreno para criar a ilusão de um cenário infinito.
 * @param {Image} textura - A imagem de textura a ser aplicada no terreno.
 * @param {string} lado - 'direito' ou 'esquerdo'.
 * @param {number} larguraPista - Largura total da pista.
 * @param {number} larguraFaixa - Largura da faixa de terreno em cada lado.
 */
function GerenciadorTerreno(textura, lado, larguraPista, larguraFaixa) {
    this.terrenos = [];
    this.textura = textura;
    this.lado = lado;
    this.larguraPista = larguraPista;
    this.larguraFaixa = larguraFaixa;

    // Parâmetros de geração do terreno
    this.qtdX = 30;
    this.qtdZ = 30;
    this.alturaMax = 40; // Aumentei um pouco a altura para um efeito mais dramático
    this.tamanhoX = 1200;
    this.cor_ambiente = vec4(0.2, 0.8, 0.2, 1.0);
    this.cor_difusao = vec4(0.2, 0.8, 0.2, 1.0);
    this.alpha_especular = 10;

    this.terrenosVisiveis = 3; 
    this.proximoX = 0;

    this.init = function() {
        this.proximoX = this.tamanhoX;
        for (let i = 0; i < this.terrenosVisiveis; i++) {
            this.adicionarTerreno(this.proximoX);
            this.proximoX -= this.tamanhoX;
        }
    };

    this.adicionarTerreno = function(posX) {
        let posicao = vec3(posX, 0, 0);
        let novoTerreno = new TerrenoProcedural(
            posicao,
            this.lado,
            this.larguraPista,
            this.larguraFaixa,
            this.qtdX,
            this.qtdZ,
            this.alturaMax,
            this.cor_ambiente,
            this.cor_difusao,
            this.alpha_especular,
            this.textura,
            false
        );
        novoTerreno.init();
        this.terrenos.push(novoTerreno);
    };

    // As funções atualiza_posicao_orientacao, atualiza_model, desenha e adiciona_ao_cenario
    // permanecem exatamente as mesmas da resposta anterior.
    this.atualiza_posicao_orientacao = function(delta) {
        const posCaminhaoX = caminhao.posicao[0];

        const gatilhoParaAdicionar = this.proximoX + this.tamanhoX;
        if (posCaminhaoX < gatilhoParaAdicionar) {
            this.adicionarTerreno(this.proximoX);
            this.proximoX -= this.tamanhoX;
        }

        if (this.terrenos.length > this.terrenosVisiveis) {
            const terrenoDeTras = this.terrenos[0];
            const bordaDianteiraDoTerrenoDeTras = terrenoDeTras.posicao[0] - this.tamanhoX / 2;

            if (posCaminhaoX < bordaDianteiraDoTerrenoDeTras) {
                this.terrenos.shift();
            }
        }
    };

    this.atualiza_model = function() {
        this.terrenos.forEach(t => t.atualiza_model());
    };

    this.desenha = function() {
        this.terrenos.forEach(t => t.desenha());
    };

    this.adiciona_ao_cenario = function() {
        gObjetos.push(this);
    };
}