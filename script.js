Promise.all([
    fetch("shader.vert"),
    fetch("shader.frag")
]).then(files => Promise.all(
    files.map(file => file.text())
).then(text => {
    main(text[0], text[1]);
}));

var main = function(vertexSource, fragmentSource) {
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");

    const fps = document.getElementById("fps");

    [canvas.width, canvas.height] = [canvas.style.width, canvas.style.height] = [innerWidth, innerHeight];

    if(!gl) throw "Your browser does not support WebGL.";

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexSource);
    gl.shaderSource(fragmentShader, fragmentSource);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw "Error compiling vertex shader.\n\n" + gl.getShaderInfoLog(vertexShader);
    }
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw "Error compiling fragment shader.\n\n" + gl.getShaderInfoLog(fragmentShader);
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw "Error linking program.\n\n" + gl.getProgramInfoLog(program);
    }

    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        throw "Error validating program.\n\n" + gl.getProgramInfoLog(program);
    }

    const fs = Float32Array.BYTES_PER_ELEMENT;

    const tris = new Float32Array([
        -1, 1,
        1, 1,
        -1, -1,
        1, -1,
        1, 1,
        -1, -1
    ]);

    const triBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tris, gl.STATIC_DRAW);

    const posAttribLocation = gl.getAttribLocation(program, "vertPos");
    gl.vertexAttribPointer(posAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * fs, 0);
    gl.enableVertexAttribArray(posAttribLocation);

    gl.useProgram(program);

    const sizeUniformLocation = gl.getUniformLocation(program, "size");
    gl.uniform2f(sizeUniformLocation, canvas.width, canvas.height);

    const timeUniformLocation = gl.getUniformLocation(program, "time");

    gl.viewport(0, 0, canvas.width, canvas.height);

    let last = performance.now();
    let time = 0;
    let timeBuffer = [];
    let timeBufferLength = 200;
    const draw = function() {
        let now = performance.now();

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let dt = now - last;
        time += dt;

        timeBuffer.push(dt);
        if(timeBuffer.length > timeBufferLength) timeBuffer.shift();

        gl.uniform1f(timeUniformLocation, time / 1000);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        let avg = timeBuffer.reduce((delta, total) => total + delta, 0) / timeBufferLength;
        fps.innerText = Math.floor(1000 / avg);

        last = performance.now();
        
        requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
};
