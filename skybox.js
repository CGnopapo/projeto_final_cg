function Skybox() {

    const DIA_ID = 10;
    const NOITE_ID =11;

    const gSkyboxVertexShaderSource = `#version 300 es

    in vec2 aPosition;
    out vec4 vPosition;

    void main() {
        vec4 pos = vec4(aPosition, 1.0, 1.0);
        vPosition = pos;
        gl_Position = pos;
    }
    `;

    const gSkyboxFragmentShaderSource = `#version 300 es
    precision highp float;

    uniform samplerCube uSkyboxDia;
    uniform samplerCube uSkyboxNoite;
    uniform float uFatorDiaNoite;
    uniform mat4 uViewDirectionProjectionInverse;
    uniform vec4 uCorNeblina;

    in vec4 vPosition;

    out vec4 corSaida;

    const float limiteInferior = 0.0;
    const float limiteSuperior = 0.15;

    void main() {
        vec4 t = uViewDirectionProjectionInverse * vPosition;
        vec4 texDia = texture(uSkyboxDia, normalize(t.xyz / t.w));
        vec4 texNoite = texture(uSkyboxNoite, normalize(t.xyz / t.w));
        corSaida = mix(texDia, texNoite, uFatorDiaNoite);

        float fator = (t.y - limiteInferior) / (limiteSuperior - limiteInferior);
        fator = clamp(fator, 0.0, 1.0);
        corSaida = mix(uCorNeblina, corSaida, fator);
    }
    `;

    const VERTICES = [
        [-1, -1],
        [ 1, -1],
        [-1,  1],
        [-1,  1],
        [ 1, -1],
        [ 1,  1],
    ];

    this.fator_dia_noite = 0;
    this.progresso_tempo = 0;
    this.program = makeProgram(gl, gSkyboxVertexShaderSource, gSkyboxFragmentShaderSource);

    this.init = function () {
        this.orientacao = 0;

        this.attribs = {
            position: gl.getAttribLocation(this.program, "aPosition"),
            skyboxDia: gl.getUniformLocation(this.program, "uSkyboxDia"),
            skyboxNoite: gl.getUniformLocation(this.program, "uSkyboxNoite"),
            fatorDiaNoite: gl.getUniformLocation(this.program, "uFatorDiaNoite"),
            projInverse: gl.getUniformLocation(this.program, "uViewDirectionProjectionInverse"),
            corNeblina: gl.getUniformLocation(this.program, "uCorNeblina")
        };

        gl.useProgram(this.program);
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(VERTICES), gl.STATIC_DRAW);

        gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribs.position);

        let diaInfos = this.geraInfosFacesSkybox('skybox_day');
        this.carregaInfosFacesSkybox(diaInfos, DIA_ID);

        let noiteInfos = this.geraInfosFacesSkybox('skybox_night');
        this.carregaInfosFacesSkybox(noiteInfos, NOITE_ID);

        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
    };

    this.atualiza = function (delta) {
        const FATOR_PASSAGEM_TEMPO = 0.03;
        this.progresso_tempo += FATOR_PASSAGEM_TEMPO * delta;
        if (this.progresso_tempo > 1) {
            this.progresso_tempo = 0;
        }
    };

    this.desenha = function () {
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        const DURACAO_DIA = 48000;
        const DURACAO_TRANSICAO = 2000;

        let view = gCtx.view;
        view[0][3] = 0;
        view[1][3] = 0;
        view[2][3] = 0;
        let viewDirectionProjectionMatrix = mult(gCtx.perspective, view);
        this.orientacao += .01;
        let rotacao = rotateY(this.orientacao);
        viewDirectionProjectionMatrix = mult(viewDirectionProjectionMatrix, rotacao);
        let viewDirectionProjectionInverseMatrix = inverse(viewDirectionProjectionMatrix);

        gl.uniformMatrix4fv(
            this.attribs.projInverse, 
            false,
            flatten(viewDirectionProjectionInverseMatrix)
        );
      
        gl.uniform1i(this.attribs.skyboxDia, DIA_ID);
        gl.uniform1i(this.attribs.skyboxNoite, NOITE_ID);

        const LIMITE_DIA = .5 - DURACAO_TRANSICAO / DURACAO_DIA;
        const LIMITE_NOITE = 1 - DURACAO_TRANSICAO / DURACAO_DIA;
        if (this.progresso_tempo < LIMITE_DIA) {
            this.fator_dia_noite = 0;
        }
        else if (this.progresso_tempo < .5) {
            this.fator_dia_noite = (this.progresso_tempo - LIMITE_DIA) / (DURACAO_TRANSICAO / DURACAO_DIA);
        }
        else if (this.progresso_tempo < LIMITE_NOITE) {
            this.fator_dia_noite = 1;
        }
        else {
            this.fator_dia_noite = 1 - (this.progresso_tempo - LIMITE_NOITE) / (DURACAO_TRANSICAO / DURACAO_DIA);
        }

        gl.uniform1f(this.attribs.fatorDiaNoite, this.fator_dia_noite);
        gl.uniform4fv(this.attribs.corNeblina, FUNDO);

        gl.depthFunc(gl.LEQUAL);

        gl.drawArrays(gl.TRIANGLES, 0, VERTICES.length);
        gl.bindVertexArray(null);

        gSol.mudaProgresso(this.progresso_tempo);
        let progresso_atrasado = this.progresso_tempo < .5 ? this.progresso_tempo + .5 : this.progresso_tempo - .5;
        gLua.mudaProgresso(progresso_atrasado);

        gLuzGlobal.mistura(this.fator_dia_noite);
        let offset_intervalo = (DURACAO_TRANSICAO / DURACAO_DIA) / 2;
        let progresso_luz = this.progresso_tempo < .5 - offset_intervalo ? this.progresso_tempo + .5 - offset_intervalo : this.progresso_tempo - .5 + offset_intervalo
        gLuzGlobal.mudaProgresso(progresso_luz);
        gLuzGlobal.atualizaUniformesDo(gShader.program);
        gLuzGlobal.atualizaUniformesDo(gShaderTextura.program);

        gl.useProgram(gShader.program);
    };

    this.carregaInfosFacesSkybox = function (infosFaces, id) {
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        let facesCarregadas = 0; // 1. Adiciona um contador

        infosFaces.forEach((faceInfo) => {
            const {target, url} = faceInfo;

            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            // Define a textura com um placeholder (pixel azul) enquanto a imagem carrega
            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

            const image = new Image();
            image.crossOrigin = '';
            image.src = url;
            image.addEventListener('load', function() {
                // Quando a imagem carregar, a envia para a face correta da textura
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(target, level, internalFormat, format, type, image);

                facesCarregadas++; // 2. Incrementa o contador
                if (facesCarregadas === 6) {
                    // 3. Quando todas as 6 faces carregarem, gera o mipmap e configura os parâmetros
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                }
            });
        });
        // 4. Remove as chamadas que estavam aqui, pois agora são feitas dentro do 'if'
    };

    this.geraInfosFacesSkybox = function (diretorio) {
        return [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: `assets/${diretorio}/px.png`,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: `assets/${diretorio}/nx.png`,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: `assets/${diretorio}/py.png`,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: `assets/${diretorio}/ny.png`,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: `assets/${diretorio}/pz.png`,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: `assets/${diretorio}/nz.png`,
            },
        ];
    };
}