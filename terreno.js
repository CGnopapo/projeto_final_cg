function TerrenoProcedural(qtdX, qtdZ, tamanhoX, tamanhoZ, alturaMax, cor_ambiente, cor_difusao, alpha_especular, textura, e_da_internet) {
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

    // --- NOVAS PROPRIEDADES ---
    this.columns = []; // Estrutura para gerenciar colunas de vértices
    this.xOffset = 0; // Controla a posição X da primeira coluna no mundo
    this.meshDirty = false; // Flag para saber se precisamos atualizar o buffer na GPU

    // --- DADOS PARA A GPU ---
    this.vertices = [];
    this.normais = [];
    this.indices = [];
    this.texcoords = [];

    this.vao = null;
    this.model = null;
    this.bufVertices = null; // Vamos guardar a referência do buffer

    this.noise = function(x, z) {
        const freqX = 2;
        const freqZ = 4;
        return Math.sin(x * freqX + z * freqZ) * Math.cos(x * freqZ * 0.5 + z * freqX * 0.5) * this.alturaMax;
    };

    this.geraMalha = function() {
        const segmentWidth = this.tamanhoX / this.qtdX;
        const segmentDepth = this.tamanhoZ / this.qtdZ;

        // 1. Gera a estrutura de colunas e os outros atributos
        for (let ix = 0; ix <= this.qtdX; ++ix) {
            const column = [];
            let x = -this.tamanhoX / 2 + ix * segmentWidth;

            for (let iz = 0; iz <= this.qtdZ; ++iz) {
                let z = -this.tamanhoZ / 2 + iz * segmentDepth;
                let y = this.noise(x, z);
                column.push(vec4(x, y, z, 1));

                // Normais e coordenadas de textura são geradas uma vez e não mudam.
                if (ix <= this.qtdX && iz <= this.qtdZ) {
                    this.normais.push(vec3(0, 1, 0));
                    this.texcoords.push(vec2(ix / this.qtdX, iz / this.qtdZ));
                }
            }
            this.columns.push(column);
        }
        
        // 2. Gera os índices para os triângulos (só precisa ser feito uma vez)
        for (let iz = 0; iz < this.qtdZ; ++iz) {
            for (let ix = 0; ix < this.qtdX; ++ix) {
                let a = iz * (this.qtdX + 1) + ix;
                let b = a + 1;
                let c = a + (this.qtdX + 1);
                let d = c + 1;
                this.indices.push(a, c, b);
                this.indices.push(b, c, d);
            }
        }

        // 3. "Achata" a estrutura de colunas no array de vértices pela primeira vez
        this.flattenColumns();
    };

    // Função auxiliar para converter o array 2D de colunas para o array 1D de vértices
    this.flattenColumns = function() {
        this.vertices = [];
        for(let i = 0; i < this.columns.length; i++) {
            for(let j = 0; j < this.columns[i].length; j++) {
                this.vertices.push(this.columns[i][j]);
            }
        }
    }

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

        // --- Buffer de Vértices (agora DYNAMIC) ---
        this.bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW);
        let aPosition = gl.getAttribLocation(gShaderTextura.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        // --- Outros Buffers (STATIC) ---
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

    this.adiciona_ao_cenario = function () {
        gObjetos.push(this);
    };

    // --- LÓGICA DE ATUALIZAÇÃO E RECICLAGEM CORRIGIDA ---
    this.atualiza_posicao_orientacao = function (delta) {
        /*
        const pontoReciclagem = caminhao.posicao[0] + (this.tamanhoX / 2.0);
        const xPrimeiraColuna = this.columns[0][0][0]; // Posição X da primeira coluna
        
        // Enquanto a primeira coluna estiver para trás do ponto de reciclagem...
        if (xPrimeiraColuna > pontoReciclagem) {
            
            // 1. Remove a primeira coluna da lista
            const recycledColumn = this.columns.shift();
            
            // 2. Calcula a posição X da última coluna atual
            const xUltimaColuna = this.columns[this.columns.length-1][0][0];
            const segmentWidth = this.tamanhoX / this.qtdX;
            const novaPosicaoX = xUltimaColuna - segmentWidth;

            // 3. Atualiza a posição de todos os vértices na coluna reciclada
            for(let i=0; i<recycledColumn.length; i++) {
                recycledColumn[i][0] = novaPosicaoX;
                recycledColumn[i][1] = this.noise(novaPosicaoX, recycledColumn[i][2]);
            }
            
            // 4. Adiciona a coluna reciclada no final da lista
            this.columns.push(recycledColumn);
            
            // 5. Marca que a malha precisa ser reenviada para a GPU
            this.meshDirty = true;
            
        }
        */
    };

    this.atualiza_model = function () {
        this.model = mat4(); // O terreno não se move mais, apenas seus vértices
    };

    this.desenha = function () {
        gl.useProgram(gShaderTextura.program);

        // --- SINCRONIZAÇÃO COM A GPU ---
        // Se a malha foi alterada, atualiza o buffer de vértices
        if (this.meshDirty) {
            this.flattenColumns();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW);
            this.meshDirty = false; // Reseta a flag
        }

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
}