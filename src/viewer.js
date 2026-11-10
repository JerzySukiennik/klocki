// Klocki: on-demand three.js stage that draws real LDraw part geometry, as single parts or as a stepped model.

import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/LDrawLoader.js';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const PART_DIR = new THREE.Vector3(0.62, 0.52, 0.59).normalize();
const MODEL_DIR = new THREE.Vector3(0.56, 0.36, 0.75).normalize();
const SHEET_DIRS = [
  new THREE.Vector3(0, 0.1, 1).normalize(),
  new THREE.Vector3(0.6, 0.32, 0.73).normalize(),
  new THREE.Vector3(1, 0.1, 0.02).normalize(),
  new THREE.Vector3(-0.55, 0.3, -0.78).normalize(),
];
const DISTANCE = 2000;
const rad = (degrees) => ((degrees || 0) * Math.PI) / 180;

export async function createViewer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const makeScene = () => {
    const scene = new THREE.Scene();
    scene.environment = environment;
    scene.environmentIntensity = 0.6;
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(0.4, 1, 0.7);
    scene.add(sun);
    const root = new THREE.Group();
    root.rotation.x = Math.PI;
    scene.add(root);
    return { scene, root };
  };

  const main = makeScene();
  const side = makeScene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, DISTANCE * 3);
  const sideCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, DISTANCE * 3);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.9;

  const view = { radius: 40, margin: 1.5, real: false, pxPerLdu: 2, dir: PART_DIR };
  const ghost = { color: new THREE.Color('#ffffff'), amount: 0.72, cache: new Map() };
  const loader = new LDrawLoader();
  const templates = new Map();
  const thumbs = new Map();
  let chain = Promise.resolve();
  let packText = null;
  let ticket = 0;
  let queued = false;
  let spinning = 0;

  await loader.preloadMaterials('ldraw/LDConfig.ldr');
  packText = await (await fetch('ldraw/parts.pack')).text();

  function draw() {
    renderer.render(main.scene, camera);
  }

  function render() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  }

  controls.addEventListener('change', render);

  function frame() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    let half = view.real ? height / 2 / view.pxPerLdu : view.radius * view.margin;
    if (!view.real && width < height) half *= height / width;
    camera.top = half;
    camera.bottom = -half;
    camera.right = (half * width) / height;
    camera.left = -camera.right;
    camera.updateProjectionMatrix();
  }

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    frame();
    draw();
  }

  new ResizeObserver(resize).observe(canvas);

  function enqueue(job) {
    const next = chain.then(job);
    chain = next.catch(() => {});
    return next;
  }

  function template(part, color) {
    const key = `${part}:${color}`;
    if (!templates.has(key)) {
      templates.set(
        key,
        enqueue(
          () =>
            new Promise((resolve, reject) => {
              let text = `1 ${color} 0 0 0 1 0 0 0 1 0 0 0 1 ${part}.dat\n`;
              if (packText) {
                text += packText;
                packText = null;
              }
              loader.parse(
                text,
                (group) => {
                  const object = group.children[0];
                  if (!object) return reject(new Error(`Part ${part} did not load`));
                  group.remove(object);
                  resolve(object);
                },
                reject,
              );
            }),
        ),
      );
    }
    return templates.get(key);
  }

  async function instance(placement, faded) {
    const object = (await template(placement.part, placement.color)).clone();
    object.position.set(placement.x || 0, placement.y || 0, placement.z || 0);
    object.rotation.set(rad(placement.rx), rad(placement.rot), rad(placement.rz));
    if (faded) object.traverse(fade);
    return object;
  }

  function fadedMaterial(material) {
    if (!ghost.cache.has(material)) {
      const copy = material.clone();
      if (copy.color) copy.color.lerp(ghost.color, ghost.amount);
      ghost.cache.set(material, copy);
    }
    return ghost.cache.get(material);
  }

  function fade(child) {
    if (!child.material) return;
    child.material = Array.isArray(child.material) ? child.material.map(fadedMaterial) : fadedMaterial(child.material);
  }

  function setGhost(color) {
    for (const material of ghost.cache.values()) material.dispose();
    ghost.cache.clear();
    ghost.color.set(color);
  }

  function aim(cam, center, dir) {
    cam.position.copy(center).addScaledVector(dir, DISTANCE);
    cam.lookAt(center);
    cam.updateMatrixWorld();
  }

  function look(box, dir) {
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    view.radius = Math.max(sphere.radius, 1);
    view.dir = dir;
    controls.target.copy(sphere.center);
    aim(camera, sphere.center, dir);
    camera.zoom = 1;
    frame();
    controls.update();
  }

  function spin() {
    const id = ++spinning;
    const start = performance.now();
    const target = controls.target.clone();
    const base = camera.position.clone().sub(target);
    const axis = new THREE.Vector3(0, 1, 0);
    const step = (now) => {
      if (id !== spinning) return;
      const t = Math.min(1, (now - start) / 520);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.copy(base).applyAxisAngle(axis, (1 - eased) * -0.7).add(target);
      camera.lookAt(target);
      draw();
      if (t < 1) requestAnimationFrame(step);
      else controls.update();
    };
    requestAnimationFrame(step);
  }

  async function showPart(part, color) {
    const id = ++ticket;
    const object = await instance({ part, color });
    if (id !== ticket) return;
    main.root.clear();
    main.root.add(object);
    main.root.updateMatrixWorld(true);
    view.margin = 1.55;
    look(new THREE.Box3().setFromObject(main.root), PART_DIR);
    spin();
  }

  async function showModel(placements, upto, keepView) {
    const id = ++ticket;
    spinning += 1;
    const fadeOld = Number.isFinite(upto);
    const objects = await Promise.all(placements.map((p) => instance(p, fadeOld && p.step < upto)));
    if (id !== ticket) return;
    main.root.clear();
    if (!keepView) {
      for (const object of objects) main.root.add(object);
      main.root.updateMatrixWorld(true);
      view.margin = 1.12;
      look(new THREE.Box3().setFromObject(main.root), MODEL_DIR);
      main.root.clear();
    }
    placements.forEach((p, index) => {
      if (p.step <= upto) main.root.add(objects[index]);
    });
    draw();
  }

  function offscreen(width, height, job) {
    const old = renderer.getSize(new THREE.Vector2());
    const ratio = renderer.getPixelRatio();
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    const result = job();
    side.root.clear();
    renderer.setPixelRatio(ratio);
    renderer.setSize(old.x, old.y, false);
    draw();
    return result;
  }

  function sideFrame(half, aspect) {
    sideCamera.top = half;
    sideCamera.bottom = -half;
    sideCamera.right = half * aspect;
    sideCamera.left = -half * aspect;
    sideCamera.updateProjectionMatrix();
  }

  function thumb(part, color, size = 160) {
    const key = `${part}:${color}`;
    if (!thumbs.has(key)) {
      thumbs.set(
        key,
        template(part, color).then((source) =>
          enqueue(() =>
            offscreen(size * 2, size * 2, () => {
              side.root.add(source.clone());
              side.root.updateMatrixWorld(true);
              const sphere = new THREE.Box3().setFromObject(side.root).getBoundingSphere(new THREE.Sphere());
              sideFrame(sphere.radius * 1.12, 1);
              aim(sideCamera, sphere.center, PART_DIR);
              renderer.render(side.scene, sideCamera);
              return canvas.toDataURL('image/png');
            }),
          ),
        ),
      );
    }
    return thumbs.get(key);
  }

  async function sheet(placements, width = 820, height = 1040) {
    const objects = await Promise.all(placements.map((p) => instance(p, false)));
    return enqueue(() =>
      offscreen(width, height, () => {
        const page = document.createElement('canvas');
        page.width = width * SHEET_DIRS.length;
        page.height = height;
        const paper = page.getContext('2d');
        paper.fillStyle = '#ffffff';
        paper.fillRect(0, 0, page.width, page.height);
        for (const object of objects) side.root.add(object);
        side.root.updateMatrixWorld(true);
        const sphere = new THREE.Box3().setFromObject(side.root).getBoundingSphere(new THREE.Sphere());
        sideFrame(sphere.radius * 1.04, width / height);
        SHEET_DIRS.forEach((dir, index) => {
          aim(sideCamera, sphere.center, dir);
          renderer.render(side.scene, sideCamera);
          paper.drawImage(canvas, index * width, 0);
        });
        return page.toDataURL('image/png');
      }),
    );
  }

  function setReal(on, pxPerLdu) {
    view.real = on;
    if (pxPerLdu) view.pxPerLdu = pxPerLdu;
    camera.zoom = 1;
    frame();
    render();
  }

  function zoomBy(factor) {
    if (view.real) return;
    camera.zoom = Math.min(6, Math.max(0.5, camera.zoom * factor));
    camera.updateProjectionMatrix();
    render();
  }

  function resetView() {
    aim(camera, controls.target, view.dir);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.update();
    render();
  }

  resize();

  return { showPart, showModel, thumb, sheet, setReal, setGhost, zoomBy, resetView, render };
}
