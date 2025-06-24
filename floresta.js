function Floresta(num_arvores, dist_max) {
    this.num_arvores = num_arvores;
    this.origens_arvores = [];
    this.tamanhos_arvores = [];
    this.arvore = new Arvore(dist_max);

    const DIST_MAX = 400;

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
        // this.origens_arvores.forEach((origem, indice, array) => {
        //     const ponto_corte = caminhao.posicao[0] + this.dist_max;
        //     if (origem[0] > ponto_corte) {
        //         array[indice][0] -= 2 * this.dist_max;
        //     }
        // });
    };

    this.atualiza_model = function () {
    };

    this.desenha = function () {
        this.origens_arvores.forEach((origem, indice) => {
            // Check if tree is behind the camera (simple culling)
            // For more accurate culling, you'd check against the view frustum
            let treeVec = subtract(origem, gCtx.eye);
            let dotProduct = dot(normalize(treeVec), subtract(gCtx.at, gCtx.eye));
            
            // If tree is in front of camera (within ~90 degrees of view direction)
            // and not too far away
            if (dotProduct > 0 && length(treeVec) < DIST_MAX) {
                this.arvore.desenha(origem, this.tamanhos_arvores[indice]);
            }
        });

        // this.origens_arvores.forEach((origem, indice) => this.arvore.desenha(origem, this.tamanhos_arvores[indice]));
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
        const min = .3;
        const max = .9;
        const x = Math.random() * (max - min) + min;

        // Example usage: randomInRange(-10, 10)
        return 1 + x;
    };
}