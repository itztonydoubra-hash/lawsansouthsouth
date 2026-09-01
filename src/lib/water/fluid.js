/* =============================================================
   GPU fluid solver.

   WebGL2 only. RGBA16F/RG16F/R16F half-float targets are filterable
   in ES 3.0 core, which keeps the advection pass to a single shader
   with no manual-bilerp fallback. Without WebGL2 or
   EXT_color_buffer_float we report unsupported and the caller draws
   the static water instead.
   ============================================================= */

import {
  baseVertex,
  clearShader,
  splatShader,
  advectionShader,
  divergenceShader,
  curlShader,
  vorticityShader,
  pressureShader,
  gradientSubtractShader,
  displayShader,
} from "./shaders.js";

const DEFAULTS = {
  simResolution: 128,
  dyeResolution: 512,
  /* Dye decay is the single biggest lever on whether this reads as ink
     suspended in water or as a faintly uneven background. At 0.55 the
     ink halved roughly every second and vanished under the scrim; 0.18
     lets it accumulate and drift the way ink actually does. */
  densityDissipation: 0.18,
  velocityDissipation: 0.22,
  pressure: 0.8,
  pressureIterations: 20,
  curl: 26,
  splatRadius: 0.0028,
};

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "shader compile failed");
  }
  return shader;
}

function createProgram(gl, vertSource, fragSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program link failed");
  }
  // cache uniform locations by name
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const name = gl.getActiveUniform(program, i).name;
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

export function createFluid(canvas, options = {}) {
  const config = { ...DEFAULTS, ...options };

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) return { supported: false };
  if (!gl.getExtension("EXT_color_buffer_float")) return { supported: false };
  gl.getExtension("OES_texture_float_linear");

  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  // --- fullscreen quad ---
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
    gl.STATIC_DRAW
  );
  const quadIndex = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndex);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([0, 1, 2, 0, 2, 3]),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const blit = (target) => {
    if (target == null) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };

  // --- render targets ---
  function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      get write() {
        return fbo2;
      },
      swap() {
        const t = fbo1;
        fbo1 = fbo2;
        fbo2 = t;
      },
    };
  }

  // --- programs ---
  const programs = {
    clear: createProgram(gl, baseVertex, clearShader),
    splat: createProgram(gl, baseVertex, splatShader),
    advection: createProgram(gl, baseVertex, advectionShader),
    divergence: createProgram(gl, baseVertex, divergenceShader),
    curl: createProgram(gl, baseVertex, curlShader),
    vorticity: createProgram(gl, baseVertex, vorticityShader),
    pressure: createProgram(gl, baseVertex, pressureShader),
    gradient: createProgram(gl, baseVertex, gradientSubtractShader),
    display: createProgram(gl, baseVertex, displayShader),
  };

  let dye, velocity, divergenceFBO, curlFBO, pressureFBO;

  function getResolution(resolution) {
    let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspect);
    return gl.drawingBufferWidth > gl.drawingBufferHeight
      ? { width: max, height: min }
      : { width: min, height: max };
  }

  function initFramebuffers() {
    const sim = getResolution(config.simResolution);
    const dyeRes = getResolution(config.dyeResolution);
    const t = gl.HALF_FLOAT;
    const filtering = gl.LINEAR;

    dye = createDoubleFBO(dyeRes.width, dyeRes.height, gl.RGBA16F, gl.RGBA, t, filtering);
    velocity = createDoubleFBO(sim.width, sim.height, gl.RG16F, gl.RG, t, filtering);
    divergenceFBO = createFBO(sim.width, sim.height, gl.R16F, gl.RED, t, gl.NEAREST);
    curlFBO = createFBO(sim.width, sim.height, gl.R16F, gl.RED, t, gl.NEAREST);
    pressureFBO = createDoubleFBO(sim.width, sim.height, gl.R16F, gl.RED, t, gl.NEAREST);
  }

  initFramebuffers();

  const use = (p) => {
    gl.useProgram(p.program);
    return p.uniforms;
  };

  // --- simulation step ---
  function step(dt) {
    const u = { ...velocity };

    // curl
    let uni = use(programs.curl);
    gl.uniform2f(uni.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uni.uVelocity, velocity.read.attach(0));
    blit(curlFBO);

    // vorticity confinement
    uni = use(programs.vorticity);
    gl.uniform2f(uni.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uni.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uni.uCurl, curlFBO.attach(1));
    gl.uniform1f(uni.curl, config.curl);
    gl.uniform1f(uni.dt, dt);
    blit(velocity.write);
    velocity.swap();

    // divergence
    uni = use(programs.divergence);
    gl.uniform2f(uni.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uni.uVelocity, velocity.read.attach(0));
    blit(divergenceFBO);

    // decay pressure
    uni = use(programs.clear);
    gl.uniform2f(uni.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uni.uTexture, pressureFBO.read.attach(0));
    gl.uniform1f(uni.value, config.pressure);
    blit(pressureFBO.write);
    pressureFBO.swap();

    // Jacobi pressure solve
    uni = use(programs.pressure);
    gl.uniform2f(uni.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uni.uDivergence, divergenceFBO.attach(0));
    for (let i = 0; i < config.pressureIterations; i++) {
      gl.uniform1i(uni.uPressure, pressureFBO.read.attach(1));
      blit(pressureFBO.write);
      pressureFBO.swap();
    }

    // make velocity divergence-free
    uni = use(programs.gradient);
    gl.uniform2f(uni.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uni.uPressure, pressureFBO.read.attach(0));
    gl.uniform1i(uni.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    // advect velocity
    uni = use(programs.advection);
    gl.uniform2f(uni.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uni.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uni.uSource, velocity.read.attach(0));
    gl.uniform1f(uni.dt, dt);
    gl.uniform1f(uni.dissipation, config.velocityDissipation);
    blit(velocity.write);
    velocity.swap();

    // advect dye
    gl.uniform1i(uni.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uni.uSource, dye.read.attach(1));
    gl.uniform1f(uni.dissipation, config.densityDissipation);
    blit(dye.write);
    dye.swap();

    void u;
  }

  function render(intensity = 1) {
    const uni = use(programs.display);
    gl.uniform2f(uni.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(uni.uTexture, dye.read.attach(0));
    if (uni.uIntensity) gl.uniform1f(uni.uIntensity, intensity);
    blit(null);
  }

  /* x,y normalised 0..1 with y already flipped for GL.
     dx,dy velocity impulse. color is the ink added. */
  function splat(x, y, dx, dy, color, radiusScale = 1) {
    let uni = use(programs.splat);
    gl.uniform1i(uni.uTarget, velocity.read.attach(0));
    gl.uniform1f(uni.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(uni.point, x, y);
    gl.uniform3f(uni.color, dx, dy, 0);
    gl.uniform1f(uni.radius, config.splatRadius * radiusScale);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(uni.uTarget, dye.read.attach(0));
    gl.uniform3f(uni.color, color[0], color[1], color[2]);
    blit(dye.write);
    dye.swap();
  }

  function resize(width, height) {
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    initFramebuffers();
  }

  function setQuality({ simResolution, dyeResolution }) {
    if (simResolution) config.simResolution = simResolution;
    if (dyeResolution) config.dyeResolution = dyeResolution;
    initFramebuffers();
  }

  function dispose() {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  return { supported: true, step, render, splat, resize, setQuality, dispose, config };
}
