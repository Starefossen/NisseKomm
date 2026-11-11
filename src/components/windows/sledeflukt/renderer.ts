/**
 * SLEDEFLUKT renderer: WebGL1, flat shading, one directional light and fog,
 * drawn to a small framebuffer (640×360, falling back to 480×270 or 320×180) and
 * blown up with nearest sampling through a palette-and-dither pass. No shadow map,
 * no noise shaders: the iPad's cost is the fill rate of the small buffer plus one
 * full-size pass whose only work is the 64-colour snap.
 */

import {
  lookAt,
  multiply,
  PALETT,
  perspective,
  STRIDE,
  type Mat4,
  type Vec3,
} from "./gl";

const VERT = `
attribute vec3 aPos; attribute vec3 aNorm; attribute vec3 aCol; attribute float aGlow;
attribute vec4 aInst;
uniform mat4 uModel; uniform mat4 uVP; uniform vec3 uLys; uniform vec3 uKamera; uniform vec2 uTaake;
varying vec3 vCol; varying float vFog;
void main(){
  vec3 p = aPos * aInst.w + aInst.xyz;
  vec4 w = uModel * vec4(p, 1.0);
  vec3 n = normalize(mat3(uModel) * aNorm);
  float lit = 0.5 + 0.5 * max(0.0, dot(n, uLys));
  vCol = mix(aCol * lit, aCol, aGlow);
  float d = distance(w.xyz, uKamera);
  vFog = clamp((d - uTaake.x) / (uTaake.y - uTaake.x), 0.0, 1.0) * (1.0 - aGlow * 0.6);
  gl_Position = uVP * w;
}`;

const FRAG = `
precision mediump float;
varying vec3 vCol; varying float vFog; uniform vec3 uDis; uniform float uGraa;
void main(){
  vec3 c = mix(vCol, vec3(0.47, 0.50, 0.56), uGraa);
  gl_FragColor = vec4(mix(c, uDis, vFog), 1.0);
}`;

const QUAD_VERT = `
attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.9999, 1.0); }`;

// Sky: vertical gradient around the horizon line, sparse stars, an aurora ribbon.
const SKY_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec3 uTopp; uniform vec3 uHorisont; uniform float uLinje; uniform float uTid; uniform float uNordlys; uniform vec2 uSize;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  float t = smoothstep(uLinje - 0.05, uLinje + 0.55, vUv.y);
  vec3 c = mix(uHorisont, uTopp, t);
  vec2 cell = floor(vUv * uSize / 2.0);
  float s = hash(cell);
  if (s > 0.993 && vUv.y > uLinje + 0.08) c += vec3(0.7) * (0.6 + 0.4 * sin(uTid * 2.0 + s * 40.0));
  float y = vUv.y - (uLinje + 0.3 + 0.07 * sin(vUv.x * 4.0 + uTid * 0.25));
  float boelge = 0.5 + 0.5 * sin(vUv.x * 7.0 + uTid * 0.35 + sin(vUv.x * 15.0 - uTid * 0.2));
  float a = exp(-pow(y / 0.07, 2.0)) * smoothstep(0.15, 0.6, boelge);
  c += vec3(0.0, 0.85, 0.5) * a * uNordlys * 0.7;
  gl_FragColor = vec4(c, 1.0);
}`;

// Snow: three layers of falling pixel flakes in the small buffer, drawn over the
// scene with no depth; a cell grid per layer, hash picks which cells hold a flake.
const SNOW_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform float uTid; uniform float uTetthet; uniform float uDrift; uniform vec2 uSize;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 px = vUv * uSize;
  float hit = 0.0;
  for (int i = 0; i < 3; i++) {
    float lag = float(i);
    float cell = 12.0 + lag * 10.0;
    vec2 p = px + vec2(uTid * uDrift * (lag + 1.0) * 12.0, uTid * (35.0 + lag * 45.0));
    vec2 c = floor(p / cell);
    if (hash(c + lag * 7.0) > uTetthet) continue;
    vec2 o = vec2(hash(c * 3.1 + 1.0), hash(c * 5.3 + 2.0)) * 0.7 + 0.15;
    vec2 d = abs(fract(p / cell) - o) * cell;
    if (max(d.x, d.y) < 0.5 + lag * 0.5) hit = 1.0;
  }
  if (hit < 0.5) discard;
  gl_FragColor = vec4(0.93, 0.95, 1.0, 1.0);
}`;

