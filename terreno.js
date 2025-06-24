function Terreno(posicao, lado, largura_pista, largura_faixa, quantidade_em_x, quantidade_em_z, altura_maxima, cor_ambiente, cor_difusao, alpha_especular, textura, e_da_internet) {
    this.posicao = posicao;
    this.lado = lado;
    this.largura_pista = largura_pista;
    this.largura_faixa = largura_faixa;
    this.quantidade_em_x = quantidade_em_x;
    this.quantidade_em_z = quantidade_em_z;
    this.altura_maxima = altura_maxima;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.textura = textura;
    this.e_da_internet = e_da_internet;
    this.tamanhoX = 1200;
    this.vertices = [];
    this.normais = [];
    this.indices = [];
    this.texcoords = [];

    this.vao = null;
    this.model = null;

    this.noise = function(x, z) {
        let escala = 50.0;
        return Math.sin(x / escala) * Math.cos(z / escala) * this.altura_maxima;
    };

    this.geraMalha = function(floresta) {
        this.vertices = [];
        this.normais = [];
        this.indices = [];
        this.texcoords = [];

        let gTextura_st = [
            vec2(0.0, 0.0), 
            vec2(0.0, 1.0),
            vec2(1.0, 1.0), 
            vec2(1.0, 0.0)  
        ];

        let metade_pista = this.largura_pista / 2;
        let largura_segmento = this.tamanhoX / this.quantidade_em_x;
        let profundidade_segmento = this.largura_faixa / this.quantidade_em_z;

        for (let indice_x = 0; indice_x < this.quantidade_em_x; ++indice_x) {
            for (let indice_z = 0; indice_z < this.quantidade_em_z; ++indice_z) {
                
                let vertices_q = [];
                for (let i = 0; i < 2; i++) { 
                    for (let j = 0; j < 2; j++) { 
                        let indice_x_atual = indice_x + i;
                        let indice_z_atual = indice_z + j;

                        let x_local = -this.tamanhoX / 2 + indice_x_atual * largura_segmento;
                        let razao = indice_z_atual / this.quantidade_em_z;
                        
                        let z;
                        if (this.lado === 'direito') {
                            z = metade_pista + (indice_z_atual * profundidade_segmento);
                        } else {
                            z = -metade_pista - (indice_z_atual * profundidade_segmento);
                        }
                        
                        let x = this.posicao[0] + x_local;
                        let y = this.noise(x, z) * razao;
                        
                        vertices_q.push(vec4(x_local, y, z, 1.0));
                    }
                }
                
                if (indice_z % 2 == 1 && indice_z < this.quantidade_em_z / 4) {
                    let p = vec3(this.posicao[0] + vertices_q[0][0], vertices_q[0][1], vertices_q[0][2]);
                    floresta.origens_arvores.push(p);
                    floresta.tamanhos_arvores.push(floresta.geraTamanhoAleatorio());
                }

                let v0 = vertices_q[0]; 
                let v1 = vertices_q[1];

                let v2 = vertices_q[2]; 
                let v3 = vertices_q[3]; 

                let vetor1 = subtract(v1, v0);
                let vetor2 = subtract(v2, v0);
                let normal = normalize(cross(vetor1, vetor2));

                if(this.lado === 'esquerdo') {
                    normal = mult(-1, normal);
                }
                
                let a = this.vertices.length;
                this.vertices.push(v0, v1, v2, v3);
                this.normais.push(normal, normal, normal, normal);
                this.texcoords.push(gTextura_st[0], gTextura_st[1], gTextura_st[3], gTextura_st[2]);
                this.indices.push(a, a + 1, a + 2);
                this.indices.push(a + 2, a + 1, a + 3);
            }
        }
    };

    
    this.init = function(floresta) {
        gl.useProgram(gShaderTextura.program);
        this.geraMalha(floresta);

        if (this.e_da_internet) {
            this.texture = configura_texturaDaURL(this.textura);
        } else {
            this.texture = configura_textura(this.textura, 1);
        }

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        let bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
        let aPosition = gl.getAttribLocation(gShaderTextura.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        let bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normais), gl.STATIC_DRAW);
        let aNormal = gl.getAttribLocation(gShaderTextura.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        let bufTex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTex);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texcoords), gl.STATIC_DRAW);
        let aTexCoord = gl.getAttribLocation(gShaderTextura.program, "aTexCoord");
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);

        let bufIndices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIndices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), 1);

        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
    };

    this.atualiza_model = function() {
        this.model = translate(this.posicao[0], this.posicao[1], this.posicao[2]);
    };

    this.desenha = function() {
        gl.useProgram(gShaderTextura.program);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), 1);
        
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
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        gl.useProgram(gShader.program);
    };
    
    this.atualiza_posicao_orientacao = function(delta) {};
}