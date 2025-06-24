"use strict";
// const FUNDO = [.6, .78, .76, 1];
const FUNDO = [0.6, 0.6, 0.6, 1];

const LUZ = {
    pos: vec4(100, 100000000.0,100, 1),
    amb: vec4(0.2, 0.2, 0.2, 1.0),
    dif: vec4(0.5, 0.5, 0.5, 1.0),
    esp: vec4(1, 1, 1, 1.0),
};

const MAT = {
    amb: vec4(0.8, 0.8, 0.8, 1.0),
    dif: vec4(0.8, 0.8, 0.8, 1.0),
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
    uLuzDir: null,
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

var gSkybox;
var gObjetos = []
var gUltimoT = Date.now();

var modo_camera = 0
var gCamera_modo0 = {
    eye: vec3(-1, 0, 0),
    at : vec3(0, 0, -2),
    up : vec3(0, 1, 0),
    altura: 0.7,
    para_tras: 6.605,
    para_lado: 0,
    orientacao: vec3(0,0,1)
}

var gCamera_modo1 = {
    eye: vec3(1, 1, 1),
    at : vec3(-1, 0, 0),
    up : vec3(0, 1, 0),
    altura: 10,
    para_tras: 60,
    para_lado: -10,
    orientacao: vec3(0,0,0)
}

var gCamera_modo2 = {
    eye: vec3(-1, 0, 0),
    at : vec3(0, 0, 0),
    up : vec3(0, 1, 0),
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
let gJacolidiu = false;
let gPausado = false;
let caminhao;

var gFloresta;

var gLuzGlobal;
var gSol;
var gLua;

var farol_caminhao={
    pos1: vec4(0,-0.5,-0.65,1), // posição da frente do caminhão
    uSpot_light_direcao :vec3(-1,0,0), // Direção do spot light em World Space 
    uCor_difusao_spotlight_loc : vec4(2, 2, 0, 1.0), // Cor Difusa do spot light
    uCor_especular_spotlight_loc : vec4(2, 2, 0, 1.0), // Cor Especular do spot light
    angulo_interno : 0.1, // Ângulo interno do spot light
    angulo_externo : 3, // Ângulo externo do spot light

    pos2: vec4(0,-0.5,0.65,1),
    constante:  1.0,
    linear:    0.05,   // Quanto menor, mais longe o alcance do spot light
    quadratico: 0.01   // igual
}

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("Vixe! Não achei WebGL 2.0 aqui :-(");

    let botao_pause = document.getElementById("pause");
    botao_pause.onclick = callback_botao;
    let botao_reiniciar = document.getElementById("reiniciar");
    botao_reiniciar.onclick = callback_botao;


    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
    gl.enable(gl.DEPTH_TEST);

    gLuzGlobal = new LuzGlobal();
    
    crieShaders();
    crieShaders_textura();
    window.onkeydown = moveCamera
    gCtx.view = lookAt(gcamera_modos[modo_camera].eye,gcamera_modos[modo_camera].at,gcamera_modos[modo_camera].up)

    gSkybox = new Skybox();
    gSkybox.init();

    let carro = new Carro(
        vec3(-10, 0.6, 2.2),          // posição
        vec3(0, 0, 0),              // orientação
        vec3(-10, 0, 0),            // velocidade translacional
        vec3(0, 0, 0),              // velocidade rotacional
        vec3(1, 1, 1),              // escala
        vec4(0.5, 0.5, 0.5, 1.0),   // cor ambiente
        vec4(0.5, 0.5, 0.5, 1.0),   // cor difusa
        20                          // alpha especular
    );
    carro.init()
    carro.adiciona_ao_cenario();
    let carro2 = new Carro(
        vec3(18, 0.6, -2.2),             // posição
        vec3(0, 0, 0),              // orientação
        vec3(-10, 0, 0),           // velocidade translacional
        vec3(0, 0, 0),            // velocidade rotacional
        vec3(1, 1, 1),              // escala
        vec4(1, 0, 0, 1.0),   // cor ambiente
        vec4(1, 0, 0, 1.0),   // cor difusa
        20                          // alpha especular
    );
    carro2.init()
    carro2.adiciona_ao_cenario();


    
    const NUM_VEHICLES = 30;
    const PISTA_LARGURA = 12;

    for (let i = 0; i < NUM_VEHICLES; i++) {
        let posX = -30 - Math.random() * 970;         
        let centro_faixa = PISTA_LARGURA / 4;
        let lado = (Math.random() < 0.5) ? -1 : 1;
        let posZ = lado * centro_faixa;

        let cor_aleatoria = vec4(
            Math.random(),
            Math.random(),
            Math.random(),
            1.0
        );

        if (Math.random() < 0.7) { // Create a Car
            let posY = 0.6;
            let pos_novo = vec3(posX, posY, posZ);
            let vel_x = -8 - Math.random() * 6;
            
            let carro = new Carro(
                pos_novo,                   // posição
                vec3(0, 0, 0),              // orientação
                vec3(vel_x, 0, 0),          // velocidade translacional
                vec3(0, 0, 0),              // velocidade rotacional
                vec3(1, 1, 1),              // escala
                cor_aleatoria,              // cor ambiente
                cor_aleatoria,              // cor difusa
                80                          // alpha especular
            );
            carro.init();
            carro.adiciona_ao_cenario();
        } else { // Create a Truck
            let posY = 1;
            let pos_novo = vec3(posX, posY, posZ);
            let vel_caminhao = 8 + Math.random() * 4;
            
            let caminhao_bot = new Caminhao(
                pos_novo,                   // posicao
                vec3(0, 0, 0),              // orientacao
                vel_caminhao,               // velo_trans (escalar)
                vec3(0, 0, 0),              // vel_rotacao
                vec3(1, 1, 1),              // escala
                cor_aleatoria,              // cor ambiente
                cor_aleatoria,              // cor difusa
                80,                         // alpha especular
                null,                       // textura_painel
                null,                       // textura_porta_dir
                null                        // textura_porta_esq
            );
            caminhao_bot.init();
            caminhao_bot.adiciona_ao_cenario();
        }
    }















    let textura_painel = new Image();
    textura_painel.src = "painel.png";

    let textura_porta_dir = new Image();
    textura_porta_dir.src = "porta_direita.png";

    let textura_porta_esq = new Image();
    textura_porta_esq.src = "porta_esquerda.png";




    caminhao = new Caminhao(
        vec3(0, 1, 2.2),              // posição
        vec3(0, 0, 0),              // orientação
        10,           // velocidade translacional, caminhão sempre anda em direção a -x
        vec3(0, 0, 0),            // velocidade rotacional
        vec3(1, 1, 1),              // escala
        vec4(1, 1, 1, 1.0),   // cor ambiente
        vec4(1, 1, 1, 1.0),   // cor difusa
        20 ,                         // alpha especular
        textura_painel,
        textura_porta_dir,
        textura_porta_esq
    );


    caminhao.init();
    caminhao.adiciona_ao_cenario();
    



    let pista = new Pista(
        60, // quantidade de cubos
        12, // largura da pista
        20, // comprimento de cada cubo
        vec4(1, 1, 1, 1.0), // cor ambiente
        vec4(1, 1, 1, 1.0), // cor difusa
        100 // alpha especular
    );
    pista.init();
    pista.adiciona_ao_cenario();

    const SOL_ESCALA = 8;
    gSol = new Esfera(vec3(300, 0, 0), vec3(0, 0, 0), vec3(SOL_ESCALA, SOL_ESCALA, SOL_ESCALA), vec4(0.99, 0.94, 0.78, .3), 3);
    gSol.init();
    gSol.adiciona_ao_cenario();

    const LUA_ESCALA = 4;
    gLua = new Esfera(vec3(300, 0, 0), vec3(0, 0, 0), vec3(LUA_ESCALA, LUA_ESCALA, LUA_ESCALA), vec4(0.55, 0.73, 0.94, .3), 3);
    gLua.init();                                                                                    // 0.5, 0.7, 0.8
    gLua.adiciona_ao_cenario();

    gFloresta = new Floresta(0, 200);
    gFloresta.init();
    gFloresta.adiciona_ao_cenario();
    
    init_farol_caminhao()
    let textura_terreno = new Image();
    textura_terreno.src = "b.jpg";

    const largura_pista = 12.0;
    const largura_faixa_terreno = 300.0; 

    // Cria um gerenciador de terreno para o lado direito da pista
    let gerenciador_lado_direito = new Gerenciador_terreno(textura_terreno, 'direito', largura_pista, largura_faixa_terreno);
    gerenciador_lado_direito.init();
    gerenciador_lado_direito.adiciona_ao_cenario();

    // Cria um gerenciador de terreno para o lado esquerdo da pista
    let gerenciador_lado_esquerdo = new Gerenciador_terreno(textura_terreno, 'esquerdo', largura_pista, largura_faixa_terreno);
    gerenciador_lado_esquerdo.init();
    gerenciador_lado_esquerdo.adiciona_ao_cenario();

    render_auxiliar();
}

function atualiza_farol_caminhao(delta) {
    let orientacao = add(caminhao.orientacao, mult(delta, caminhao.vel_rotacao));
    let R = mult(rotateZ(orientacao[2]), mult(rotateY(orientacao[1]), rotateX(orientacao[0])));

    let pos_global_farol1 = add(mult(R, farol_caminhao.pos1), vec4(caminhao.posicao[0], caminhao.posicao[1], caminhao.posicao[2], 1));
    let pos_global_farol2 = add(mult(R, farol_caminhao.pos2), vec4(caminhao.posicao[0], caminhao.posicao[1], caminhao.posicao[2], 1));

    gl.uniform4fv(gShader.uSpotlight_pos1, [pos_global_farol1[0], pos_global_farol1[1], pos_global_farol1[2], 1.0])
    gl.uniform4fv(gShader.uSpotlight_pos2, [pos_global_farol2[0], pos_global_farol2[1], pos_global_farol2[2], 1.0])
    
}

function init_farol_caminhao() {

    gl.uniform3fv(gShader.uSpot_light_direcao_mundo_1, farol_caminhao.uSpot_light_direcao);
    gl.uniform3fv(gShader.uSpot_light_direcao_mundo_2, farol_caminhao.uSpot_light_direcao);
    gl.uniform4fv(gShader.uCor_difusao_spotlight, farol_caminhao.uCor_difusao_spotlight_loc);
    gl.uniform4fv(gShader.uCor_especular_spotlight, farol_caminhao.uCor_especular_spotlight_loc);
    gl.uniform1f(gShader.uCorte_interno, Math.cos(radians(farol_caminhao.angulo_interno)));
    gl.uniform1f(gShader.uCorte_externo, Math.cos(radians(farol_caminhao.angulo_externo)));

    gl.uniform1f(gShader.uConstante, farol_caminhao.constante);
    gl.uniform1f(gShader.uLinear, farol_caminhao.linear);
    gl.uniform1f(gShader.Quadratico, farol_caminhao.quadratico);
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
            if (modo_camera === 1) {
                gcamera_modos[modo_camera].orientacao[1] -=1
            }
            else {     
            gcamera_modos[modo_camera].orientacao[1] += 1
            }
            break;
        case "ArrowRight":
            if (modo_camera === 1) {
                gcamera_modos[modo_camera].orientacao[1] +=1
            }
            else { 
            gcamera_modos[modo_camera].orientacao[1] -= 1
            }
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
        case "w":
            caminhao.velo_trans = caminhao.velo_trans + 0.5
            break;
        case "x":
            caminhao.velo_trans = caminhao.velo_trans - 0.5
            break;
        case "a":
            caminhao.posicao = add(caminhao.posicao, vec3(0, 0, 0.1))
            break;
        case "d":
            caminhao.posicao = add(caminhao.posicao, vec3(0, 0, -0.1))
            break;
        case "s":
            caminhao.velo_trans  = 0;
            break;    
    }
    render(0);
}


