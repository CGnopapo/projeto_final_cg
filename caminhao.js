function Caminhao(posicao, orientacao, velo_trans, vel_rotacao, escala, cor_ambiente, cor_difusao, alpha_especular, textura_painel, textura_porta_dir, textura_porta_esq) {
    this.posicao = posicao;
    this.orientacao = orientacao;
    this.velo_trans = velo_trans;   
    this.vel_rotacao = vel_rotacao; 
    this.escala = escala;

    this.partes = [];
    const deslocamento = 0.25;

    this.partes.push(new ParteRelativa(
        vec3(0, 0, 0),
        vec3(0, 0, 0),
        mult(escala, vec3(1.7, 0.75, 1.5)),
        cor_ambiente, cor_difusao, alpha_especular
    ));

    const W = 1.7;
    const H = 0.75;
    const D = 1.5;

 if (textura_painel) {
    this.partes.push(new ParteTexturizada(
        vec3(-W / 2 -0.49, 0, 0),
        vec3(0, 90, 0),
        mult(escala, vec3(D, H, 1)),
        cor_ambiente, cor_difusao, alpha_especular,
        textura_painel,
        2 
    ));
}

if (textura_porta_dir) {
    this.partes.push(new ParteTexturizada(
        vec3(0, 0, D / 2 +0.49),
        vec3(0, 180, 0),
        mult(escala, vec3(W, H, 1)),
        cor_ambiente, cor_difusao, alpha_especular,
        textura_porta_dir,
        3 
    ));
}

if (textura_porta_esq) {
    this.partes.push(new ParteTexturizada(
        vec3(0, 0, -D / 2 -0.49),
        vec3(0, 0, 0),
        mult(escala, vec3(W, H, 1)),
        cor_ambiente, cor_difusao, alpha_especular,
        textura_porta_esq,
        4 
    ));
}

    // Teto do carro
    this.partes.push(new ParteRelativa_teto_e_carga(
        vec3(deslocamento, 1, 0),
        vec3(0, 0, 0),
        mult(escala, vec3(1.3, 0.1, 1.4)),
        cor_ambiente, cor_difusao, alpha_especular
    ));

    // Colunas
    const baseDims = vec3(1.7, 0.7, 1.5);
    const tetoDims = vec3(1.1, 0.01, 1.4);
    const baseAltura = baseDims[1];
    const tetoAltura = 1;
    // No baseDims funciona, mas aqui não funciona, na verdade é pq o baseDims só funciona
    // pq está no (0,0,0). Então, não é o teto que abaixo que não funciona e sim que
    // ele se baseia em algo que só funciona pq está no (0,0,0). Vou deixar hardcoded
    // pq funciona no olhometro
    //const tetoDims = vec3(1.2, 0.1, 0.8);
    //const tetoAltura = tetoDims[1];

    // Cantos da parte superior da base do carro
    const baseCantos = [
        vec3(-baseDims[0] / 2, baseAltura / 2, -baseDims[2] / 2),
        vec3(baseDims[0] / 2, baseAltura / 2, -baseDims[2] / 2),
        vec3(-baseDims[0] / 2, baseAltura / 2, baseDims[2] / 2),
        vec3(baseDims[0] / 2, baseAltura / 2, baseDims[2] / 2),
    ];

    // Cantos da parte inferior do teto do carro
    const tetoCantos = [
        vec3((-tetoDims[0] / 2) + deslocamento, tetoAltura - tetoDims[1] / 2, -tetoDims[2] / 2),
        vec3((tetoDims[0] / 2) + deslocamento, tetoAltura - tetoDims[1] / 2, -tetoDims[2] / 2),
        vec3((-tetoDims[0] / 2) + deslocamento, tetoAltura - tetoDims[1] / 2, tetoDims[2] / 2),
        vec3((tetoDims[0] / 2) + deslocamento, tetoAltura - tetoDims[1] / 2, tetoDims[2] / 2),
    ];
    // Gera cada coluna que liga a base ao teto
    for (let i = 0; i < 4; i++) {
        const p0 = baseCantos[i];
        const p1 = tetoCantos[i];
        const delta = subtract(p1, p0);
        const altura = length(delta);
        const meio = add(p0, scale(0.5, delta));
        const dir = normalize(delta);
        // Esse eixo determina o eixo no qual é necessário girar o vetor (0,1,0) para ele estar na direção de dir
        const eixo = cross(vec3(0, 1, 0), dir);
        // angulo entre o dir e o (0,1,0)
        const angulo = Math.acos(dot(vec3(0, 1, 0), dir)) * 180 / Math.PI;
        let orientColuna;
        if (eixo[0] === 0 && eixo[1] === 0 && eixo[2] === 0) {
            orientColuna = vec3(0, 0, 0);
        } else {
            orientColuna = scale(angulo, eixo);
        }

        this.partes.push(new ParteRelativa(
            meio,
            orientColuna,
            mult(escala, vec3(0.05, altura - 0.06, 0.05)),
            cor_ambiente, cor_difusao, alpha_especular
        ));
    }

    //////// Rodas///////
    const raioRoda = 0.3;
    const larguraRoda = 0.4;
    const offsetY = -baseDims[1] / 2 - raioRoda;

    const posRodas = [
        vec3(0.15, offsetY, -0.7),
        vec3(0.15, offsetY, 0.7),
        vec3(7, offsetY, -0.7),
        vec3(7, offsetY, 0.7),
        vec3(6.37, offsetY, -0.7),
        vec3(6.37, offsetY, 0.7),
        vec3(2.5, offsetY, -0.7),
        vec3(2.5, offsetY, 0.7),
    ];

    
    for (const pos of posRodas) {
        this.partes.push(new ParteCilindrica(
            pos,
            vec3(90, 0, 0),
            mult(escala, vec3(raioRoda, larguraRoda, raioRoda)),
            cor_ambiente, cor_difusao, alpha_especular
        ));
    }

    ///////// Carga ///////////

    this.partes.push(new ParteRelativa_teto_e_carga(
        vec3(4.4, 0.65, 0),
        vec3(0, 0, 0),
        mult(escala, vec3(7, 2, 1.5)),
        cor_ambiente, cor_difusao, alpha_especular
    ));


    this.init = function() {
        this.partes.forEach(p => p.init());
    };

    this.atualiza_posicao_orientacao = function(delta) {
        this.orientacao = add(this.orientacao, mult(delta, this.vel_rotacao));
        let R = mult(rotateZ(this.orientacao[2]), mult(rotateY(this.orientacao[1]), rotateX(this.orientacao[0])));
        let eixo_x = vec4(1,0,0,0)

        let eixo_x_transformado_mundo = mult(R,eixo_x)
        let nova_direcao_translacao_mundo = mult(-1,eixo_x_transformado_mundo);
        let vetor_deslocamento = mult(delta,mult(this.velo_trans,nova_direcao_translacao_mundo));
        let vetor_deslocamento3 = vec3(vetor_deslocamento[0],vetor_deslocamento[1],vetor_deslocamento[2]);
        this.posicao = add(this.posicao, vetor_deslocamento3);
    };

    this.atualiza_model = function() {
        const matriz_model_carro_inteiro = mult(
            mult(
                mult(
                    translate(this.posicao[0], this.posicao[1], this.posicao[2]),
                    rotateX(this.orientacao[0])
                ),
                rotateY(this.orientacao[1])
            ),
            rotateZ(this.orientacao[2])
        );

        this.partes.forEach(p => p.atualiza_model(matriz_model_carro_inteiro));
    };

    this.adiciona_ao_cenario = function () {
        gObjetos.push(this); // adiciona o carro inteiro
    };
    this.desenha = function () {
        this.partes.forEach(p => {
            p.desenha();
        });
    };

}

