"use strict";
const FUNDO = [0, 0, 0, 1];

const LUZ = {
    pos: vec4(10, 10.0,10, 1),
    amb: vec4(0.2, 0.2, 0.2, 1.0),
    dif: vec4(1.0, 1.0, 1.0, 1.0),
    esp: vec4(1.0, 1.0, 1.0, 1.0),
};

const MAT = {
    amb: vec4(0.8, 0.8, 0.8, 1.0),
    dif: vec4(1.0, 0.0, 1.0, 1.0),
    alfa: 50.0,
};


var gl;
var gCanvas;

var gShader = {
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

var gCtx = {
    view: mat4(),
    perspective: mat4(),
};

window.onload = main;

var gObjetos = []
var gUltimoT = Date.now();

var modo_camera = 0
var gCamera_modo0 = {
    eye: vec3(-1, 0, 0),
    at : vec3(0, 0, -2),
    up : vec3(0, 1, 0),
    vang: 0,
    hang: 0,
    altura: 0.7,
    para_tras: 6.605,
    para_lado: 0,
    orientacao: vec3(0,0,0)
}

var gCamera_modo1 = {
    eye: vec3(1, 1, 1),
    at : vec3(-1, 0, 0),
    up : vec3(0, 1, 0),
    vang: 0,
    hang: 0,
    altura: 10,
    para_tras: 20,
    para_lado: -10,
    orientacao: vec3(0,0,0)
}

/// Falta fazer, seria a câmera traseira
var gCamera_modo2 = {
    eye: vec3(-1, 0, 0),
    at : vec3(0, 0, -2),
    up : vec3(0, 1, 0),
    vang: 0,
    hang: 0,
    altura: 0.1,
    para_tras: 14,
    para_lado: 0,
    orientacao: vec3(0,0,0)
}

var gcamera_modos = [gCamera_modo0, gCamera_modo1, gCamera_modo2];

const CAM = {
    fovy   : 45.0,
    aspect : 1.0,
    near   : 0.1,
    far    : 500,
};

let gPausado = false;
let caminhao;

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("Vixe! Não achei WebGL 2.0 aqui :-(");

    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
    gl.enable(gl.DEPTH_TEST);

    crieShaders();
    window.onkeydown = moveCamera
    gCtx.view = lookAt(gcamera_modos[modo_camera].eye,gcamera_modos[modo_camera].at,gcamera_modos[modo_camera].up)

    let carro = new Carro(
        vec3(-10, 0, 0),              // posição
        vec3(0, 0, 0),              // orientação
        vec3(-1, 0, 0),           // velocidade translacional
        vec3(0, 10, 0),            // velocidade rotacional
        vec3(1, 1, 1),              // escala
        vec4(1, 1, 1, 1.0),   // cor ambiente
        vec4(1, 1, 1, 1.0),   // cor difusa
        20                          // alpha especular
    );
    carro.init()
    carro.adiciona_ao_cenario();
    let carro2 = new Carro(
        vec3(14, 0, 0),              // posição
        vec3(0, 0, 0),              // orientação
        vec3(-1, 0, 0),           // velocidade translacional
        vec3(0, 0, 0),            // velocidade rotacional
        vec3(1, 1, 1),              // escala
        vec4(1, 0, 0, 1.0),   // cor ambiente
        vec4(1, 0, 0, 1.0),   // cor difusa
        20                          // alpha especular
    );
    carro2.init()
    carro2.adiciona_ao_cenario();

    caminhao = new Caminhao(
        vec3(0, 0, 0),              // posição
        vec3(0, 0, 0),              // orientação
        1,           // velocidade translacional, caminhão sempre anda em direção a -x
        vec3(0, 0, 0),            // velocidade rotacional
        vec3(1, 1, 1),              // escala
        vec4(1, 1, 1, 1.0),   // cor ambiente
        vec4(1, 1, 1, 1.0),   // cor difusa
        20                          // alpha especular
    );


    caminhao.init();
    caminhao.adiciona_ao_cenario();

    render_auxiliar();
}


function moveCamera(e) {
    console.log(e.key);
    switch (e.key) {
        case "ArrowUp":
            gcamera_modos[modo_camera].orientacao[2] -= 1
            break;
        case "ArrowDown":
            gcamera_modos[modo_camera].orientacao[2] += 1
            break;
        case "ArrowLeft":
            gcamera_modos[modo_camera].orientacao[1] += 1
            break;
        case "ArrowRight":
            gcamera_modos[modo_camera].orientacao[1] -= 1
            break;
        case "0":
            modo_camera = 0
            break;
        case "1":
            modo_camera = 1
            break;
        case "2":
            modo_camera = 2
            break;
    }
}


function render_auxiliar(){
    if(!gPausado) {
        let now = Date.now();
        let delta = (now - gUltimoT) / 1000;
        gUltimoT = now;
        render(delta)
    }
    window.requestAnimationFrame(render_auxiliar);
}

function render(delta) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (let i = 0; i < gObjetos.length; i++) {
        atualiza_camera(delta)
        gObjetos[i].atualiza_posicao_orientacao(delta);
        gObjetos[i].atualiza_model();
        gObjetos[i].desenha();
    }
}


