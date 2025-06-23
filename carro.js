function Carro(posicao, orientacao, velo_trans, vel_rotacao, escala, cor_ambiente, cor_difusao, alpha_especular) {
    this.posicao = posicao;
    this.orientacao = orientacao;
    this.velo_trans = velo_trans;   // Velocidade do carro como um todo
    this.vel_rotacao = vel_rotacao; // Velocidade do carro como um todo
    this.escala = escala;

    this.partes = [];
    let deslocamento = 0.2;

    // Base do carro (posição relativa ao centro do carro)
    this.partes.push(new Parte_relativa(
        vec3(0, 0, 0),
        vec3(0, 0, 0),
        mult(escala, vec3(2.0, 0.5, 1.0)),
        cor_ambiente, cor_difusao, alpha_especular
    ));

    // Teto do carro
    this.partes.push(new ParteRelativa_teto_e_carga(
        vec3(deslocamento, 0.8, 0),
        vec3(0, 0, 0),
        mult(escala, vec3(1.2, 0.1, 0.8)),
        cor_ambiente, cor_difusao, alpha_especular
    ));

    // Colunas
    let dimensoes_base = vec3(2.0, 0.5, 1.0);
    let dimensoes_teto = vec3(0.9, 0.01, 0.7);
    let altura_base = dimensoes_base[1];
    let altura_teto = 0.8;
    // No dimensoes_base funciona, mas aqui não funciona, na verdade é pq o dimensoes_base só funciona
    // pq está no (0,0,0). Então, não é o teto que abaixo que não funciona e sim que
    // ele se baseia em algo que só funciona pq está no (0,0,0). Vou deixar hardcoded
    // pq funciona no olhometro
    //let dimensoes_teto = vec3(1.2, 0.1, 0.8);
    //let altura_teto = dimensoes_teto[1];

    // Cantos da parte superior da base do carro
    let cantos_base = [
        vec3(-dimensoes_base[0] / 2, altura_base / 2, -dimensoes_base[2] / 2),
        vec3(dimensoes_base[0] / 2, altura_base / 2, -dimensoes_base[2] / 2),
        vec3(-dimensoes_base[0] / 2, altura_base / 2, dimensoes_base[2] / 2),
        vec3(dimensoes_base[0] / 2, altura_base / 2, dimensoes_base[2] / 2),
    ];

    // Cantos da parte inferior do teto do carro
    let cantos_teto = [
        vec3((-dimensoes_teto[0] / 2) + deslocamento, altura_teto - dimensoes_teto[1] / 2, -dimensoes_teto[2] / 2),
        vec3((dimensoes_teto[0] / 2) + deslocamento, altura_teto - dimensoes_teto[1] / 2, -dimensoes_teto[2] / 2),
        vec3((-dimensoes_teto[0] / 2) + deslocamento, altura_teto - dimensoes_teto[1] / 2, dimensoes_teto[2] / 2),
        vec3((dimensoes_teto[0] / 2) + deslocamento, altura_teto - dimensoes_teto[1] / 2, dimensoes_teto[2] / 2),
    ];
    // Gera cada coluna que liga a base ao teto
    for (let i = 0; i < 4; i++) {
        let p0 = cantos_base[i];
        let p1 = cantos_teto[i];
        let delta = subtract(p1, p0);
        let altura = length(delta);
        let meio = add(p0, scale(0.5, delta));
        let dir = normalize(delta);
        // Esse eixo determina o eixo no qual é necessário girar o vetor (0,1,0) para ele estar na direção de dir
        let eixo = cross(vec3(0, 1, 0), dir);
        // angulo entre o dir e o (0,1,0)
        let angulo = Math.acos(dot(vec3(0, 1, 0), dir)) * 180 / Math.PI;
        let orientacao_coluna;
        if (eixo[0] === 0 && eixo[1] === 0 && eixo[2] === 0) {
            orientacao_coluna = vec3(0, 0, 0);
        } else {
            orientacao_coluna = scale(angulo, eixo);
        }

        this.partes.push(new Parte_relativa(
            meio,
            orientacao_coluna,
            mult(escala, vec3(0.05, altura - 0.06, 0.05)),
            cor_ambiente, cor_difusao, alpha_especular
        ));
    }

    //////// Rodas///////
    let raio_roda = 0.15;
    let largura_roda = 0.1;
    let s = -dimensoes_base[1] / 2 - raio_roda;

    let posicoes_rodas = [
        vec3(-0.8, s, -0.46),
        vec3(0.8, s, -0.46),
        vec3(-0.8, s, 0.46),
        vec3(0.8, s, 0.46)
    ];
    
    for (let pos of posicoes_rodas) {
        this.partes.push(new Parte_cilindrica(
            pos,
            vec3(90, 0, 0),
            mult(escala, vec3(raio_roda, largura_roda, raio_roda)),
            cor_ambiente, cor_difusao, alpha_especular
        ));
    }

    this.init = function() {
       for (let i = 0; i < this.partes.length; i++) {
            this.partes[i].init();
        }
    };

    this.atualiza_posicao_orientacao = function(delta) {
        this.posicao = add(this.posicao, mult(delta, this.velo_trans));
        this.orientacao = add(this.orientacao, mult(delta, this.vel_rotacao));
    };

    this.atualiza_model = function() {
        let matriz_model_carro_inteiro = mult(
            mult(mult(translate(this.posicao[0], this.posicao[1], this.posicao[2]), rotateX(this.orientacao[0])),
                rotateY(this.orientacao[1])
            ),
            rotateZ(this.orientacao[2])
        );

        for (let i = 0; i < this.partes.length; i++) {
            this.partes[i].atualiza_model(matriz_model_carro_inteiro);
        }
    };

    this.adiciona_ao_cenario = function () {
        gObjetos.push(this); // adiciona o carro inteiro
    };
    this.desenha = function () {
        for (let i = 0; i < this.partes.length; i++) {
            this.partes[i].desenha();
        }
    };

}

