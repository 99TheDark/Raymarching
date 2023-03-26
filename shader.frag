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
https://github.com/yeataro/TD-Raymarching-System/blob/master/src/shader/glsl_Raymarching.glsl

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
#define MAX_DIST 1000.0
#define MAX_STEPS 150

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
        vec3(1.0, 10.0, 3.0),
        vec3(1.0),
        1.0
    ),
    Light(
        vec3(-4.0, 5.0, -10.0),
        vec3(1.0),
        1.0
    )
);

float sphereSDF(vec3 pos, Sphere sphere) {
    return distance(pos, sphere.pos + vec3(0.0, cos(time * 3.0) / 5.0, 0.0)) - sphere.radius * (sin(time) + 3.0) / 3.0;
}

// IDK how to do this w/ color
float k = 0.4;
float sMin(float a, float b) {
    float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
    return mix(a, b, h) - k * h * (1.0 - h);
}

vec4 minDist(vec3 pos) {
    float curMin = MAX_INT;
    vec3 color = vec3(1.0);
    for(int i = 0; i < scene.length(); i++) {
        float tempMin = min(curMin, sphereSDF(pos, scene[i]));
        if(tempMin < curMin) {
            curMin = tempMin;
            color = scene[i].color;
        }
    }
    float tempMin = min(curMin, pos.y + 2.0);
    if(tempMin < curMin) {
        curMin = tempMin;
        color = vec3(mod(floor(pos.x) + floor(pos.z), 2.0));
    }
    return vec4(curMin, color);
}

vec3 getNormal(vec3 pos) {
    float dist = minDist(pos).x;
    vec2 epsilon = vec2(EPSILON, 0.0);
    vec3 normal = dist - vec3(
        minDist(pos - epsilon.xyy).x,
        minDist(pos - epsilon.yxy).x,
        minDist(pos - epsilon.yyx).x
    );

    return normalize(normal);
}

vec3 getLight(vec3 point) {
    vec3 lightColor = vec3(0.0); // Global illumination
    for(int i = 0; i < lights.length(); i++) {
        Light light = lights[i];

        vec3 lightDir = normalize(light.pos - point);
        vec3 normal = getNormal(point);

        float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);

        lightColor += light.color * light.intensity * diffuse;
    }
    return lightColor / float(lights.length());
}

vec4 raymarch(vec3 dir) {
    float dist = 0.0;
    vec3 color = vec3(1.0);
    for(int i = 0; i < MAX_STEPS; i++) {
        vec4 minimum = minDist(dir * dist);
        dist += minimum.x;
        color = minimum.yzw;
        if(dist <= MIN_DIST) break;
        if(dist >= MAX_DIST) {
            dist = 0.0;
            color = vec3(0.45, 0.7, 0.9);
            break;
        }
    }
    return vec4(dist, color);
}

void main() {
    vec2 aspect = normalize(size.xy);
    vec3 dir = normalize(vec3(pos * aspect, 1.0));

    vec4 close = raymarch(dir);
    float d = close.x;
    vec3 shapeCol = close.yzw;

    vec3 light = getLight(dir * d);

    color = vec4(light * shapeCol, 1.0);
}
