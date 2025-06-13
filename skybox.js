function Skybox() {
    /* 
        Required constants
    */
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

    uniform samplerCube uSkybox;
    uniform mat4 uViewDirectionProjectionInverse;

    in vec4 vPosition;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
        vec4 t = uViewDirectionProjectionInverse * vPosition;
        outColor = texture(uSkybox, normalize(t.xyz / t.w));
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

    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: '/assets/skybox/px.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: '/assets/skybox/nx.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: '/assets/skybox/py.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: '/assets/skybox/ny.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: '/assets/skybox/pz.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: '/assets/skybox/nz.png',
        },
    ];

    /*
        Attributes and methods
    */
    this.program = makeProgram(gl, gSkyboxVertexShaderSource, gSkyboxFragmentShaderSource);

    this.attribs = {
        position: gl.getAttribLocation(this.program, "aPosition"),
        skybox: gl.getUniformLocation(this.program, "uSkybox"),
        projInverse: gl.getUniformLocation(this.program, "uViewDirectionProjectionInverse")
    };

    this.init = function () {
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        console.log(flatten(VERTICES));
        gl.bufferData(gl.ARRAY_BUFFER, flatten(VERTICES), gl.STATIC_DRAW);

        gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribs.position);

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        faceInfos.forEach((faceInfo) => {
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

        gl.bindVertexArray(null);
    };

    this.desenha = function () {
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        let viewDirectionProjectionMatrix = mult(gCtx.perspective, gCtx.view);
        let viewDirectionProjectionInverseMatrix = inverse(viewDirectionProjectionMatrix);

        // Set the uniforms
        gl.uniformMatrix4fv(
            this.attribs.projInverse, 
            false,
            flatten(viewDirectionProjectionInverseMatrix)
        );

        // Tell the shader to use texture unit 0 for u_skybox
        gl.uniform1i(this.attribs.skybox, 0);

        // let our quad pass the depth test at 1.0
        gl.depthFunc(gl.LEQUAL);

        gl.drawArrays(gl.TRIANGLES, 0, VERTICES.length);
        gl.bindVertexArray(null);
    };
}