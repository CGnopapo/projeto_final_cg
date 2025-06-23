function LuzGlobal() {
    this.progresso = 0.5;

    const SOL_ID = 0;
    const LUA_ID = 1;
    const SOL_E_LUA = [
        {
            amb: vec4(0.5, 0.5, 0.6, 1.0),
            dif: vec4(0.8, 0.6, 0.6, 1.0),
            esp: vec4(1.0, 0.9, 0.7, 0.0),
        },
        {
            amb: vec4(0.05, 0.03, 0.1, 1.0),
            dif: vec4(0.2, 0.2, 0.2, 1.0),
            esp: vec4(0.5, 0.7, 0.8, 0.0),
        }
    ];

    this.luz ={
        amb: vec4(0.0, 0.0, 0.0, 1.0),
        dif: vec4(0.0, 0.0, 0.0, 1.0),
        esp: vec4(0.0, 0.0, 0.0, 0.0),
    };

    this.mudaProgresso = function (progresso) {
        this.progresso = progresso;
    };

    this.dir = function () {
        const DIRECAO_ORIGINAL = vec4(1.0, 0.0, 0.0, 0.0);

        let angulo = this.progresso * 180;
        let dir = mult(rotateZ(angulo), DIRECAO_ORIGINAL);
        return dir;
    };


    this.amb = function () {
        return this.luz.amb;
    };

    this.dif = function () {
        return this.luz.dif;
    };

    this.esp = function () {
        return this.luz.esp;
    };


    this.mistura = function (fator) {
        if (fator <= .5) {
            this.luz.amb = mix(SOL_E_LUA[SOL_ID].amb, vec4(0, 0, 0, 0), fator * 2); 
            this.luz.dif = mix(SOL_E_LUA[SOL_ID].dif, vec4(0, 0, 0, 0), fator * 2); 
            this.luz.esp = mix(SOL_E_LUA[SOL_ID].esp, vec4(0, 0, 0, 0), fator * 2); 
        }
        else {
            this.luz.amb = mix(vec4(0, 0, 0, 0), SOL_E_LUA[LUA_ID].amb, (fator - .5) * 2); 
            this.luz.dif = mix(vec4(0, 0, 0, 0), SOL_E_LUA[LUA_ID].dif, (fator - .5) * 2); 
            this.luz.esp = mix(vec4(0, 0, 0, 0), SOL_E_LUA[LUA_ID].esp, (fator - .5) * 2); 
        }
    };

    this.atualizaUniformesDo = function (programa) {
        gl.useProgram(programa);
        let uLuzDir = gl.getUniformLocation(programa, "uLuzDir");
        gl.uniform4fv(uLuzDir, gLuzGlobal.dir());
        gl.useProgram(null);
    };
}