/**
 * Gera uma faixa de terreno procedural que se conecta à lateral da pista.
 * @param {vec3} posicao - Posição X do bloco de terreno. O Z é determinado pelo lado.
 * @param {string} lado - 'direito' ou 'esquerdo', para determinar de que lado da pista gerar.
 * @param {number} larguraPista - A largura total da pista.
 * @param {number} larguraFaixa - A largura da faixa de terreno a ser gerada (da pista para fora).
 * @param {number} qtdX - Resolução do terreno no eixo X.
 * @param {number} qtdZ - Resolução do terreno no eixo Z (ao longo da larguraFaixa).
 * @param {number} alturaMax - A altura máxima da variação do relevo.
 * @param {vec4} cor_ambiente - Cor de ambiente do material.
 * @param {vec4} cor_difusao - Cor difusa do material.
 * @param {number} alpha_especular - Expoente especular do material.
 * @param {Image} textura - A imagem de textura a ser usada.
 * @param {boolean} e_da_internet - Flag para carregar textura de URL.
 */
function TerrenoProcedural(posicao, lado, larguraPista, larguraFaixa, qtdX, qtdZ, alturaMax, cor_ambiente, cor_difusao, alpha_especular, textura, e_da_internet) {
    this.posicao = posicao;
    this.lado = lado;
    this.larguraPista = larguraPista;
    this.larguraFaixa = larguraFaixa;
    this.qtdX = qtdX;
    this.qtdZ = qtdZ;
    this.alturaMax = alturaMax;
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

    this.noise = function(worldX, worldZ) {
        const scale = 50.0;
        return Math.sin(worldX / scale) * Math.cos(worldZ / scale) * this.alturaMax;
    };

    this.geraMalha = function() {
        // Limpa os arrays para garantir que estamos começando do zero
        this.vertices = [];
        this.normais = [];
        this.indices = [];
        this.texcoords = [];

        // As coordenadas de textura fixas, exatamente como em cubo_textura.js
        const gTextura_st = [
            vec2(0.0, 0.0), // Canto 0
            vec2(0.0, 1.0), // Canto 1
            vec2(1.0, 1.0), // Canto 2
            vec2(1.0, 0.0)  // Canto 3
        ];

        const halfRoadW = this.larguraPista / 2;
        const segmentWidth = this.tamanhoX / this.qtdX;
        const segmentDepth = this.larguraFaixa / this.qtdZ;

        // Itera sobre cada QUAD do terreno
        for (let ix = 0; ix < this.qtdX; ++ix) {
            for (let iz = 0; iz < this.qtdZ; ++iz) {
                
                // --- 1. Calcular a posição dos 4 vértices do quad atual ---
                const verticesDoQuad = [];
                for (let i = 0; i < 2; i++) { // para ix e ix+1
                    for (let j = 0; j < 2; j++) { // para iz e iz+1
                        const current_ix = ix + i;
                        const current_iz = iz + j;

                        const localX = -this.tamanhoX / 2 + current_ix * segmentWidth;
                        const blendFactor = current_iz / this.qtdZ;
                        
                        let z;
                        if (this.lado === 'direito') {
                            z = halfRoadW + (current_iz * segmentDepth);
                        } else {
                            z = -halfRoadW - (current_iz * segmentDepth);
                        }
                        
                        const worldX = this.posicao[0] + localX;
                        let y = this.noise(worldX, z) * blendFactor;
                        
                        verticesDoQuad.push(vec4(localX, y, z, 1.0));
                    }
                }
                const v0 = verticesDoQuad[0]; // Canto (ix, iz)
                const v1 = verticesDoQuad[1]; // Canto (ix, iz+1)
                const v2 = verticesDoQuad[2]; // Canto (ix+1, iz)
                const v3 = verticesDoQuad[3]; // Canto (ix+1, iz+1)

                // --- 2. Adicionar vértices, normais e coordenadas de textura para este quad ---
                
                // Calcula uma normal única para o quad (flat shading)
                const edge1 = subtract(v1, v0);
                const edge2 = subtract(v2, v0);
                let faceNormal = normalize(cross(edge1, edge2));

                // Para o lado esquerdo, a normal precisa ser invertida
                if(this.lado === 'esquerdo') {
                    faceNormal = mult(-1, faceNormal);
                }
                
                // Adiciona os 4 vértices e seus atributos
                const baseIndex = this.vertices.length;
                this.vertices.push(v0, v1, v2, v3);
                this.normais.push(faceNormal, faceNormal, faceNormal, faceNormal);
                // Mapeia as coordenadas de gTextura_st para os vértices do quad
                this.texcoords.push(gTextura_st[0], gTextura_st[1], gTextura_st[3], gTextura_st[2]);

                // --- 3. Adicionar os índices para os 2 triângulos do quad ---
                this.indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
                this.indices.push(baseIndex + 2, baseIndex + 1, baseIndex + 3);
            }
        }
    };

    
    this.init = function() {
        gl.useProgram(gShaderTextura.program);
        this.geraMalha();

        if (this.e_da_internet) {
            this.texture = configureTexturaDaURL(this.textura);
        } else {
            this.texture = configureTextura(this.textura, 1);
        }

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
        let aPosition = gl.getAttribLocation(gShaderTextura.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normais), gl.STATIC_DRAW);
        let aNormal = gl.getAttribLocation(gShaderTextura.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        const bufTex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTex);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texcoords), gl.STATIC_DRAW);
        let aTexCoord = gl.getAttribLocation(gShaderTextura.program, "aTexCoord");
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);

        const bufIndices = gl.createBuffer();
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
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        gl.useProgram(gShader.program);
    };
    
    this.atualiza_posicao_orientacao = function(delta) { /* Gerenciado por GerenciadorTerreno */ };
}