function Gerenciador_terreno(textura, lado, largura_pista, largura_faixa) {
    this.terrenos = [];
    this.textura = textura;
    this.lado = lado;
    this.largura_pista = largura_pista;
    this.largura_faixa = largura_faixa;

    this.quantidade_emX = 30;
    this.quantidade_emZ = 30;
    this.altura_maxima = 40; 
    this.tamanhoX = 1200;
    this.cor_ambiente = vec4(0.2, 0.8, 0.2, 1.0);
    this.cor_difusao = vec4(0.2, 0.8, 0.2, 1.0);
    this.alpha_especular = 10;

    this.terrenos_visiveis = 3; 
    this.proximoX = 0;

    this.init = function() {
        this.proximoX = this.tamanhoX;
        for (let i = 0; i < this.terrenos_visiveis; i++) {
            this.adicionar_terreno(this.proximoX);
            this.proximoX -= this.tamanhoX;
        }
    };

    this.adicionar_terreno = function(posX) {
        let posicao = vec3(posX, 0, 0);
        let novo_terreno = new Terreno(
            posicao,
            this.lado,
            this.largura_pista,
            this.largura_faixa,
            this.quantidade_emX,
            this.quantidade_emZ,
            this.altura_maxima,
            this.cor_ambiente,
            this.cor_difusao,
            this.alpha_especular,
            this.textura,
            false
        );
        novo_terreno.init();
        this.terrenos.push(novo_terreno);
    };

    this.atualiza_posicao_orientacao = function(delta) {
        let novo_caminhao_em_x = caminhao.posicao[0];

        let limite = this.proximoX + this.tamanhoX;
        if (novo_caminhao_em_x < limite) {
            this.adicionar_terreno(this.proximoX);
            this.proximoX -= this.tamanhoX;
        }

        if (this.terrenos.length > this.terrenos_visiveis) {
            let terreno_de_tras = this.terrenos[0];
            let bordaDianteiraDoTerrenoDeTras = terreno_de_tras.posicao[0] - this.tamanhoX / 2;

            if (novo_caminhao_em_x < bordaDianteiraDoTerrenoDeTras) {
                this.terrenos.splice(0, 1);
                gFloresta.origens_arvores.splice(0, gFloresta.origens_arvores.length / 4);
            }
        }
    };

    this.atualiza_model = function() {
        for (let i = 0; i < this.terrenos.length; i++) {
            this.terrenos[i].atualiza_model();
        }
    };

    this.desenha = function() {
        for (let i = 0; i < this.terrenos.length; i++) {
            this.terrenos[i].desenha();
        }
    };

    this.adiciona_ao_cenario = function() {
        gObjetos.push(this);
    };
}