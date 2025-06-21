const CUBO_CANTOS_textura = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var gTextura_st = [
    vec2(0.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0)
];

var gShaderTextura = {
    program: null,
    uModel: null,
    uView: null,
    uPerspective: null,
    uInverseTranspose: null,
    uLuzPos: null,
    uCorAmb: null,
    uCorDif: null,
    uCorEsp: null,
    uAlfaEsp: null,
};
var gVertexShaderSrc_textura = `#version 300 es

in  vec3 aPosition;
in  vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;

uniform vec4 uLuzPos;

out vec3 vNormal;
out vec3 vLight;
out vec3 vView;
out vec2 vTexCoord;

void main() {
    mat4 modelView = uView * uModel;
    gl_Position = uPerspective * modelView * vec4(aPosition, 1);

    // orienta as normais como vistas pela câmera
    vNormal = mat3(uInverseTranspose) * aNormal;
    vec4 pos = modelView * vec4(aPosition, 1);

    vLight = (uView * uLuzPos - pos).xyz;
    vView = -(pos.xyz);
    vTexCoord = aTexCoord; 
}
`;

var gFragmentShaderSrc_textura = `#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
in vec2 vTexCoord;

out vec4 corSaida;

// cor = produto luz * material
uniform vec4 uCorAmbiente;
uniform vec4 uCorDifusao;
uniform vec4 uCorEspecular;
uniform float uAlfaEsp;

uniform sampler2D uTextureMap;

void main() {
    vec3 normalV = normalize(vNormal);
    vec3 lightV = normalize(vLight);
    vec3 viewV = normalize(vView);
    vec3 halfV = normalize(lightV + viewV);

    // difusao
    float kd = max(0.0, dot(normalV, lightV) );
    vec4 difusao = kd * uCorDifusao;

    // especular
    float ks = pow( max(0.0, dot(normalV, halfV)), uAlfaEsp);
    vec4 especular = vec4(0, 0, 0, 0); // parte não iluminada
    if (kd > 0.0) {  // parte iluminada
        especular = ks * uCorEspecular;
    }
    corSaida = difusao + especular + uCorAmbiente;
    corSaida = corSaida * texture(uTextureMap, vTexCoord);
    corSaida.a = 1.0;
}
`;
function crieShaders_textura() {
    gShaderTextura.program = makeProgram(gl, gVertexShaderSrc_textura, gFragmentShaderSrc_textura);
    gl.useProgram(gShaderTextura.program);
    var aNormal = gl.getAttribLocation(gShaderTextura.program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    var aPosition = gl.getAttribLocation(gShaderTextura.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // resolve os uniforms
    gShaderTextura.uModel = gl.getUniformLocation(gShaderTextura.program, "uModel");
    gShaderTextura.uView = gl.getUniformLocation(gShaderTextura.program, "uView");
    gShaderTextura.uPerspective = gl.getUniformLocation(gShaderTextura.program, "uPerspective");
    gShaderTextura.uInverseTranspose = gl.getUniformLocation(gShaderTextura.program, "uInverseTranspose");

    // calcula a matriz de transformação perpectiva (fovy, aspect, near, far)
    // que é feita apenas 1 vez
    gCtx.perspective = perspective(CAM.fovy, CAM.aspect, CAM.near, CAM.far);
    gl.uniformMatrix4fv(gShaderTextura.uPerspective, false, flatten(gCtx.perspective));

    gCtx.view = lookAt(
    gcamera_modos[modo_camera].eye,
    gcamera_modos[modo_camera].at,
    gcamera_modos[modo_camera].up
    );
    gl.uniformMatrix4fv(gShaderTextura.uView, false, flatten(gCtx.view));

    // parametros para iluminação
    gShaderTextura.uLuzPos = gl.getUniformLocation(gShaderTextura.program, "uLuzPos");
    gl.uniform4fv(gShaderTextura.uLuzPos, LUZ.pos);

    // fragment shader
    gShaderTextura.uCorAmb = gl.getUniformLocation(gShaderTextura.program, "uCorAmbiente");
    gShaderTextura.uCorDif = gl.getUniformLocation(gShaderTextura.program, "uCorDifusao");
    gShaderTextura.uCorEsp = gl.getUniformLocation(gShaderTextura.program, "uCorEspecular");
    gShaderTextura.uAlfaEsp = gl.getUniformLocation(gShaderTextura.program, "uAlfaEsp");
    gl.useProgram(gShader.program);
    }


function Cubo_textura(posicao,orientacao,velo_trans, vel_rotacao, escala, cor_ambiente,cor_difusao,alpha_especular, textura, e_da_internet) {
    this.e_da_internet = e_da_internet;
    this.textura = textura;
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
    this.textura_st = []
    this.vao = null;
    this.model = null;

    this.init = function () {
        gl.useProgram(gShaderTextura.program);
        // Gera as posições e normais
        quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 1, 0, 3, 2);
        quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 2, 3, 7, 6);
        quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 4,0,3,7);
        // quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 6, 5, 1, 2);
        quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 1, 2, 6, 5);
        quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 4, 5, 6, 7);
        quad_textura(this.pos, this.nor, this.textura_st, CUBO_CANTOS_textura, 5, 4, 0, 1);

        // Configura textura
        if (e_da_internet){
            this.texture = configureTexturaDaURL(this.textura);
        }
        else {
            this.texture = configureTextura(this.textura,0);
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

        //// Textura de fato
        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), 0);

        // Desvincula o VAO
        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
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
        gl.useProgram(gShaderTextura.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(gShaderTextura.program, "uTextureMap"), 0);
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
        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);
        gl.bindVertexArray(null);
        gl.useProgram(gShader.program);
    };
}


function quad_textura(pos, nor,textura_st, vert, a, b, c, d) {
    var t1 = subtract(vert[b], vert[a]);
    var t2 = subtract(vert[c], vert[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    pos.push(vert[a]);
    nor.push(normal);
    textura_st.push(gTextura_st[0])

    pos.push(vert[b]);
    nor.push(normal);
    textura_st.push(gTextura_st[1]);

    pos.push(vert[c]);
    nor.push(normal);
    textura_st.push(gTextura_st[2]);

    pos.push(vert[a]);
    nor.push(normal);
    textura_st.push(gTextura_st[0])

    pos.push(vert[c]);
    nor.push(normal);
    textura_st.push(gTextura_st[2]);

    pos.push(vert[d]);
    nor.push(normal);
    textura_st.push(gTextura_st[3]);
};

function configureTextura(img, unidade) {
    // unidade: 0 para TEXTURE0, 1 para TEXTURE1, etc.
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + (unidade || 0));
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    return texture; // retorne o objeto de textura se quiser guardar para usar depois
}

function configureTexturaDaURL(url) {
    // cria a textura
    var texture = gl.createTexture();
    // seleciona a unidade TEXTURE0
    gl.activeTexture(gl.TEXTURE0);
    // ativa a textura
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Carrega uma textura de um pixel 1x1 vermelho, temporariamente
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 0, 255]));

    // Carraga a imagem da URL:
    // veja https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image
    var img = new Image(); // cria um bitmap
    img.src = url;
    img.crossOrigin = "anonymous";
    // espera carregar = evento "load"
    img.addEventListener('load', function () {
            console.log("Carregou imagem", img.width, img.height);
            // depois de carregar, copiar para a textura
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.width, img.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            // experimente usar outros filtros removendo o comentário da linha abaixo.
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
    );
    return img;
};
