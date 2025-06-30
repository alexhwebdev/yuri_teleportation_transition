uniform float time;
uniform float progress;
varying vec2 vUv;
varying vec3 vPosition;
uniform sampler2D texture1;
float PI = 3.14;

void main() {
  vUv = uv;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_PointSize = 10.0 * ( 1.0 / - mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}


// void main()
// {
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
// }