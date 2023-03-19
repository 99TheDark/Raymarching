# version 300 es

/*

Resources:

https://www.youtube.com/watch?v=BNZtUB7yhX4
https://timcoster.com/2020/02/11/raymarching-shader-pt1-glsl/
https://www.youtube.com/c/IndigoCode
https://www.khanacademy.org/computer-programming/my-best-renderer-yet-webgl-raymarching-v300/5925979916124160
https://iquilezles.org/
https://www.pluralsight.com/blog/film-games/understanding-different-light-types
https://www.shadertoy.com/view/NlfGDs

*/

precision highp float;

uniform vec2 size;
uniform float time;

in vec2 pos;
out vec4 color;

#define MAX_INT 4294967295.0
#define PI 3.14159265358979323846
#define TAU 6.28318530717958647692
#define EPSILON 0.0001
#define MIN_DIST 0.1
#define MAX_DIST 200.0
#define MAX_STEPS 100

struct Sphere {
    vec3 pos;
    float radius;
    vec3 color;
};

struct Light {
    vec3 pos;
    vec3 color;
    float intensity;
};

const Sphere[3] scene = Sphere[](
    Sphere(
        vec3(0.0, 0.0, 6.0),
        2.0,
        vec3(1.0, 0.0, 0.0)
    ), 
    Sphere(
        vec3(4.0, 2.0, 7.0),
        1.3,
        vec3(0.0, 1.0, 0.0)
    ),
    Sphere(
        vec3(-1.5, -1.7, 5.0),
        1.0,
        vec3(0.0, 0.0, 1.0)
    )
);

const Light[2] lights = Light[](
    Light(
        vec3(5.0, 8.0, 1.0),
        vec3(0.6, 0.0, 0.8),
        1.0
    ),
    Light(
        vec3(-3.0, 4.0, 5.0),
        vec3(0.2, 0.3, 0.5),
        2.0
    )
);

float sphereSDF(vec3 pos, Sphere sphere) {
    return distance(pos, sphere.pos) - sphere.radius * (sin(time) + 3.0) / 3.0;
}

float k = 0.5;

float sMin(float a, float b) {
    float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
    return mix(a, b, h) - k * h * (1.0 - h);
}

float minDist(vec3 pos) {
    float curMin = MAX_INT;
    for(int i = 0; i < scene.length(); i++) {
        curMin = sMin(curMin, sphereSDF(pos, scene[i]));
    }
    curMin = sMin(curMin, pos.y + 2.0);
    return curMin;
}

vec3 getNormal(vec3 pos) {
    float dist = minDist(pos);
    vec2 epsilon = vec2(EPSILON, 0.0);
    vec3 normal = dist - vec3(
        minDist(pos - epsilon.xyy),
        minDist(pos - epsilon.yxy),
        minDist(pos - epsilon.yyx)
    );

    return normalize(normal);
}

vec3 getLight(vec3 point) {
    vec3 lightColor = vec3(0.0);
    for(int i = 0; i < lights.length(); i++) {
        Light light = lights[i];

        vec3 lightDir = normalize(light.pos - point);
        vec3 normal = getNormal(point);

        float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);

        lightColor += light.color * light.intensity * diffuse;
    }
    return lightColor;
}

float raymarch(vec3 dir) {
    float dist = 0.0;
    for(int i = 0; i < MAX_STEPS; i++) {
        dist += minDist(dir * dist);
        if(dist < MIN_DIST || dist > MAX_DIST) break;
    }
    return dist;
}

void main() {
    vec2 aspect = normalize(size.xy);
    vec3 dir = normalize(vec3(pos * aspect, 1.0));

    float d = raymarch(dir);

    vec3 light = getLight(dir * d);

    color = vec4(light, 1.0);
}
