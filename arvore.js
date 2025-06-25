texturaTronco = new Image();
texturaTronco.src = "assets/tree/bark.jpg";

texturaFolhas = new Image();
texturaFolhas.src = "assets/tree/leaves.jpg";

function Arvore(dist_max) {
    this.dist_max = dist_max;

    this.cor_ambiente = vec4(1, 1, 1, 1.0);
    this.cor_difusao = vec4(1, 1, 1, 1.0);
    this.alpha_especular = 10;

    this.tronco = new Cilindro_textura(
        2, 
        8,
        vec4(0.4, 0.4, 0.4, 1.0),
        vec4(0.7, 0.7, 0.7, 1.0),
        20,
        texturaTronco,
        false
    );
    this.tronco.init();

    this.copa = new Cone_textura(
        1,
        2,
        9,
        vec4(0.4, 0.4, 0.4, 1.0),
        vec4(0.7, 0.7, 0.7, 1.0),
        20,
        texturaFolhas,
        false
    );
    this.copa.init();

    this.init = function () {};
    this.adiciona_ao_cenario = function () {
        gObjetos.push(this);
    };

    this.atualiza_posicao_orientacao = function (delta) {};

    this.atualiza_model = function () {};

    this.desenha = function (origem, fatorTamanho) {
        const ALTURA = 2.2 * fatorTamanho;
        const LARGURA = 3 * fatorTamanho;
        const NUM_CAMADAS = 4;

        const FATOR_REDUCAO = .4 * fatorTamanho;
        const FATOR_SUBIDA = .9 * fatorTamanho;
        const Y_BASE_FOLHAS = 3 * fatorTamanho;

        /*
            Comentado por questões de performance
        */
        // const ESCALA_SWAY_X = 2;
        // const ESCALA_SWAY_Z = 6;

        // let now = Date.now() / 600;
        // let x = Math.sin(now) * ESCALA_SWAY_X;
        // let z = Math.cos(now) * ESCALA_SWAY_Z;
        // let orientacao = vec3(x, 0, z);
        let orientacao = vec3(0, 0, 0);

        for (let i = 0; i < NUM_CAMADAS; i++) { 
            let offset = vec3(0, Y_BASE_FOLHAS + i * FATOR_SUBIDA, 0);
            let escala = vec3(LARGURA - (FATOR_REDUCAO * i), ALTURA, LARGURA - (FATOR_REDUCAO * i));
            this.copa.atualiza_model(add(origem, offset), orientacao, escala);
            this.copa.desenha();
        }

        let tronco_offset = vec3(0, Y_BASE_FOLHAS / 2, 0);
        let tronco_escala = vec3(LARGURA / 4.5, Y_BASE_FOLHAS, LARGURA / 4.5);
        this.tronco.atualiza_model(add(origem, tronco_offset), vec3(0, 0, 0), tronco_escala);
        this.tronco.desenha();
    };
}