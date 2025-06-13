textura = new Image();
textura.src = "estrada.jpg";

function Pista(qtdCubos, largura, comprimento, cor_ambiente, cor_difusao, alpha_especular) {
    this.cubos = [];
    this.qtdCubos = qtdCubos;
    this.largura = largura;
    this.comprimento = comprimento;
    this.espessura = 0.1;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;

    const metade_qtd = Math.floor(this.qtdCubos / 2);

    for (let i = -metade_qtd; i < metade_qtd; i++) { 
        let pos = vec3(-i * comprimento, 0, 0);
        let escala = vec3(comprimento, this.espessura, this.largura);

        let cubo = new Cubo_textura(
            pos,
            vec3(0, 0, 0),
            vec3(0, 0, 0),
            vec3(0, 0, 0),
            escala,
            cor_ambiente,
            cor_difusao,
            alpha_especular,
            textura,
            false
        );
        cubo.init();
        this.cubos.push(cubo);
    }

    this.init = function () {};
    this.adiciona_ao_cenario = function () {
        gObjetos.push(this);
    };

    // Joga parte da pista para frente do caminhão
    this.atualiza_posicao_orientacao = function (delta) {
        const comprimento_total_pista = this.qtdCubos * this.comprimento;
        
        const metade_compri_pista = Math.floor(this.qtdCubos / 2) * this.comprimento;
        const ponto_corte = caminhao.posicao[0] + metade_compri_pista;

        for (let cubo of this.cubos) {
            if (cubo.posicao[0] > ponto_corte) {
                cubo.posicao[0] -= comprimento_total_pista;
            }
        }
    };

    this.atualiza_model = function () {
        this.cubos.forEach(cubo => cubo.atualiza_model());
    };

    this.desenha = function () {
        this.cubos.forEach(cubo => cubo.desenha());
    };
}