function callback_botao(e){
    if (e.target.id === "pause"){
        if (gPausado){
            e.target.innerText = "Pausar"
        }
        else{
            e.target.innerText = "Executar"
        }
        gPausado = !gPausado;
        if (!gPausado) {
            gUltimoT = Date.now();
            render_auxiliar();
        }
    }
    if (e.target.id === "reiniciar") {
        location.reload();
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

    if (gJacolidiu){
        return
    }
    if (!gJacolidiu && verifica_colisao(caminhao, gObjetos)) {
        gJacolidiu = true;
        console.log("Colisão detectada!");
        gl.clearColor(1, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gPausado = true;
        let mensagem = document.createElement("h2");
        mensagem.innerText = " Você bateu! ";
        mensagem.style.textAlign = "center";
        document.body.prepend(mensagem);
        let botao_pause = document.getElementById("pause");
        botao_pause.disabled = true;
        return;
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gSkybox.desenha();
    atualiza_camera(delta)
    atualiza_farol_caminhao(delta);
  
    for (let i = 0; i < gObjetos.length; i++) {
        gObjetos[i].atualiza_posicao_orientacao(delta);
        gObjetos[i].atualiza_model();
        gObjetos[i].desenha();
        if (gObjetos[i] instanceof Pista) {
            gl.useProgram(gShader.program);
         }
    }
}


function atualiza_camera(delta) {

    const caminhao_orientacao = add(caminhao.orientacao, mult(delta, caminhao.vel_rotacao));
    const camera_modo = gcamera_modos[modo_camera];

    const R_caminhao = rotateZ(caminhao_orientacao[2]);
    const up_base = vec4(camera_modo.up[0], camera_modo.up[1], camera_modo.up[2], 0);
    const up_resultante = mult(R_caminhao, up_base);
    const up_resultante3 = vec3(up_resultante[0], up_resultante[1], up_resultante[2]);


    if (modo_camera === 1) {

        const at = caminhao.posicao;
        const a = vec4(camera_modo.para_tras, camera_modo.altura, camera_modo.para_lado, 0);

        const orientacao_camera = camera_modo.orientacao;
        const R_camera = mult(rotateY(orientacao_camera[1]), rotateX(orientacao_camera[0]));
        const a_rotacionado = mult(R_camera, a);
        const eye = add(at, vec3(a_rotacionado[0], a_rotacionado[1], a_rotacionado[2]));

        gCtx.eye = eye;
        gCtx.at = at;
        gCtx.view = lookAt(eye, at, up_resultante3);

    } else {

        let R = mult(rotateZ(caminhao_orientacao[2]), mult(rotateY(caminhao_orientacao[1]), rotateX(caminhao_orientacao[0])));
        let eixo_x = vec4(1, 0, 0, 0)

        let eixo_x_transformado_mundo = mult(R, eixo_x)
        let nova_direcao_translacao_mundo = mult(-1, eixo_x_transformado_mundo);
        let vetor_deslocamento = mult(delta, mult(caminhao.velo_trans, nova_direcao_translacao_mundo));
        let vetor_deslocamento3 = vec3(vetor_deslocamento[0], vetor_deslocamento[1], vetor_deslocamento[2]);
        let camera_e_caminhao_pos = vec3(caminhao.posicao[0] + camera_modo.para_tras,
            caminhao.posicao[1] + camera_modo.altura,
            caminhao.posicao[2] + camera_modo.para_lado)
        let posicao = add(camera_e_caminhao_pos, vetor_deslocamento3);

        const r = 5;
        const d = 1;
        const a = 2;

        const P = posicao;

        let eye
        let nova_direcao_translacao_mundo3 = vec3(nova_direcao_translacao_mundo[0], nova_direcao_translacao_mundo[1],
            nova_direcao_translacao_mundo[2])
        eye = add(P, mult(r + d, nova_direcao_translacao_mundo3));

        let orientacao2 = camera_modo.orientacao
        let R2 = mult(rotateZ(orientacao2[2]), mult(rotateY(orientacao2[1]), rotateX(orientacao2[0])));
        let direcao_view = normalize(nova_direcao_translacao_mundo3);
        let direcao_rotacionada4 = mult(R2, vec4(direcao_view[0], direcao_view[1], direcao_view[2], 0));
        let direcao_rotacionada3 = vec3(direcao_rotacionada4[0], direcao_rotacionada4[1], direcao_rotacionada4[2]);

        if (modo_camera === 2) {
            direcao_rotacionada3 = mult(-1, direcao_rotacionada3)
        }
        let at = add(P, mult(r + a, direcao_rotacionada3));
        
        gCtx.eye = eye;
        gCtx.at = at;
        gCtx.view = lookAt(eye, at, up_resultante3);
    }
}

function crieShaders() {
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);

    var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
    console.log(aNormal);
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

    gShader.uLuzDir = gl.getUniformLocation(gShader.program, "uLuzDir");
    gl.uniform4fv(gShader.uLuzDir, gLuzGlobal.dir());

    gShader.uCorAmb = gl.getUniformLocation(gShader.program, "uCorAmbiente");
    gShader.uCorDif = gl.getUniformLocation(gShader.program, "uCorDifusao");
    gShader.uCorEsp = gl.getUniformLocation(gShader.program, "uCorEspecular");
    gShader.uAlfaEsp = gl.getUniformLocation(gShader.program, "uAlfaEsp");



    gShader.uSpotlight_pos1 = gl.getUniformLocation(gShader.program, "uSpotlight_pos1");
    gShader.uSpot_light_direcao_mundo_1 = gl.getUniformLocation(gShader.program, "uSpot_light_direcao_mundo_1");
    gShader.uSpotlight_pos2 = gl.getUniformLocation(gShader.program, "uSpotlight_pos2");
    gShader.uSpot_light_direcao_mundo_2 = gl.getUniformLocation(gShader.program, "uSpot_light_direcao_mundo_2");

    gShader.uCor_difusao_spotlight = gl.getUniformLocation(gShader.program, "uCor_difusao_spotlight");
    gShader.uCor_especular_spotlight = gl.getUniformLocation(gShader.program, "uCor_especular_spotlight");
    gShader.uCorte_interno = gl.getUniformLocation(gShader.program, "uCorte_interno");
    gShader.uCorte_externo = gl.getUniformLocation(gShader.program, "uCorte_externo");

    gShader.uConstante = gl.getUniformLocation(gShader.program, "uConstante");
    gShader.uLinear = gl.getUniformLocation(gShader.program, "uLinear");
    gShader.Quadratico = gl.getUniformLocation(gShader.program, "Quadratico");

    gShader.uCorNeblina = gl.getUniformLocation(gShader.program, "uCorNeblina");
    gl.uniform4fv(gShader.uCorNeblina, FUNDO);
};

var gVertexShaderSrc = `#version 300 es
in  vec3 aPosition;
in  vec3 aNormal;
uniform vec3 uSpot_light_direcao_mundo_1;
uniform vec4 uSpotlight_pos1;
uniform vec3 uSpot_light_direcao_mundo_2;
uniform vec4 uSpotlight_pos2;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;
uniform vec4 uLuzDir;
out vec3 vNormal;
out vec3 vLight;
out vec3 vView;
out vec3 vSpotlight1;
out vec3 vSpotlight_direcao_view1;
out vec3 vSpotlight2;
out vec3 vSpotlight_direcao_view2;

out float vSpotlight_distancia1; // Distância do fragmento para o farol 1
out float vSpotlight_distancia2; // Distância do fragmento para o farol 2

out float visibilidade;

const float densidade = 0.01;
const float gradiente = 1.0;

void main() {
    mat4 modelView = uView * uModel;
    vec4 pos = modelView * vec4(aPosition, 1);
    gl_Position = uPerspective * pos;
    vNormal = mat3(uInverseTranspose) * aNormal;
    vLight = (uView * uLuzDir).xyz;
    vView = -(pos.xyz);

    vSpotlight1 = (uView * uSpotlight_pos1 - pos).xyz;

    vSpotlight_distancia1 = length(vSpotlight1);
    vSpotlight_direcao_view1 = normalize(mat3(uView) * uSpot_light_direcao_mundo_1);

    vSpotlight2 = (uView * uSpotlight_pos2 - pos).xyz;

    vSpotlight_distancia2 = length(vSpotlight2);
    vSpotlight_direcao_view2 = normalize(mat3(uView) * uSpot_light_direcao_mundo_2);

    float distancia = length(pos.xyz);
    visibilidade = exp(-pow(distancia * densidade, gradiente));
    visibilidade = clamp(visibilidade, 0.0, 1.0);
}
`;


var gFragmentShaderSrc = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
uniform vec4 uCorAmbiente;
uniform vec4 uCorDifusao;
uniform vec4 uCorEspecular;
uniform float uAlfaEsp;

in vec3 vSpotlight1;
in vec3 vSpotlight_direcao_view1;
in vec3 vSpotlight2;
in vec3 vSpotlight_direcao_view2;

uniform vec4 uCor_difusao_spotlight;
uniform vec4 uCor_especular_spotlight;
uniform float uCorte_interno;
uniform float uCorte_externo;

in float vSpotlight_distancia1;
in float vSpotlight_distancia2;

uniform float uConstante;
uniform float uLinear;
uniform float Quadratico;

in float visibilidade;
uniform vec4 uCorNeblina;

out vec4 corSaida;

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
    vec4 cor_point_light = difusao + especular;


    //////// Cálculo do spot light 1 com atenuação ////////
    float atenuacao1 = 1.0 / (uConstante + uLinear * vSpotlight_distancia1 + Quadratico * (vSpotlight_distancia1 * vSpotlight_distancia1));
    vec3 vSpotlight1 = normalize(vSpotlight1);
    float angulo1 = dot(-vSpotlight1, vSpotlight_direcao_view1);
    float spot_fator1 = smoothstep(uCorte_externo, uCorte_interno, angulo1);
    vec3 spot_halfv1 = normalize(vSpotlight1 + viewV);
    float kd_spot1 = max(0.0, dot(normalV, vSpotlight1));
    vec4 spot_difusao1 = kd_spot1 * uCor_difusao_spotlight;
    float ks_spot1 = pow(max(0.0, dot(normalV, spot_halfv1)), uAlfaEsp);
    vec4 spot_especular1 = vec4(0.0);
    if (kd_spot1 > 0.0) {
        spot_especular1 = ks_spot1 * uCor_especular_spotlight;
    }
    vec4 spotlight_total1 = (spot_difusao1 + spot_especular1) * spot_fator1 * atenuacao1; 

    ////////// Cálculo do spot light 2 com atenuação /////////
    float atenuacao2 = 1.0 / (uConstante + uLinear * vSpotlight_distancia2 + Quadratico * (vSpotlight_distancia2 * vSpotlight_distancia2));
    vec3 vSpotlight2 = normalize(vSpotlight2);
    float angulo2 = dot(-vSpotlight2, vSpotlight_direcao_view2);
    float spot_fator2 = smoothstep(uCorte_externo, uCorte_interno, angulo2);
    vec3 spot_halfv2 = normalize(vSpotlight2 + viewV);
    float kd_spot2 = max(0.0, dot(normalV, vSpotlight2));
    vec4 spot_difusao2 = kd_spot2 * uCor_difusao_spotlight;
    float ks_spot2 = pow(max(0.0, dot(normalV, spot_halfv2)), uAlfaEsp);
    vec4 spot_especular2 = vec4(0.0);
    if (kd_spot2 > 0.0) {
        spot_especular2 = ks_spot2 * uCor_especular_spotlight;
    }
    vec4 spotlight_total2 = (spot_difusao2 + spot_especular2) * spot_fator2 * atenuacao2; 

    corSaida = uCorAmbiente + cor_point_light + spotlight_total1 + spotlight_total2;
    // corSaida = spotlight_total1 + spotlight_total2;
    corSaida.a = 1.0;

    corSaida = mix(uCorNeblina, corSaida, visibilidade);
}
`;