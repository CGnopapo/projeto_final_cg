function Floresta(num_arvores, dist_max) {
    this.num_arvores = num_arvores;
    this.dist_max = dist_max;
    this.arvores = [];

    this.init = function () {
        for (let i = 0; i < this.num_arvores; i++) {
            let arvore = new Arvore(
                this.geraPosicaoAleatoria(),
                // Aqui deve ser aleatório
                1,
                this.dist_max
            );
            arvore.init();
            this.arvores.push(arvore);
        }
    };
    this.adiciona_ao_cenario = function () {
        gObjetos.push(this);
    };

    // Joga parte da pista para frente do caminhão
    this.atualiza_posicao_orientacao = function (delta) {
        this.arvores.forEach(parte => parte.atualiza_posicao_orientacao());
    };

    this.atualiza_model = function () {
        this.arvores.forEach(parte => parte.atualiza_model());
    };

    this.desenha = function () {
        this.arvores.forEach(parte => parte.desenha());
    };

    // Alguns auxiliares
    this.geraPosicaoAleatoria = function () {
        const min = -this.dist_max;
        const max = this.dist_max;
        const x = Math.random() * (max - min) + min;
        const z = Math.random() * (max - min) + min;

        // Example usage: randomInRange(-10, 10)
        return vec3(x, 0, z);
    };
}