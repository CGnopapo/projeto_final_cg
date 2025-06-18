function Skybox() {
    /* 
        Required constants
    */
    const DIA_ID = 4;
    const NOITE_ID = 5;

    const gSkyboxVertexShaderSource = `#version 300 es

    in vec2 aPosition;
    out vec4 vPosition;

    void main() {
        vec4 pos = vec4(aPosition, 1.0, 1.0);
        vPosition = pos;
        gl_Position = pos;
        gl_Position.z = 1.0;
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
        fator = clamp(fator, 0.0, 1.1);
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

    /*
        Attributes and methods
    */
    this.program = makeProgram(gl, gSkyboxVertexShaderSource, gSkyboxFragmentShaderSource);

    this.init = function () {
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
        console.log(flatten(VERTICES));
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

    this.desenha = function () {
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        let tempo = (Date.now() / 2) % 24000;

        let viewDirectionProjectionMatrix = mult(gCtx.perspective, gCtx.view);
        let rotacao = rotateY(((tempo / 100) / 240) * 360);
        viewDirectionProjectionMatrix = mult(viewDirectionProjectionMatrix, rotacao);
        let viewDirectionProjectionInverseMatrix = inverse(viewDirectionProjectionMatrix);

        // Set the uniforms
        gl.uniformMatrix4fv(
            this.attribs.projInverse, 
            false,
            flatten(viewDirectionProjectionInverseMatrix)
        );

        // Tell the shader to use texture unit 0 for u_skybox
        gl.uniform1i(this.attribs.skyboxDia, DIA_ID);
        gl.uniform1i(this.attribs.skyboxNoite, NOITE_ID);

        let fator;
        if (tempo < 12000) {
            fator = 0;
        }
        else if (tempo < 13000) {
            fator = (tempo - 12000) / 1000;
        }
        else if (tempo < 23000) {
            fator = 1;
        }
        else {
            fator = 1 - (tempo - 23000) / 1000;
        }
        // console.log(fator, tempo);

        // gl.uniform1f(this.attribs.fatorDiaNoite, fator);
        gl.uniform1f(this.attribs.fatorDiaNoite, fator);
        gl.uniform4fv(this.attribs.corNeblina, FUNDO);

        // let our quad pass the depth test at 1.0
        gl.depthFunc(gl.LEQUAL);

        gl.drawArrays(gl.TRIANGLES, 0, VERTICES.length);
        gl.bindVertexArray(null);

        gl.useProgram(gShader.program);
    };

    this.carregaInfosFacesSkybox = function (infosFaces, id) {
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        infosFaces.forEach((faceInfo) => {
            const {target, url} = faceInfo;

            // Upload the canvas to the cubemap face.
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            // setup each face so it's immediately renderable
            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

            // Asynchronously load an image
            const image = new Image();
            image.crossOrigin = '';
            image.src = url;
            image.addEventListener('load', function() {
                // Now that the image has loaded make copy it to the texture.
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(target, level, internalFormat, format, type, image);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            });
        });

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
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