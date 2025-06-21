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

                if (Math.random() < 0.3){

                    const centroDaFaixa = this.largura / 4; 
                    const lado = Math.random() < 0.5 ? -1 : 1;
                    const posZ = lado * centroDaFaixa; 
                    let pos_novo_carro = vec3(cubo.posicao[0], 0.6, posZ); // Usa a nova posição do cubo

                    let vel_x = -8 - Math.random()*6;
                    let cor_aleatoria = vec4(
                        Math.random(), // R entre 0.0 e 1.0
                        Math.random(), // G entre 0.0 e 1.0
                        Math.random(), // B entre 0.0 e 1.0
                        1.0
                    );

                    let carro = new Carro(
                    pos_novo_carro,              // posição
                    vec3(0, 0, 0),              // orientação
                    vec3(vel_x, 0, 0),          // velocidade translacional
                    vec3(0, 0, 0),              // velocidade rotacional
                    vec3(1, 1, 1),              // escala
                    cor_aleatoria,               // cor ambiente
                    cor_aleatoria,                 // cor difusa
                    80                          // alpha especular
                );
                carro.init()
                carro.adiciona_ao_cenario();
                }
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