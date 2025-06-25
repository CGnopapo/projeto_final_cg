function Esfera(
    translade = vec3(0, 0, 0), 
    orientacao = vec3(0, 0, 0), 
    escala = vec3(1, 1, 1),
    emissao = vec4(1, 0, 0, 0),
    ndiv = 2
) { 
    const sphereVertexShaderSource = `#version 300 es
    in vec3 aPosition;
    out vec4 vPosition;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;

    void main() {
        mat4 modelView = uView * uModel;
        gl_Position = uPerspective * modelView * vec4(aPosition, 1);
        vPosition = gl_Position;
    }
    `;

    const sphereFragmentShaderSource = `#version 300 es
    precision highp float;

    in vec4 vPosition;
    out vec4 corSaida;
    uniform vec4 uEmissao;
    uniform vec3 uCorNeblina;

    const float limiteInferior = 0.0;
    const float limiteSuperior = 0.7;
    
    void main() {
        corSaida = uEmissao;

        float fator = (vPosition.y - limiteInferior) / (limiteSuperior - limiteInferior);
        fator = clamp(fator, 0.0, 1.0);
        //fator = 1.0;
        corSaida = mix(vec4(uCorNeblina, 1.0), corSaida, fator);
    }
    `;

    const ESFERA_CANTOS = [
        vec3( 1.,  0.,  0.),
        vec3( 0.,  1.,  0.),
        vec3( 0.,  0.,  1.),
        vec3(-1.,  0.,  0.),
        vec3( 0., -1.,  0.),
        vec3( 0.,  0., -1.)
    ];

    this.pos = [];

    this.translade = translade;
    this.orientacao = orientacao;
    this.escala = escala;
    this.emissao = emissao;
    
    this.program;
    this.vao;
    this.model;

    this.init = function () {
        this.program = makeProgram(gl, sphereVertexShaderSource, sphereFragmentShaderSource);

        this.referencias = {
            aPosition: gl.getAttribLocation(this.program, "aPosition"),

            uModel: gl.getUniformLocation(this.program, "uModel"),
            uView: gl.getUniformLocation(this.program, "uView"),
            uPerspective: gl.getUniformLocation(this.program, "uPerspective"),
            uCorNeblina: gl.getUniformLocation(this.program, "uCorNeblina"),
            
            uEmissao: gl.getUniformLocation(this.program, "uEmissao"),
        };

        let triangulo = [
            [ESFERA_CANTOS[1], ESFERA_CANTOS[2], ESFERA_CANTOS[0]],
            [ESFERA_CANTOS[3], ESFERA_CANTOS[2], ESFERA_CANTOS[1]],
            [ESFERA_CANTOS[4], ESFERA_CANTOS[2], ESFERA_CANTOS[3]],
            [ESFERA_CANTOS[0], ESFERA_CANTOS[2], ESFERA_CANTOS[4]],
            [ESFERA_CANTOS[1], ESFERA_CANTOS[0], ESFERA_CANTOS[5]],
            [ESFERA_CANTOS[3], ESFERA_CANTOS[1], ESFERA_CANTOS[5]],
            [ESFERA_CANTOS[4], ESFERA_CANTOS[3], ESFERA_CANTOS[5]],
            [ESFERA_CANTOS[0], ESFERA_CANTOS[4], ESFERA_CANTOS[5]]
        ];

        for (let i = 0; i < triangulo.length; i++) {
            let a, b, c;
            [a, b, c] = triangulo[i];
            this.dividaTriangulo(a, b, c, ndiv);
        }

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        // buffer dos vértices
        var bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);

        gl.vertexAttribPointer(this.referencias.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.referencias.aPosition);

        gl.bindVertexArray(null);
    }

    this.desenha = function (delta) {
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        gl.uniformMatrix4fv(this.referencias.uModel, false, flatten(this.model));
        gl.uniformMatrix4fv(this.referencias.uView, false, flatten(gCtx.view));
        gl.uniformMatrix4fv(this.referencias.uPerspective, false, flatten(gCtx.perspective));
        gl.uniform4fv(this.referencias.uEmissao, this.emissao);
        gl.uniform3fv(this.referencias.uCorNeblina, vec3(.7, .7, .7));

        gl.drawArrays(gl.TRIANGLES, 0, this.pos.length);

        gl.bindVertexArray(null);
        gl.useProgram(null);
    };

    this.atualiza_posicao_orientacao = function (delta) {
    };

    this.adiciona_ao_cenario = function () {
        gObjetos.push(this);
    };


    this.atualiza_model = function() {
        let model = mat4();

        model = mult(model, translate(caminhao.posicao[0], caminhao.posicao[1], caminhao.posicao[2]));
        
        model = mult(model, rotateX(-this.orientacao[0]));
        model = mult(model, rotateY(-this.orientacao[1]));
        model = mult(model, rotateZ(-this.orientacao[2]));
        
        model = mult(model, translate(this.translade[0], this.translade[1], this.translade[2]));
        
        this.model = mult(model, scale(this.escala[0], this.escala[1], this.escala[2]));

    };


    this.mudaProgresso = function (fator) {
        this.orientacao[2] = -fator * 360;
    };



    this.dividaTriangulo = function (a, b, c, ndivs) {
        // Cada nível quebra um triângulo em 4 subtriângulos
        // a, b, c em ordem mão direita
        //    c
        // a  b 

        // caso base
        if (ndivs > 0) {
            let ab = mix(a, b, 0.5);
            let bc = mix(b, c, 0.5);
            let ca = mix(c, a, 0.5);

            // console.log("1", ab);
            ab = normalize(ab);
            // console.log("2", ab);
            bc = normalize(bc);
            ca = normalize(ca);

            
            this.dividaTriangulo(a, ab, ca, ndivs - 1);
            this.dividaTriangulo(b, bc, ab, ndivs - 1);
            this.dividaTriangulo(c, ca, bc, ndivs - 1);
            this.dividaTriangulo(ab, bc, ca, ndivs - 1);
        }
        
        else {
            this.insiraTriangulo(a, b, c);
        }
    };

    this.insiraTriangulo = function (a, b, c) {
        this.pos.push(a);
        this.pos.push(b);
        this.pos.push(c);
    };
}
