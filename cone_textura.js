function Cone_textura(escala_tex = 1, detalhe = 2, id_tex = 3, cor_ambiente, cor_difusao, alpha_especular, textura, e_da_internet, fator_sway = 1) {
    this.e_da_internet = e_da_internet;
    this.textura = textura;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.pos = [];
    this.nor = [];
    this.textura_st = [];
    this.vao = null;
    this.model = null;
    this.detalhe = detalhe;
    this.id_tex = id_tex;
    this.escala_tex = escala_tex;
    this.fator_sway = fator_sway;

    this.init = function () {
        const TOPO = vec4(0, .5, 0, 1);
        const BASE = vec4(0, -.5, 0, 1);

        gl.useProgram(gShaderTextura.program);
        // Gera as posições e normais
        let vertices = aproximeDisco(this.detalhe);
        vertices.push(TOPO);
        vertices.push(BASE);

        let num_lados = vertices.length - 2;
        for (let i = 0; i < num_lados; i++) {
            let j = (i + 1) % num_lados;
            this.tri_textura_cone(this.pos, this.nor, this.textura_st, vertices, num_lados, j, i);
            // Essa base está comprimida. Um mapeamento melhor precisa ser cozido
            this.tri_textura_cone(this.pos, this.nor, this.textura_st, vertices, num_lados + 1, i, j);
        }

        // Configura textura
        if (e_da_internet){
            // configureTexturaDaURL(this.textura, this.id_tex);
        }
        else {
            this.texture = configura_textura(this.textura, this.id_tex);
        }
        // === Criação do VAO ===
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Buffer de posições
        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShaderTextura.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        // Buffer de normais
        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        const aNormal = gl.getAttribLocation(gShaderTextura.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);


        ///// buffer / in aTexCoord associado ao vetor gaTexCoords /// Não é a textuta uTextureMap e sim o as coordenadas (s,t)
        //// de cada vértice
        var bufTextura = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTextura);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.textura_st), gl.STATIC_DRAW);

        var aTexCoord = gl.getAttribLocation(gShaderTextura.program, "aTexCoord");
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);

        // Desvincula o VAO
        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
    };

    
    // Operações essenciais
    this.atualiza_posicao_orientacao = function(delta){
        this.sway();
    }

    this.atualiza_model = function (posicao, orientacao, escala) {
        let model = translate(posicao[0], posicao[1], posicao[2]);
        model = mult(model, rotateX(orientacao[0]))
        model = mult(model, rotateY(orientacao[1]))
        model = mult(model, rotateZ(orientacao[2]))
        model = mult(model, scale(escala[0],escala[1],escala[2]));
        this.model = model;
    }

    this.desenha = function () {
        gl.useProgram(gShaderTextura.program);
        gl.activeTexture(gl.TEXTURE0 + this.id_tex);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

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
        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), this.id_tex);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
    };


    // Alguns auxiliares
    this.sway = function () {
        const ESCALA_SWAY_X = 2;
        const ESCALA_SWAY_Z = 6;

        let now = this.fator_sway * Date.now() / 600;
        let x = Math.sin(now) * ESCALA_SWAY_X;
        let z = Math.cos(now) * ESCALA_SWAY_Z;
        this.orientacao[0] = x;
        this.orientacao[2] = z;
    };


    this.tri_textura_cone = function (pos, nor,textura_st, vert, a, b, c) {
        var t1 = subtract(vert[b], vert[a]);
        var t2 = subtract(vert[c], vert[b]);
        var normal = cross(t1, t2);
        normal = vec3(normal);

        pos.push(vert[a]);
        nor.push(normal);
        textura_st.push(this.mapeia(vert[a]));

        pos.push(vert[b]);
        nor.push(normal);
        textura_st.push(this.mapeia(vert[b]));

        pos.push(vert[c]);
        nor.push(normal);
        textura_st.push(this.mapeia(vert[c]));
    };

    this.mapeia = function (v) {
        let angulo = this.escala_tex * (Math.atan2(v[0], v[2]) + Math.PI) / (2 * Math.PI);
        let altura = this.escala_tex * (v[1] + .5);
        return vec2(angulo, altura);
    };
}
