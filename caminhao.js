function Caminhao(posicao, orientacao, velo_trans, vel_rotacao, escala, cor_ambiente, cor_difusao, alpha_especular, textura_painel , textura_porta_dir , textura_porta_esq ) {
    this.posicao = posicao;
    this.orientacao = orientacao;
    this.velo_trans = velo_trans;   
    this.vel_rotacao = vel_rotacao; 
    this.escala = escala;

    this.partes = [];
    let deslocamento = 0.25;

    this.partes.push(new Parte_relativa(
        vec3(0, 0, 0),
        vec3(0, 0, 0),
        mult(escala, vec3(1.7, 0.75, 1.5)),
        cor_ambiente, cor_difusao, alpha_especular
    ));

    let largura = 1.7;
    let altura = 0.75;
    let dis = 1.5;

 if (textura_painel)  {
    this.partes.push(new Parte_textura(
        vec3(-largura / 2 -0.49, 0, 0),
        vec3(0, 90, 0),
        mult(escala, vec3(dis, altura, 1)),
        cor_ambiente, cor_difusao, alpha_especular,
        textura_painel,
        2 
    ));
}

if (textura_porta_dir ) {
    this.partes.push(new Parte_textura(
        vec3(0, 0, dis / 2 +0.49),
        vec3(0, 180, 0),
        mult(escala, vec3(largura, altura, 1)),
        cor_ambiente, cor_difusao, alpha_especular,
        textura_porta_dir,
        3 
    ));
}

if (textura_porta_esq ) {
    this.partes.push(new Parte_textura(
        vec3(0, 0, -dis / 2 -0.49),
        vec3(0, 0, 0),
        mult(escala, vec3(largura, altura, 1)),
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
    let dimensoes_base = vec3(1.7, 0.7, 1.5);
    let dimensoes_teto = vec3(1.1, 0.01, 1.4);
    let altura_base = dimensoes_base[1];
    let altura_teto = 1;
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
    let raio_roda = 0.3;
    let largura_roda = 0.4;
    let s = -dimensoes_base[1] / 2 - raio_roda;

    let posicoes_rodas = [
        vec3(0.15, s, -0.7),
        vec3(0.15, s, 0.7),
        vec3(7, s, -0.7),
        vec3(7, s, 0.7),
        vec3(6.37, s, -0.7),
        vec3(6.37, s, 0.7),
        vec3(2.5, s, -0.7),
        vec3(2.5, s, 0.7),
    ];

    
    for (let pos of posicoes_rodas) {
        this.partes.push(new Parte_cilindrica(
            pos,
            vec3(90, 0, 0),
            mult(escala, vec3(raio_roda, largura_roda, raio_roda)),
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
       for (let i = 0; i < this.partes.length; i++) {
            this.partes[i].init();
        }
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

function Parte_relativa(pos_relativa, orientacao_relativa, escala, cor_ambiente, cor_difusao, alpha_especular) {
    this.pos_relativa = pos_relativa;
    this.orientacao_relativa = orientacao_relativa;
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

        let bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        let bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        let aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindVertexArray(null);
    };

    this.atualiza_model = function (matriz_model_carro_inteiro) {
        let model = translate(this.pos_relativa[0], this.pos_relativa[1], this.pos_relativa[2]);
        model = mult(model, rotateX(this.orientacao_relativa[0]));
        model = mult(model, rotateY(this.orientacao_relativa[1]));
        model = mult(model, rotateZ(this.orientacao_relativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };
    this.desenha = function () {
        let model = this.model;
        let modelView = mult(gCtx.view, model);
        let modelViewInvTrans = transpose(inverse(modelView));

        gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        gl.uniform4fv(gShader.uCorAmb, mult(gLuzGlobal.amb(), this.cor_ambiente));
        gl.uniform4fv(gShader.uCorDif, mult(gLuzGlobal.dif(), this.cor_difusao));
        gl.uniform4fv(gShader.uCorEsp, gLuzGlobal.esp());
        gl.uniform1f(gShader.uAlfaEsp, this.alpha_especular);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
    };


}
function ParteRelativa_teto_e_carga(pos_relativa, orientacao_relativa, escala, cor_ambiente, cor_difusao, alpha_especular) {
    this.pos_relativa = pos_relativa;
    this.orientacao_relativa = orientacao_relativa;
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

        let bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        let bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        let aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindVertexArray(null);
    };

    this.atualiza_model = function (matriz_model_carro_inteiro) {
        let model = translate(this.pos_relativa[0], this.pos_relativa[1], this.pos_relativa[2]);
        model = mult(model, rotateX(this.orientacao_relativa[0]));
        model = mult(model, rotateY(this.orientacao_relativa[1]));
        model = mult(model, rotateZ(this.orientacao_relativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };
    this.desenha = function () {
        let model = this.model;
        let modelView = mult(gCtx.view, model);
        let modelViewInvTrans = transpose(inverse(modelView));

        gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        gl.uniform4fv(gShader.uCorAmb, mult(gLuzGlobal.amb(), this.cor_ambiente));
        gl.uniform4fv(gShader.uCorDif, mult(gLuzGlobal.dif(), this.cor_difusao));
        gl.uniform4fv(gShader.uCorEsp, gLuzGlobal.esp());
        gl.uniform1f(gShader.uAlfaEsp, this.alpha_especular);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
    };
}


function Parte_cilindrica(pos_relativa, orientacao_relativa, escala, cor_ambiente, cor_difusao, alpha_especular) {
    this.pos_relativa = pos_relativa;
    this.orientacao_relativa = orientacao_relativa;
    this.escala = escala;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.model = null;

    this.pos = [];
    this.nor = [];
    this.vao = null;

    this.init = function () {
        gera_cilindro(this.pos, this.nor, 1.0, 1.0, 32); // raio, altura, segmentos

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        let bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        let aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        let bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        let aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindVertexArray(null);
    };

    this.atualiza_model = function (matriz_model_carro_inteiro) {
        let model = translate(this.pos_relativa[0], this.pos_relativa[1], this.pos_relativa[2]);
        model = mult(model, rotateX(this.orientacao_relativa[0]));
        model = mult(model, rotateY(this.orientacao_relativa[1]));
        model = mult(model, rotateZ(this.orientacao_relativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };

    this.desenha = function () {
        let model = this.model;
        let modelView = mult(gCtx.view, model);
        let modelViewInvTrans = transpose(inverse(modelView));

        gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        gl.uniform4fv(gShader.uCorAmb, mult(gLuzGlobal.amb(), this.cor_ambiente));
        gl.uniform4fv(gShader.uCorDif, mult(gLuzGlobal.dif(), this.cor_difusao));
        gl.uniform4fv(gShader.uCorEsp, gLuzGlobal.esp());
        gl.uniform1f(gShader.uAlfaEsp, this.alpha_especular);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
    };
}

function gera_cilindro(pos, nor, raio, altura, segmentos) {
    let topo = altura / 2;
    let base = -altura / 2;

    for (let i = 0; i < segmentos; i++) {
        let theta = (2 * Math.PI * i) / segmentos;
        let proximo_theta = (2 * Math.PI * (i + 1)) / segmentos;

        let x0 = Math.cos(theta);
        let z0 = Math.sin(theta);
        let x1 = Math.cos(proximo_theta);
        let z1 = Math.sin(proximo_theta);
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

function getAABB_base_caminhao(caminhao) {
    let escala = caminhao.escala 
    let origemCaminhao = caminhao.posicao;

    let minLocal = vec3(-0.85, -0.375, -0.75);
    let maxLocal = vec3(7.9, 1.65, 0.75);

    let minMundo = vec3( origemCaminhao[0] + minLocal[0] * escala[0], origemCaminhao[1] + minLocal[1] * escala[1],
        origemCaminhao[2] + minLocal[2] * escala[2]
    );
    let maxMundo = vec3( origemCaminhao[0] + maxLocal[0] * escala[0], origemCaminhao[1] + maxLocal[1] * escala[1],
        origemCaminhao[2] + maxLocal[2] * escala[2]
    );

    let resultado = {};
    resultado.min = minMundo;
    resultado.max = maxMundo;
    return resultado;
}
function getAABB_base_carro(carro) {
    let escala = carro.escala 
    let centro = carro.posicao;
    let metade = [2.0 * escala[0] / 2, 0.5 * escala[1] / 2, 1.0 * escala[2] / 2];
    let min = [
        centro[0] - metade[0],
        centro[1] - metade[1],
        centro[2] - metade[2]
    ];
    let max = [
        centro[0] + metade[0],
        centro[1] + metade[1],
        centro[2] + metade[2]
    ];
    let resultado = { min: min, max: max };
    return resultado;
}

function detecta_colisao(a, b) {
    let colideX = a.min[0] <= b.max[0] && a.max[0] >= b.min[0];
    let colideY = a.min[1] <= b.max[1] && a.max[1] >= b.min[1];
    let colideZ = a.min[2] <= b.max[2] && a.max[2] >= b.min[2];
    let resultado = colideX && colideY && colideZ;
    return resultado;
}
function verifica_colisao(caminhao, gObjetos) {
    let aabb_caminhao = getAABB_base_caminhao(caminhao);
    for (let objeto of gObjetos) {
        if (objeto instanceof Carro) {
            let aabb_carro = getAABB_base_carro(objeto);
            if (detecta_colisao(aabb_caminhao, aabb_carro)) {
                return true; 
            }
        }
        if (objeto instanceof Caminhao && objeto !== caminhao) {
            let aabb_outro_caminhao = getAABB_base_caminhao(objeto);
            if (detecta_colisao(aabb_caminhao, aabb_outro_caminhao)) {
                return true; 
            }
        }
    }
    return false; 
}


function Parte_textura(pos_relativa, orientacao_relativa, escala, cor_ambiente, cor_difusao, alpha_especular, textura, unidadeTextura) {
    this.pos_relativa = pos_relativa;
    this.orientacao_relativa = orientacao_relativa;
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

        this.texture_obj = configura_textura(this.textura, this.unidadeTextura);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        let bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShaderTextura.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        let bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        let aNormal = gl.getAttribLocation(gShaderTextura.program, "aNormal");
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
        let model = translate(this.pos_relativa[0], this.pos_relativa[1], this.pos_relativa[2]);
        model = mult(model, rotateX(this.orientacao_relativa[0]));
        model = mult(model, rotateY(this.orientacao_relativa[1]));
        model = mult(model, rotateZ(this.orientacao_relativa[2]));
        model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));
        this.model = mult(matriz_model_carro_inteiro, model);
    };

    this.desenha = function () {
        gl.useProgram(gShaderTextura.program);

        gl.activeTexture(gl.TEXTURE0 + this.unidadeTextura);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_obj);
        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), this.unidadeTextura);
        
        let model = this.model;
        let modelView = mult(gCtx.view, model);
        let modelViewInvTrans = transpose(inverse(modelView));

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