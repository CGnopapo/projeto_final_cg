function Cilindro_textura(detalhe = 2, id_tex = 3, cor_ambiente, cor_difusao, alpha_especular, textura, e_da_internet) {
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
    
    this.init = function () {
        const OFFSET_Y = vec4(0, 1, 0, 0);

        gl.useProgram(gShaderTextura.program);

        let vertices_base = aproximeDisco(this.detalhe);
        let vertices_topo = vertices_base.map((v) => add(v, OFFSET_Y));
        let vertices = vertices_base.concat(vertices_topo);

        let num_lados = vertices_base.length;
        for (let i = 0; i < num_lados; i++) {
            let j = (i + 1) % num_lados;
            this.quad_textura_cilindro(this.pos, this.nor, this.textura_st, vertices, i + num_lados, j + num_lados, j, i);
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

    

    this.atualiza_posicao_orientacao = function(delta) {}

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
    

    this.quad_textura_cilindro = function (pos, nor,textura_st, vert, a, b, c, d) {
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

        pos.push(vert[a]);
        nor.push(normal);
        textura_st.push(this.mapeia(vert[a]));

        pos.push(vert[c]);
        nor.push(normal);
        textura_st.push(this.mapeia(vert[c]));

        pos.push(vert[d]);
        nor.push(normal);
        textura_st.push(this.mapeia(vert[d]));
    };

    this.mapeia = function (v) {
        let angulo = (Math.atan2(v[0], v[2]) + Math.PI) / (2 * Math.PI);
        let altura = v[1] + .5;
        return vec2(angulo, altura);
    };
}

function aproximeDisco(detalhe) {
    const RAIO = .5;
    // primeiro um quadrado ao redor da origem
    let vertices = [
        vec4( RAIO, 0,     0, 0),
        vec4(    0, 0,  RAIO, 0),
        vec4(-RAIO, 0,     0, 0),
        vec4(    0, 0, -RAIO, 0),
    ];

    // refinamento: adiciona 1 vértice em cada lado
    for (let i = 1; i < detalhe; i++) {
        let novo = [];
        let nv = vertices.length;
        for (let j = 0; j < nv; j++) {
            novo.push(vertices[j]); 
            let k = (j + 1) % nv;
            let v0 = vertices[j];
            let v1 = vertices[k];
            let m = mix(v0, v1, 0.5);

            let s = RAIO / length(m);
            m = mult(s, m)
            novo.push(m);
        }
        vertices = novo;
    }
    return vertices.map((v) => add(v, vec4(0, -.5, 0, 1)));
};