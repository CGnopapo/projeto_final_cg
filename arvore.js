texturaTronco = new Image();
texturaTronco.src = "assets/tree/bark.jpg";

texturaFolhas = new Image();
texturaFolhas.src = "assets/tree/leaves.jpg";

function Arvore(origem, fator_tamanho, dist_max) {
    this.partes = [];
    this.origem = origem;
    this.dist_max = dist_max;

    this.cor_ambiente = vec4(1, 1, 1, 1.0), // cor ambiente
    this.cor_difusao = vec4(1, 1, 1, 1.0), // cor difusa
    this.alpha_especular = 10 // alpha especular

    const ALTURA = 2.2 * fator_tamanho;
    const LARGURA = 3 * fator_tamanho;
    const NUM_CAMADAS = 4;

    const FATOR_REDUCAO = .4 * fator_tamanho;
    const FATOR_SUBIDA = .9 * fator_tamanho;
    const Y_BASE_FOLHAS = 3 * fator_tamanho;
    for (let i = 0; i < NUM_CAMADAS; i++) { 
        let offset = vec3(0, Y_BASE_FOLHAS + i * FATOR_SUBIDA, 0);
        let escala = vec3(LARGURA - (FATOR_REDUCAO * i), ALTURA, LARGURA - (FATOR_REDUCAO * i));

        let copa = new Cone_textura(
            add(this.origem, offset),
            vec3(10, 0, 0),
            escala,
            1.7,
            2,
            4,
            vec4(1, 1, 1, 1.0),   // cor ambiente
            vec4(1, 1, 1, 1.0),   // cor difusa
            20,                          // alpha especular
            texturaFolhas,
            false
        );
        copa.init();
        this.partes.push(copa);
    }

    let tronco_offset = vec3(0, Y_BASE_FOLHAS / 2, 0);
    let tronco = new Cilindro_textura(
        add(this.origem, tronco_offset),
        vec3(0, 0, 0),
        vec3(LARGURA / 4.5, Y_BASE_FOLHAS, LARGURA / 4.5),
        2,
        2,
        vec4(1, 1, 1, 1.0),   // cor ambiente
        vec4(1, 1, 1, 1.0),   // cor difusa
        20,                          // alpha especular
        texturaTronco,
        false
    );
    tronco.init();
    this.partes.push(tronco);

    this.init = function () {};
    this.adiciona_ao_cenario = function () {
        gObjetos.push(this);
    };

    // Joga parte da pista para frente do caminhão
    this.atualiza_posicao_orientacao = function (delta) {
        this.partes.forEach(parte => parte.atualiza_posicao_orientacao());
        
        const ponto_corte = this.dist_max + caminhao.posicao[0];

        for (let parte of this.partes) {
            if (parte.posicao[0] > ponto_corte) {
                parte.posicao[0] -= 2 * this.dist_max;
            }
        }
    };

    this.atualiza_model = function () {
        this.partes.forEach(parte => parte.atualiza_model());
    };

    this.desenha = function () {
        this.partes.forEach(parte => parte.desenha());
    };
}