textura = new Image();
textura.src = "estrada.jpg";

function Pista(quantidade_cubos, largura, comprimento, cor_ambiente, cor_difusao, alpha_especular) {
    this.cubos = [];
    this.quantidade_cubos = quantidade_cubos;
    this.largura = largura;
    this.comprimento = comprimento;
    this.espessura = 0.1;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;

    let metade_quanti_cubos = Math.floor(this.quantidade_cubos / 2);

    for (let i = -metade_quanti_cubos; i < metade_quanti_cubos; i++) { 
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
        let comprimento_total_pista = this.quantidade_cubos * this.comprimento;
        
        let metade_compri_pista = Math.floor(this.quantidade_cubos / 2) * this.comprimento;
        let ponto_corte = caminhao.posicao[0] + metade_compri_pista;
        for (let cubo of this.cubos) {
            if (cubo.posicao[0] > ponto_corte) {
                cubo.posicao[0] -= comprimento_total_pista;

                if (Math.random() < 0.3){

                    let centro_faixa = this.largura / 4; 
                    let lado;
                    if (Math.random() < 0.5) {
                        lado = -1;
                    } else {
                        lado = 1;
                    }
                    let posZ = lado * centro_faixa; 
                    let pos_novo = vec3(cubo.posicao[0], 0.6, posZ); 

                    let vel_x = -8 - Math.random()*6;
                    let cor_aleatoria = vec4(
                        Math.random(), 
                        Math.random(), 
                        Math.random(), 
                        1.0
                    );
                    if (Math.random()<0.7){
                        let carro = new Carro(
                        pos_novo,              // posição
                        vec3(0, 0, 0),              // orientação
                        vec3(vel_x, 0, 0),          // velocidade translacional
                        vec3(0, 0, 0),              // velocidade rotacional
                        vec3(1, 1, 1),              // escala
                        cor_aleatoria,               // cor ambiente
                        cor_aleatoria,                 // cor difusa
                        80                          // alpha especular
                        )    
                        carro.init()
                        carro.adiciona_ao_cenario();
                    }
                    else{
                        let vel_caminhao = +8 +Math.random() * 4; 
                        let pos_novo2 = vec3(pos_novo[0], 1, pos_novo[2]); // Corrige a posição Z
                        let caminhao_bot = new Caminhao(
                            pos_novo2,               // posicao
                            vec3(0, 0, 0),          // orientacao
                            vel_caminhao,           // velo_trans (escalar)
                            vec3(0, 0, 0),          // vel_rotacao
                            vec3(1, 1, 1),          // escala
                            cor_aleatoria,          // cor ambiente
                            cor_aleatoria,          // cor difusa
                            80                      // alpha especular
                        );
                        caminhao_bot.init();
                        caminhao_bot.adiciona_ao_cenario(); 
                    }
                }
            }
        }
    };

    this.atualiza_model = function () {
        for (let i = 0; i < this.cubos.length; i++) {
            this.cubos[i].atualiza_model();
        }
    };

    this.desenha = function () {
        for (let i = 0; i < this.cubos.length; i++) {
            this.cubos[i].desenha();
        }
    };
}