function atualiza_camera(delta) {

    let orientacao = add(caminhao.orientacao, mult(delta, caminhao.vel_rotacao));

    let R = mult(rotateZ(orientacao[2]), mult(rotateY(orientacao[1]), rotateX(orientacao[0])));
    let eixo_x = vec4(1,0,0,0)

    let eixo_x_transformado_mundo = mult(R,eixo_x)
    let nova_direcao_translacao_mundo = mult(-1,eixo_x_transformado_mundo);
    let vetor_deslocamento = mult(delta,mult(caminhao.velo_trans,nova_direcao_translacao_mundo));
    let vetor_deslocamento3 = vec3(vetor_deslocamento[0],vetor_deslocamento[1],vetor_deslocamento[2]);
    let camera_e_caminhao_pos = vec3(caminhao.posicao[0]+gcamera_modos[modo_camera].para_tras,
        caminhao.posicao[1]+gcamera_modos[modo_camera].altura,
        caminhao.posicao[2]+gcamera_modos[modo_camera].para_lado)
    let posicao = add(camera_e_caminhao_pos, vetor_deslocamento3);

    const r = 5;
    const d = 1;
    const a = 2;

    const P = posicao;

    let eye
    let nova_direcao_translacao_mundo3 = vec3(nova_direcao_translacao_mundo[0],nova_direcao_translacao_mundo[1],
        nova_direcao_translacao_mundo[2])
    eye = add(P, mult(r+d, nova_direcao_translacao_mundo3));



    let orientacao2 = gcamera_modos[modo_camera].orientacao

    let R2 = mult(rotateZ(orientacao2[2]), mult(rotateY(orientacao2[1]), rotateX(orientacao2[0])));

    let direcao_view = normalize(nova_direcao_translacao_mundo3);

    let direcao_rotacionada4 = mult(R2, vec4(direcao_view[0], direcao_view[1], direcao_view[2], 0));
    let direcao_rotacionada3 = vec3(direcao_rotacionada4[0], direcao_rotacionada4[1], direcao_rotacionada4[2]);

    if (modo_camera === 2){
        direcao_rotacionada3 = mult(-1,direcao_rotacionada3)
    }
    let at = add(P, mult(r + a, direcao_rotacionada3));

    let rotacao_z = rotateZ(orientacao[2])
    let up4 = vec4(gcamera_modos[modo_camera].up[0],gcamera_modos[modo_camera].up[1],gcamera_modos[modo_camera].up[2],0)
    let up_resultante = mult(rotacao_z,up4)
    let up_resultante3 = vec3(up_resultante[0], up_resultante[1],up_resultante[2]);

    gCtx.view = lookAt(eye, at, up_resultante3);
}

function crieShaders() {
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);

    var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gShader.uModel = gl.getUniformLocation(gShader.program, "uModel");
    gShader.uView = gl.getUniformLocation(gShader.program, "uView");
    gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");
    gShader.uInverseTranspose = gl.getUniformLocation(gShader.program, "uInverseTranspose");

    gCtx.perspective = perspective(CAM.fovy, CAM.aspect, CAM.near, CAM.far);
    gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

    gCtx.view = lookAt(gcamera_modos[modo_camera].eye, gcamera_modos[modo_camera].at, gcamera_modos[modo_camera].up);
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    gShader.uLuzPos = gl.getUniformLocation(gShader.program, "uLuzPos");
    gl.uniform4fv(gShader.uLuzPos, LUZ.pos);

    gShader.uCorAmb = gl.getUniformLocation(gShader.program, "uCorAmbiente");
    gShader.uCorDif = gl.getUniformLocation(gShader.program, "uCorDifusao");
    gShader.uCorEsp = gl.getUniformLocation(gShader.program, "uCorEspecular");
    gShader.uAlfaEsp = gl.getUniformLocation(gShader.program, "uAlfaEsp");
};

var gVertexShaderSrc = `#version 300 es
in  vec3 aPosition;
in  vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;
uniform vec4 uLuzPos;
out vec3 vNormal;
out vec3 vLight;
out vec3 vView;

void main() {
    mat4 modelView = uView * uModel;
    gl_Position = uPerspective * modelView * vec4(aPosition, 1);
    vNormal = mat3(uInverseTranspose) * aNormal;
    vec4 pos = modelView * vec4(aPosition, 1);
    vLight = (uView * uLuzPos - pos).xyz;
    vView = -(pos.xyz);
}
`;

var gFragmentShaderSrc = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
out vec4 corSaida;
uniform vec4 uCorAmbiente;
uniform vec4 uCorDifusao;
uniform vec4 uCorEspecular;
uniform float uAlfaEsp;

void main() {
    vec3 normalV = normalize(vNormal);
    vec3 lightV = normalize(vLight);
    vec3 viewV = normalize(vView);
    vec3 halfV = normalize(lightV + viewV);
    float kd = max(0.0, dot(normalV, lightV) );
    vec4 difusao = kd * uCorDifusao;
    float ks = pow( max(0.0, dot(normalV, halfV)), uAlfaEsp);
    vec4 especular = vec4(0, 0, 0, 0);
    if (kd > 0.0) {
        especular = ks * uCorEspecular;
    }
    corSaida = difusao + especular + uCorAmbiente;
    corSaida.a = 1.0;
}
`;
