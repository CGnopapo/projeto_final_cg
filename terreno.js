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
        const halfRoadW = this.larguraPista / 2;
        const segmentWidth = this.tamanhoX / this.qtdX;
        const segmentDepth = this.larguraFaixa / this.qtdZ;

        // --- 1. Gerar Vértices ---
        for (let ix = 0; ix <= this.qtdX; ++ix) {
            const localX = -this.tamanhoX / 2 + ix * segmentWidth;
            for (let iz = 0; iz <= this.qtdZ; ++iz) {
                const blendFactor = iz / this.qtdZ;
                let z;
                if (this.lado === 'direito') {
                    z = halfRoadW + (iz * segmentDepth);
                } else {
                    z = -halfRoadW - (iz * segmentDepth);
                }
                const worldX = this.posicao[0] + localX;
                let y = this.noise(worldX, z);
                y *= blendFactor;
                this.vertices.push(vec4(localX, y, z, 1.0));
                this.texcoords.push(vec2(ix / this.qtdX, iz / this.qtdZ));
            }
        }
        
        // --- 2. Gerar Índices (COM CORREÇÃO DE WINDING ORDER) ---
        for (let ix = 0; ix < this.qtdX; ++ix) {
            for (let iz = 0; iz < this.qtdZ; ++iz) {
                const i_tl = ix * (this.qtdZ + 1) + iz;
                const i_tr = (ix + 1) * (this.qtdZ + 1) + iz;
                const i_bl = i_tl + 1;
                const i_br = i_tr + 1;
                
                if (this.lado === 'direito') {
                    // Ordem que resulta em normal para cima quando Z aumenta.
                    this.indices.push(i_tl, i_bl, i_tr);
                    this.indices.push(i_tr, i_bl, i_br);
                } else { // 'esquerdo'
                    // Ordem invertida para resultar em normal para cima quando Z diminui.
                    this.indices.push(i_tl, i_tr, i_bl);
                    this.indices.push(i_bl, i_tr, i_br);
                }
            }
        }

        // --- 3. Calcular Normais ---
        this.normais = new Array(this.vertices.length).fill(vec3(0,0,0));
        for (let i = 0; i < this.indices.length; i += 3) {
            const i0 = this.indices[i], i1 = this.indices[i+1], i2 = this.indices[i+2];
            const v0 = this.vertices[i0], v1 = this.vertices[i1], v2 = this.vertices[i2];
            
            const edge1 = subtract(v1, v0);
            const edge2 = subtract(v2, v0);
            const faceNormal = cross(edge1, edge2);
            
            this.normais[i0] = add(this.normais[i0], faceNormal);
            this.normais[i1] = add(this.normais[i1], faceNormal);
            this.normais[i2] = add(this.normais[i2], faceNormal);
        }
        for (let i = 0; i < this.normais.length; i++) this.normais[i] = normalize(this.normais[i]);
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