// Post: nearest sample of the small buffer, 4×4 Bayer dither in the small buffer's
// own pixels (so the dither is made of the same chunky pixels as the scene), snap to the palette.
// ponytail: the 64-entry search runs per screen pixel; if an iPad shows it, move the
// snap into a second small framebuffer and blit that.
const POST_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex; uniform sampler2D uBayer; uniform vec3 uPalett[${PALETT.length}]; uniform float uDither; uniform vec2 uSize;
void main(){
  vec3 c = texture2D(uTex, vUv).rgb;
  float b = texture2D(uBayer, floor(vUv * uSize) / 4.0).r - 0.5;
  c += b * uDither;
  vec3 best = uPalett[0]; float bd = 1e9;
  for (int i = 0; i < ${PALETT.length}; i++) {
    vec3 d = c - uPalett[i];
    float dist = dot(d * vec3(0.6, 1.0, 0.8), d);
    if (dist < bd) { bd = dist; best = uPalett[i]; }
  }
  gl_FragColor = vec4(best, 1.0);
}`;

interface Buf {
  buffer: WebGLBuffer;
  count: number;
}

export interface Kamera {
  eye: Vec3;
  target: Vec3;
  fov: number;
  /** Far plane in render units; free flight pushes it out for the horizon pass. */
  fjern?: number;
}

export interface Himmel {
  topp: Vec3;
  horisont: Vec3;
  dis: Vec3;
  nordlys: number;
  /** Fog start and end in render units. */
  tåke: [number, number];
}

export class Renderer {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private sky: WebGLProgram;
  private post: WebGLProgram;
  private snow: WebGLProgram;
  private a = { pos: 0, norm: 0, col: 0, glow: 0, inst: 0 };
  private u: Record<string, WebGLUniformLocation | null> = {};
  private us: Record<string, WebGLUniformLocation | null> = {};
  private up: Record<string, WebGLUniformLocation | null> = {};
  private usn: Record<string, WebGLUniformLocation | null> = {};
  private quad: WebGLBuffer;
  private bayer: WebGLTexture;
  private fbo: WebGLFramebuffer | null = null;
  private tex: WebGLTexture | null = null;
  private depth: WebGLRenderbuffer | null = null;
  private inst: ANGLE_instanced_arrays | null;
  private bufs = new Map<Float32Array, Buf>();
  private instBufs = new Map<Float32Array, WebGLBuffer>();
  private vp: Mat4 = new Float32Array(16);
  private kamera: Vec3 = [0, 0, 0];
  bredde = 640;
  høyde = 360;
  tapt = false;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL mangler");
    this.gl = gl;
    this.inst = gl.getExtension("ANGLE_instanced_arrays");
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.tapt = true;
    });

    this.prog = this.program(VERT, FRAG, [
      "aPos",
      "aNorm",
      "aCol",
      "aGlow",
      "aInst",
    ]);
    this.a = {
      pos: 0,
      norm: 1,
      col: 2,
      glow: 3,
      inst: 4,
    };
    for (const n of [
      "uModel",
      "uVP",
      "uLys",
      "uKamera",
      "uTaake",
      "uDis",
      "uGraa",
    ])
      this.u[n] = gl.getUniformLocation(this.prog, n);
    this.sky = this.program(QUAD_VERT, SKY_FRAG, ["aPos"]);
    for (const n of [
      "uTopp",
      "uHorisont",
      "uLinje",
      "uTid",
      "uNordlys",
      "uSize",
    ])
      this.us[n] = gl.getUniformLocation(this.sky, n);
    this.snow = this.program(QUAD_VERT, SNOW_FRAG, ["aPos"]);
    for (const n of ["uTid", "uTetthet", "uDrift", "uSize"])
      this.usn[n] = gl.getUniformLocation(this.snow, n);
    this.post = this.program(QUAD_VERT, POST_FRAG, ["aPos"]);
    for (const n of ["uTex", "uBayer", "uPalett", "uDither", "uSize"])
      this.up[n] = gl.getUniformLocation(this.post, n);

    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    // 4×4 Bayer matrix as a repeating texture.
    const b = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    this.bayer = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.bayer);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      4,
      4,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      new Uint8Array(b.map((v) => Math.round((v / 16) * 255))),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.useProgram(this.post);
    gl.uniform3fv(this.up.uPalett, new Float32Array(PALETT.flat()));
    gl.uniform1f(this.up.uDither, 1 / 24);
    gl.uniform1i(this.up.uTex, 0);
    gl.uniform1i(this.up.uBayer, 1);

    this.setOppløsning(640, 360);
  }

  private program(vs: string, fs: string, attribs: string[]) {
    const gl = this.gl;
    const p = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, vs],
      [gl.FRAGMENT_SHADER, fs],
    ] as const) {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(`Shader: ${gl.getShaderInfoLog(s)}`);
      gl.attachShader(p, s);
    }
    attribs.forEach((n, i) => gl.bindAttribLocation(p, i, n));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error(`Program: ${gl.getProgramInfoLog(p)}`);
    return p;
  }

  /** Internal resolution; the canvas itself follows its CSS size. */
  setOppløsning(w: number, h: number) {
    const gl = this.gl;
    this.bredde = w;
    this.høyde = h;
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    if (this.tex) gl.deleteTexture(this.tex);
    if (this.depth) gl.deleteRenderbuffer(this.depth);
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.tex,
      0,
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.depth,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Match the canvas backing store to its CSS size (DPR 1: the upscale is the only full-size pass). */
  resize() {
    const w = Math.max(1, Math.round(this.canvas.clientWidth));
    const h = Math.max(1, Math.round(this.canvas.clientHeight));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private buf(mesh: Float32Array): Buf {
    let b = this.bufs.get(mesh);
    if (!b) {
      const gl = this.gl;
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
      b = { buffer, count: mesh.length / STRIDE };
      this.bufs.set(mesh, b);
    }
    return b;
  }

  /** Free a mesh's GPU buffer (terrain tiles behind the sleigh). */
  slipp(mesh: Float32Array) {
    const b = this.bufs.get(mesh);
    if (b) {
      this.gl.deleteBuffer(b.buffer);
      this.bufs.delete(mesh);
    }
    const i = this.instBufs.get(mesh);
    if (i) {
      this.gl.deleteBuffer(i);
      this.instBufs.delete(mesh);
    }
  }

  begynn(k: Kamera, h: Himmel, lys: Vec3, tid: number) {
    const gl = this.gl;
    this.resize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.bredde, this.høyde);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    // Horizon line on screen from the camera pitch: where a level ray lands.
    const dy = k.target[1] - k.eye[1];
    const dxz = Math.hypot(k.target[0] - k.eye[0], k.target[2] - k.eye[2]);
    const pitch = Math.atan2(dy, dxz);
    const linje = 0.5 + Math.tan(pitch) / (2 * Math.tan(k.fov / 2));
    gl.useProgram(this.sky);
    gl.uniform3fv(this.us.uTopp, h.topp);
    gl.uniform3fv(this.us.uHorisont, h.horisont);
    gl.uniform1f(this.us.uLinje, linje);
    gl.uniform1f(this.us.uTid, tid);
    gl.uniform1f(this.us.uNordlys, h.nordlys);
    gl.uniform2f(this.us.uSize, this.bredde, this.høyde);
    this.drawQuad();

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.prog);
    const aspect = this.bredde / this.høyde;
    this.vp = multiply(
      perspective(k.fov, aspect, 0.5, k.fjern ?? 900),
      lookAt(k.eye, k.target),
    );
    this.kamera = k.eye;
    gl.uniformMatrix4fv(this.u.uVP, false, this.vp);
    gl.uniform3fv(this.u.uKamera, k.eye);
    gl.uniform3fv(this.u.uLys, lys);
    gl.uniform2f(this.u.uTaake, h.tåke[0], h.tåke[1]);
    gl.uniform3fv(this.u.uDis, h.dis);
    gl.uniform1f(this.u.uGraa, 0);
    gl.enableVertexAttribArray(this.a.pos);
    gl.enableVertexAttribArray(this.a.norm);
    gl.enableVertexAttribArray(this.a.col);
    gl.enableVertexAttribArray(this.a.glow);
  }

  private bind(mesh: Float32Array) {
    const gl = this.gl;
    const b = this.buf(mesh);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
    const s = STRIDE * 4;
    gl.vertexAttribPointer(this.a.pos, 3, gl.FLOAT, false, s, 0);
    gl.vertexAttribPointer(this.a.norm, 3, gl.FLOAT, false, s, 12);
    gl.vertexAttribPointer(this.a.col, 3, gl.FLOAT, false, s, 24);
    gl.vertexAttribPointer(this.a.glow, 1, gl.FLOAT, false, s, 36);
    return b.count;
  }

  tegn(mesh: Float32Array, model: Mat4) {
    const gl = this.gl;
    const n = this.bind(mesh);
    gl.uniformMatrix4fv(this.u.uModel, false, model);
    gl.disableVertexAttribArray(this.a.inst);
    gl.vertexAttrib4f(this.a.inst, 0, 0, 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }

  /** Many copies of one mesh at [x, y, z, scale] each; falls back to a loop without the extension. */
  tegnMange(mesh: Float32Array, instanser: Float32Array, model: Mat4) {
    const gl = this.gl;
    const n = this.bind(mesh);
    const antall = instanser.length / 4;
    if (!antall) return;
    gl.uniformMatrix4fv(this.u.uModel, false, model);
    if (!this.inst) {
      for (let i = 0; i < antall; i++) {
        gl.vertexAttrib4f(
          this.a.inst,
          instanser[i * 4],
          instanser[i * 4 + 1],
          instanser[i * 4 + 2],
          instanser[i * 4 + 3],
        );
        gl.drawArrays(gl.TRIANGLES, 0, n);
      }
      return;
    }
    let ib = this.instBufs.get(instanser);
    if (!ib) {
      ib = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, ib);
      gl.bufferData(gl.ARRAY_BUFFER, instanser, gl.STATIC_DRAW);
      this.instBufs.set(instanser, ib);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, ib);
    gl.enableVertexAttribArray(this.a.inst);
    gl.vertexAttribPointer(this.a.inst, 4, gl.FLOAT, false, 16, 0);
    this.inst.vertexAttribDivisorANGLE(this.a.inst, 1);
    this.inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, n, antall);
    this.inst.vertexAttribDivisorANGLE(this.a.inst, 0);
    gl.disableVertexAttribArray(this.a.inst);
  }

  /** Forget depth so far: the near terrain is drawn over the coarse horizon mesh under it. */
  nullstillDybde() {
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
  }

  /** Grey out what is drawn next (0 = full colour, 1 = stone grey): locked places. */
  grå(x: number) {
    this.gl.uniform1f(this.u.uGraa, x);
  }

  /** Is a world point in front of the camera and within reach? Cheap cull for per-thing draws. */
  synlig(p: Vec3, rekkevidde: number) {
    const dx = p[0] - this.kamera[0];
    const dz = p[2] - this.kamera[2];
    return dx * dx + dz * dz < rekkevidde * rekkevidde;
  }

  /** Snowfall over the finished scene; tetthet 0..1 is the share of cells with a flake, drift follows the wind. */
  snø(tetthet: number, tid: number, drift: number) {
    if (tetthet <= 0) return;
    const gl = this.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.snow);
    gl.uniform1f(this.usn.uTid, tid);
    gl.uniform1f(this.usn.uTetthet, tetthet);
    gl.uniform1f(this.usn.uDrift, drift);
    gl.uniform2f(this.usn.uSize, this.bredde, this.høyde);
    this.drawQuad();
  }

  avslutt() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.post);
    gl.uniform2f(this.up.uSize, this.bredde, this.høyde);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bayer);
    gl.activeTexture(gl.TEXTURE0);
    this.drawQuad();
  }

  private drawQuad() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const i of [1, 2, 3, 4]) gl.disableVertexAttribArray(i);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    const gl = this.gl;
    for (const b of this.bufs.values()) gl.deleteBuffer(b.buffer);
    for (const b of this.instBufs.values()) gl.deleteBuffer(b);
    this.bufs.clear();
    this.instBufs.clear();
    gl.deleteFramebuffer(this.fbo);
    gl.deleteTexture(this.tex);
    gl.deleteRenderbuffer(this.depth);
    gl.deleteTexture(this.bayer);
    gl.deleteBuffer(this.quad);
    for (const p of [this.prog, this.sky, this.snow, this.post])
      gl.deleteProgram(p);
  }
}
