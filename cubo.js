const CUBO_CANTOS = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];


function Cubo(posicao,orientacao,velo_trans, vel_rotacao, escala, cor_ambiente,cor_difusao,alpha_especular) {

    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.posicao = posicao;
    this.velo_trans = velo_trans;
    this.vel_rotacao = vel_rotacao;
    this.escala = escala;
    this.orientacao = orientacao;
    this.np = 36;
    this.pos = [];
    this.nor = [];
    this.vao = null;
    this.model = null;

    this.theta = vec3(0, 0, 0);
    this.rodando = true;

    this.init = function () {
        // Gera as posições e normais
        quad(this.pos, this.nor, CUBO_CANTOS, 1, 0, 3, 2);
        quad(this.pos, this.nor, CUBO_CANTOS, 2, 3, 7, 6);
        quad(this.pos, this.nor, CUBO_CANTOS, 4,0,3,7);
        quad(this.pos, this.nor, CUBO_CANTOS, 6, 5, 1, 2);
        quad(this.pos, this.nor, CUBO_CANTOS, 4, 5, 6, 7);
        quad(this.pos, this.nor, CUBO_CANTOS, 5, 4, 0, 1);

        // === Criação do VAO ===
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Buffer de posições
        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        // Buffer de normais
        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        const aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        // Desvincula o VAO
        gl.bindVertexArray(null);
    };
    this.atualiza_posicao_orientacao = function(delta){
        this.posicao = add(this.posicao, mult(delta, this.velo_trans));
        this.orientacao = add(this.orientacao, mult(delta, this.vel_rotacao));
    }

    this.atualiza_model = function () {
        let model = translate(this.posicao[0], this.posicao[1], this.posicao[2]);
        model = mult(model, rotateX(this.orientacao[0]))
        model = mult(model, rotateY(this.orientacao[1]))
        model = mult(model, rotateZ(this.orientacao[2]))
        model = mult(model, scale(this.escala[0],this.escala[1],this.escala[2]));
        this.model = model;
    }
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


function quad(pos, nor, vert, a, b, c, d) {
    var t1 = subtract(vert[b], vert[a]);
    var t2 = subtract(vert[c], vert[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    pos.push(vert[a]);
    nor.push(normal);
    pos.push(vert[b]);
    nor.push(normal);
    pos.push(vert[c]);
    nor.push(normal);
    pos.push(vert[a]);
    nor.push(normal);
    pos.push(vert[c]);
    nor.push(normal);
    pos.push(vert[d]);
    nor.push(normal);
};