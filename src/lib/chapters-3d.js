/* Lightweight Three.js scene for the Chapters tab — the one 3D scene
   on the site (design.md §7). A low-poly extruded model of the six
   states, lit, tilting gently toward the cursor like a physical model
   on a table. Cursor-driven rotation only. Clicking a state brings its
   card forward — it does not reveal anything previously hidden. */

// Convert an SVG path's absolute L/M commands into 2D points.
// Our map paths use only M and L with absolute coords + Z.
function pathToPoints(d) {
  const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const pts = [];
  for (let i = 0; i < nums.length; i += 2) {
    pts.push([nums[i], nums[i + 1]]);
  }
  return pts;
}

export function buildMapScene(THREE, stage, states, onPick) {
  const w = stage.clientWidth || 600;
  const h = stage.clientHeight || 450;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 2000);
  camera.position.set(0, 0, 900);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  stage.appendChild(renderer.domElement);

  // Lighting — reads as a lit physical model.
  scene.add(new THREE.AmbientLight(0x88a99a, 0.65));
  const key = new THREE.DirectionalLight(0xffe9b0, 1.1);
  key.position.set(-300, 400, 600);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9a227, 0.5);
  rim.position.set(400, -200, 200);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  // Colors from the token palette.
  const bench = new THREE.Color(0x1c332a);
  const benchLit = new THREE.Color(0x2a4c3e);
  const brass = new THREE.Color(0xc9a227);

  const meshes = [];
  const VIEW_W = 1000;
  const VIEW_H = 760;

  states.forEach((s, idx) => {
    const pts = pathToPoints(s.path);
    const shape = new THREE.Shape();
    pts.forEach(([x, y], i) => {
      // center + flip Y (SVG y-down → 3D y-up)
      const px = x - VIEW_W / 2;
      const py = -(y - VIEW_H / 2);
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    });

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 26,
      bevelEnabled: true,
      bevelThickness: 4,
      bevelSize: 4,
      bevelSegments: 1,
    });
    const mat = new THREE.MeshStandardMaterial({
      color: bench.clone(),
      roughness: 0.72,
      metalness: 0.12,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { id: s.id, base: 0, target: 0 };
    group.add(mesh);
    meshes.push(mesh);

    // Brass edge outline
    const edges = new THREE.EdgesGeometry(geo, 25);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: brass, transparent: true, opacity: 0.55 })
    );
    mesh.add(line);
  });

  // Fit the group to the frame.
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);
  const scale = 1.15;
  group.scale.setScalar(scale);

  // Cursor-driven tilt + custom brass ring cursor.
  const cursor = document.createElement("div");
  cursor.className = "map-cursor";
  document.body.appendChild(cursor);

  let targetRX = -0.35;
  let targetRY = 0;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  const onMove = (e) => {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width; // 0..1
    const ny = (e.clientY - r.top) / r.height;
    targetRY = (nx - 0.5) * 0.7;
    targetRX = -0.35 + (ny - 0.5) * -0.5;

    pointer.x = nx * 2 - 1;
    pointer.y = -(ny * 2 - 1);

    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    cursor.style.opacity = "1";

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    const first = hits.length ? hits[0].object : null;
    if (first !== hovered) {
      if (hovered) hovered.userData.target = 0;
      hovered = first;
      if (hovered) hovered.userData.target = 16;
      stage.style.cursor = hovered ? "none" : "none";
    }
  };
  const onLeave = () => {
    cursor.style.opacity = "0";
    targetRX = -0.35;
    targetRY = 0;
    if (hovered) hovered.userData.target = 0;
    hovered = null;
  };
  const onClick = () => {
    if (hovered) onPick(hovered.userData.id);
  };

  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerleave", onLeave);
  stage.addEventListener("click", onClick);

  // resize
  const ro = new ResizeObserver(() => {
    const nw = stage.clientWidth;
    const nh = stage.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });
  ro.observe(stage);

  let raf;
  const tick = () => {
    group.rotation.x += (targetRX - group.rotation.x) * 0.08;
    group.rotation.y += (targetRY - group.rotation.y) * 0.08;
    meshes.forEach((m) => {
      m.userData.base += (m.userData.target - m.userData.base) * 0.15;
      m.position.z = m.userData.base;
      m.material.color.lerpColors(
        bench,
        benchLit,
        Math.min(1, m.userData.base / 16)
      );
    });
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  // Cleanup when the stage leaves the DOM (tab switch).
  const mo = new MutationObserver(() => {
    if (!document.body.contains(stage)) {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      cursor.remove();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