function ParteRelativa(posRelativa, orientacaoRelativa, escala, cor_ambiente, cor_difusao, alpha_especular) {
    this.posRelativa = posRelativa;
    this.orientacaoRelativa = orientacaoRelativa;
    this.escala = escala;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.model = null;

    this.pos = [];
    this.nor = [];
    this.vao = null;

    this.init = function () {
        quad(this.pos, this.nor, CUBO_CANTOS, 1, 0, 3, 2);
        quad(this.pos, this.nor, CUBO_CANTOS, 2, 3, 7, 6);
        quad(this.pos, this.nor, CUBO_CANTOS, 4, 0, 3, 7);
        quad(this.pos, this.nor, CUBO_CANTOS, 4, 5, 6, 7);
        quad(this.pos, this.nor, CUBO_CANTOS, 5, 4, 0, 1);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        const aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindVertexArray(null);
    };

    this.atualiza_model = function (matriz_model_carro_inteiro) {
        let model = translate(this.posRelativa[0], this.posRelativa[1], this.posRelativa[2]);
        model = mult(model, rotateX(this.orientacaoRelativa[0]));
        model = mult(model, rotateY(this.orientacaoRelativa[1]));
        model = mult(model, rotateZ(this.orientacaoRelativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };
    this.desenha = function () {
        const model = this.model;
        const modelView = mult(gCtx.view, model);
        const modelViewInvTrans = transpose(inverse(modelView));

        gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        gl.uniform4fv(gShader.uCorAmb, mult(LUZ.amb, this.cor_ambiente));
        gl.uniform4fv(gShader.uCorDif, mult(LUZ.dif, this.cor_difusao));
        gl.uniform4fv(gShader.uCorEsp, LUZ.esp);
        gl.uniform1f(gShader.uAlfaEsp, this.alpha_especular);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
    };


}
function ParteRelativa_teto_e_carga(posRelativa, orientacaoRelativa, escala, cor_ambiente, cor_difusao, alpha_especular) {
    this.posRelativa = posRelativa;
    this.orientacaoRelativa = orientacaoRelativa;
    this.escala = escala;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.model = null;

    this.pos = [];
    this.nor = [];
    this.vao = null;

    this.init = function () {
        quad(this.pos, this.nor, CUBO_CANTOS, 1, 0, 3, 2);
        quad(this.pos, this.nor, CUBO_CANTOS, 2, 3, 7, 6);
        quad(this.pos, this.nor, CUBO_CANTOS, 4, 0, 3, 7);
        quad(this.pos, this.nor, CUBO_CANTOS, 6, 5, 1, 2);
        quad(this.pos, this.nor, CUBO_CANTOS, 4, 5, 6, 7);
        quad(this.pos, this.nor, CUBO_CANTOS, 5, 4, 0, 1);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        const aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindVertexArray(null);
    };

    this.atualiza_model = function (matriz_model_carro_inteiro) {
        let model = translate(this.posRelativa[0], this.posRelativa[1], this.posRelativa[2]);
        model = mult(model, rotateX(this.orientacaoRelativa[0]));
        model = mult(model, rotateY(this.orientacaoRelativa[1]));
        model = mult(model, rotateZ(this.orientacaoRelativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };
    this.desenha = function () {
        const model = this.model;
        const modelView = mult(gCtx.view, model);
        const modelViewInvTrans = transpose(inverse(modelView));

        gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        gl.uniform4fv(gShader.uCorAmb, mult(LUZ.amb, this.cor_ambiente));
        gl.uniform4fv(gShader.uCorDif, mult(LUZ.dif, this.cor_difusao));
        gl.uniform4fv(gShader.uCorEsp, LUZ.esp);
        gl.uniform1f(gShader.uAlfaEsp, this.alpha_especular);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
    };
}


function ParteCilindrica(posRelativa, orientacaoRelativa, escala, cor_ambiente, cor_difusao, alpha_especular) {
    this.posRelativa = posRelativa;
    this.orientacaoRelativa = orientacaoRelativa;
    this.escala = escala;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.model = null;

    this.pos = [];
    this.nor = [];
    this.vao = null;

    this.init = function () {
        geraCilindro(this.pos, this.nor, 1.0, 1.0, 32); // raio, altura, segmentos

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        const aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        const aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindVertexArray(null);
    };

    this.atualiza_model = function (matriz_model_carro_inteiro) {
        let model = translate(this.posRelativa[0], this.posRelativa[1], this.posRelativa[2]);
        model = mult(model, rotateX(this.orientacaoRelativa[0]));
        model = mult(model, rotateY(this.orientacaoRelativa[1]));
        model = mult(model, rotateZ(this.orientacaoRelativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };

    this.desenha = function () {
        const model = this.model;
        const modelView = mult(gCtx.view, model);
        const modelViewInvTrans = transpose(inverse(modelView));

        gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        gl.uniform4fv(gShader.uCorAmb, mult(LUZ.amb, this.cor_ambiente));
        gl.uniform4fv(gShader.uCorDif, mult(LUZ.dif, this.cor_difusao));
        gl.uniform4fv(gShader.uCorEsp, LUZ.esp);
        gl.uniform1f(gShader.uAlfaEsp, this.alpha_especular);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
    };
}

function geraCilindro(pos, nor, raio, altura, segmentos) {
    const topo = altura / 2;
    const base = -altura / 2;

    for (let i = 0; i < segmentos; i++) {
        const theta = (2 * Math.PI * i) / segmentos;
        const proximo_theta = (2 * Math.PI * (i + 1)) / segmentos;

        const x0 = Math.cos(theta);
        const z0 = Math.sin(theta);
        const x1 = Math.cos(proximo_theta);
        const z1 = Math.sin(proximo_theta);

        // Lateral
        pos.push(vec4(x0 * raio, base, z0 * raio, 1));
        pos.push(vec4(x0 * raio, topo, z0 * raio, 1));
        pos.push(vec4(x1 * raio, topo, z1 * raio, 1));
        pos.push(vec4(x0 * raio, base, z0 * raio, 1));
        pos.push(vec4(x1 * raio, topo, z1 * raio, 1));
        pos.push(vec4(x1 * raio, base, z1 * raio, 1));

        for (let j = 0; j < 6; j++) {
            nor.push(vec3(x0 + x1, 0, z0 + z1));
        }

        // Base
        pos.push(vec4(0, base, 0, 1));
        pos.push(vec4(x1 * raio, base, z1 * raio, 1));
        pos.push(vec4(x0 * raio, base, z0 * raio, 1));

        nor.push(vec3(0, -1, 0));
        nor.push(vec3(0, -1, 0));
        nor.push(vec3(0, -1, 0));

        // Topo
        pos.push(vec4(0, topo, 0, 1));
        pos.push(vec4(x0 * raio, topo, z0 * raio, 1));
        pos.push(vec4(x1 * raio, topo, z1 * raio, 1));

        nor.push(vec3(0, 1, 0));
        nor.push(vec3(0, 1, 0));
        nor.push(vec3(0, 1, 0));
    }
}

function getAABBBaseCaminhao(caminhao) {
    const escala = caminhao.escala || vec3(1, 1, 1);
    const origemCaminhao = caminhao.posicao;

    const minLocal = vec3(-0.85, -0.375, -0.75);
    const maxLocal = vec3(7.9, 1.65, 0.75);

    const minMundo = vec3(
        origemCaminhao[0] + minLocal[0] * escala[0],
        origemCaminhao[1] + minLocal[1] * escala[1],
        origemCaminhao[2] + minLocal[2] * escala[2]
    );
    const maxMundo = vec3(
        origemCaminhao[0] + maxLocal[0] * escala[0],
        origemCaminhao[1] + maxLocal[1] * escala[1],
        origemCaminhao[2] + maxLocal[2] * escala[2]
    );

    return {
        min: minMundo,
        max: maxMundo
    };
}
function getAABBBaseCarro(carro) {
    const escala = carro.escala || vec3(1,1,1);
    const centro = carro.posicao;
    const metade = [
        2.0 * escala[0] / 2,
        0.5 * escala[1] / 2,
        1.0 * escala[2] / 2
    ];
    return {
        min: [centro[0] - metade[0], centro[1] - metade[1], centro[2] - metade[2]],
        max: [centro[0] + metade[0], centro[1] + metade[1], centro[2] + metade[2]]
    };
}

function aabbColide(a, b) {
    return (
        a.min[0] <= b.max[0] && a.max[0] >= b.min[0] &&
        a.min[1] <= b.max[1] && a.max[1] >= b.min[1] &&
        a.min[2] <= b.max[2] && a.max[2] >= b.min[2]
    );
}
function verificaColisaoCaminhaoCarros(caminhao, gObjetos) {
    const aabbCaminhao = getAABBBaseCaminhao(caminhao);
    for (let objeto of gObjetos) {
        if (objeto instanceof Carro) {
            const aabbCarro = getAABBBaseCarro(objeto);
            if (aabbColide(aabbCaminhao, aabbCarro)) {
                return true; 
            }
        }
        if (objeto instanceof Caminhao && objeto !== caminhao) {
            const aabbOutroCaminhao = getAABBBaseCaminhao(objeto);
            if (aabbColide(aabbCaminhao, aabbOutroCaminhao)) {
                return true; 
            }
        }
    }
    return false; 
}


function ParteTexturizada(posRelativa, orientacaoRelativa, escala, cor_ambiente, cor_difusao, alpha_especular, textura, unidadeTextura) {
    this.posRelativa = posRelativa;
    this.orientacaoRelativa = orientacaoRelativa;
    this.escala = escala;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.model = null;
    this.textura = textura;
    this.unidadeTextura = unidadeTextura; 

    this.pos = [];
    this.nor = [];
    this.textura_st = [];
    this.vao = null;

    this.init = function () {
        gl.useProgram(gShaderTextura.program);
        
        quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 1, 0, 3, 2);

        this.texture_obj = configureTextura(this.textura, this.unidadeTextura);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShaderTextura.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        const aNormal = gl.getAttribLocation(gShaderTextura.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        var bufTextura = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTextura);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.textura_st), gl.STATIC_DRAW);
        var aTexCoord = gl.getAttribLocation(gShaderTextura.program, "aTexCoord");
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);

        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), this.unidadeTextura);

        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
    };

    this.atualiza_model = function (matriz_model_carro_inteiro) {
        let model = translate(this.posRelativa[0], this.posRelativa[1], this.posRelativa[2]);
        model = mult(model, rotateX(this.orientacaoRelativa[0]));
        model = mult(model, rotateY(this.orientacaoRelativa[1]));
        model = mult(model, rotateZ(this.orientacaoRelativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };

    this.desenha = function () {
        gl.useProgram(gShaderTextura.program);

        gl.activeTexture(gl.TEXTURE0 + this.unidadeTextura);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_obj);
        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), this.unidadeTextura);
        
        const model = this.model;
        const modelView = mult(gCtx.view, model);
        const modelViewInvTrans = transpose(inverse(modelView));

        gl.uniformMatrix4fv(gShaderTextura.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(gShaderTextura.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShaderTextura.uInverseTranspose, false, flatten(modelViewInvTrans));

        gl.uniform4fv(gShaderTextura.uCorAmb, mult(LUZ.amb, this.cor_ambiente));
        gl.uniform4fv(gShaderTextura.uCorDif, mult(LUZ.dif, this.cor_difusao));
        gl.uniform4fv(gShaderTextura.uCorEsp, LUZ.esp);
        gl.uniform1f(gShaderTextura.uAlfaEsp, this.alpha_especular);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
    };
}