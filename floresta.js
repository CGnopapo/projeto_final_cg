function Floresta(num_arvores, dist_max) {
    this.num_arvores = num_arvores;
    this.dist_max = dist_max;
    this.origens_arvores = [];
    this.tamanhos_arvores = [];
    this.arvore = new Arvore(dist_max);

    this.init = function () {
        for (let i = 0; i < this.num_arvores; i++) {
            this.origens_arvores.push(this.geraPosicaoAleatoria());
            this.tamanhos_arvores.push(this.geraTamanhoAleatorio());
        }
    };

    this.adiciona_ao_cenario = function () {
        gObjetos.push(this);
    };

    // Joga parte da pista para frente do caminhão
    this.atualiza_posicao_orientacao = function (delta) {
        this.origens_arvores.forEach((origem, indice, array) => {
            const ponto_corte = caminhao.posicao[0] + this.dist_max;
            if (origem[0] > ponto_corte) {
                array[indice][0] -= 2 * this.dist_max;
            }
        });
    };

    this.atualiza_model = function () {
    };

    this.desenha = function () {
        this.origens_arvores.forEach((origem, indice) => this.arvore.desenha(origem, this.tamanhos_arvores[indice]));
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

    this.geraTamanhoAleatorio = function () {
        const min = -.2;
        const max = .6;
        const x = Math.random() * (max - min) + min;

        // Example usage: randomInRange(-10, 10)
        return 1 + x;
    };
}