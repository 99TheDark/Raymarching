# version 300 es

precision highp float;

in vec2 vertPos;
out vec2 pos;

void main() {
    pos = vertPos;
    gl_Position = vec4(vertPos, 0.0, 1.0);
}