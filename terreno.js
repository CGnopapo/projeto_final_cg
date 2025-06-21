/**
 * Gera um bloco de terreno procedural em uma posição específica.
 * @param {vec3} posicao - A posição central (x, y, z) do bloco de terreno.
 * @param {number} qtdX - Resolução do terreno no eixo X.
 * @param {number} qtdZ - Resolução do terreno no eixo Z.
 * @param {number} tamanhoX - Largura total do bloco.
 * @param {number} tamanhoZ - Profundidade total do bloco.
 * @param {number} alturaMax - A altura máxima da variação do terreno.
 * @param {vec4} cor_ambiente - Cor de ambiente do material.
 * @param {vec4} cor_difusao - Cor difusa do material.
 * @param {number} alpha_especular - Expoente especular do material.
 * @param {Image} textura - A imagem de textura a ser usada.
 * @param {boolean} e_da_internet - Flag para carregar textura de URL.
 */
function TerrenoProcedural(posicao, qtdX, qtdZ, tamanhoX, tamanhoZ, alturaMax, cor_ambiente, cor_difusao, alpha_especular, textura, e_da_internet) {
    this.posicao = posicao;
    this.qtdX = qtdX;
    this.qtdZ = qtdZ;
    this.tamanhoX = tamanhoX;
    this.tamanhoZ = tamanhoZ;
    this.alturaMax = alturaMax;
    this.cor_ambiente = cor_ambiente;
    this.cor_difusao = cor_difusao;
    this.alpha_especular = alpha_especular;
    this.textura = textura;
    this.e_da_internet = e_da_internet;

    this.vertices = [];
    this.normais = [];
    this.indices = [];
    this.texcoords = [];

    this.vao = null;
    this.model = null;

    // Função de ruído que usa coordenadas do mundo para garantir que os blocos de terreno se conectem perfeitamente.
    this.noise = function(worldX, worldZ) {
        const scale = 50.0; // Ajuste este valor para mais ou menos detalhes no relevo.
        return Math.sin(worldX / scale) * Math.cos(worldZ / scale) * this.alturaMax;
    };

    // Gera a malha de vértices, normais, etc., para este bloco de terreno.
    this.geraMalha = function() {
        const segmentWidth = this.tamanhoX / this.qtdX;
        const segmentDepth = this.tamanhoZ / this.qtdZ;

        for (let ix = 0; ix <= this.qtdX; ++ix) {
            const localX = -this.tamanhoX / 2 + ix * segmentWidth;
            for (let iz = 0; iz <= this.qtdZ; ++iz) {
                const localZ = -this.tamanhoZ / 2 + iz * segmentDepth;

                const worldX = this.posicao[0] + localX;
                const worldZ = this.posicao[2] + localZ;

                const y = this.noise(worldX, worldZ);
                this.vertices.push(vec4(localX, y, localZ, 1.0));
                
                // Uma normal simples apontando para cima. Para um sombreamento mais preciso,
                // as normais deveriam ser calculadas com base na altura dos vértices vizinhos.
                this.normais.push(vec3(0.0, 1.0, 0.0));
                this.texcoords.push(vec2(ix / this.qtdX, iz / this.qtdZ));
            }
        }

        // Gera os índices para renderizar a malha com triângulos.
        for (let iz = 0; iz < this.qtdZ; ++iz) {
            for (let ix = 0; ix < this.qtdX; ++ix) {
                const a = iz * (this.qtdX + 1) + ix;
                const b = a + 1;
                const c = a + (this.qtdX + 1);
                const d = c + 1;
                this.indices.push(a, c, b);
                this.indices.push(b, c, d);
            }
        }
    };

    // Inicializa os buffers da GPU.
    this.init = function() {
        gl.useProgram(gShaderTextura.program);
        this.geraMalha();

        if (this.e_da_internet) {
            this.texture = configureTexturaDaURL(this.textura);
        } else {
            // O terreno original usava a unidade de textura 1.
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

    // Atualiza a matriz 'model' para posicionar o bloco no mundo.
    this.atualiza_model = function() {
        this.model = translate(this.posicao[0], this.posicao[1], this.posicao[2]);
    };

    // Desenha o bloco de terreno.
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