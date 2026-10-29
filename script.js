gsap.registerPlugin(ScrollTrigger);
const WHATS = "5545999999999"; // TROCAR pelo número real (DDI+DDD+número)
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  /* 1. Scroll suave integrado ao GSAP */
  const lenis = new Lenis(); window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  const tick = t => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  /* 2. Entrada do nome: separa em letras e sobe com stagger */
  document.querySelectorAll(".word").forEach(w => {
    const txt = w.textContent;
    w.innerHTML = '<span class="mask">' + [...txt].map(c => '<span class="ch">' + c + '</span>').join("") + "</span>";
  });
  gsap.from(".ch", {yPercent: 115, duration: 1, ease: "power3.out", stagger: 0.04, delay: 0.2});

  /* 3. Parallax: cada camada desce numa velocidade diferente */
  document.querySelectorAll(".layer").forEach(el => {
    const s = parseFloat(el.dataset.speed);
    if (!s) return;
    gsap.to(el, {y: () => document.getElementById("hero").offsetHeight * s, ease: "none",
      scrollTrigger: {trigger: ".hero", start: "top top", end: "bottom top", scrub: true}});
  });

  /* 4. Parallax do mouse (só onde existe mouse) */
  if (matchMedia("(hover:hover)").matches) {
    const mx = gsap.quickTo(".w1", "x", {duration: .8, ease: "power3"});
    const sx = gsap.quickTo(".subject", "x", {duration: .8, ease: "power3"});
    addEventListener("pointermove", e => {
      const n = e.clientX / innerWidth - 0.5;
      mx(n * -24); sx(n * 12);
    });
  }

  /* 5. Serviços: seção fixada, scroll troca foco e derruba a imagem */
  const items = [...document.querySelectorAll(".svc-list li")];
  const names = ["Festa de 15 anos", "Pré-Wedding", "Ensaio Pessoal"];
  const cta = document.getElementById("cta"), count = document.getElementById("count");
  let cur = -1;
  const setActive = i => {
    if (i === cur) return; cur = i;
    items.forEach((li, k) => li.classList.toggle("on", k === i));
    count.textContent = "0" + (i + 1) + " / 03";
    cta.href = "https://wa.me/" + WHATS + "?text=" + encodeURIComponent("Olá, Marcelo! Quero um orçamento de " + names[i] + ".");
  };
  setActive(0);

  const fall = {yPercent: 120, rotate: 10, opacity: 0, ease: "power2.in", duration: 0.6};
  gsap.timeline({
    scrollTrigger: {trigger: ".svc", start: "top top", end: "+=300%", pin: true, scrub: 0.6,
      onUpdate: self => setActive(Math.min(2, Math.floor(self.progress * 3)))}
  })
  .to(".c0", fall, 0.7)
  .to(".c1", fall, 1.7)
  .to({}, {duration: 0.7}, 2.3); // respiro no fim

  return () => { gsap.ticker.remove(tick); lenis.destroy(); };
});

mm.add("(prefers-reduced-motion: reduce)", () => {
  document.getElementById("cta").href = "https://wa.me/" + WHATS;
});

/* 7. Galeria 3D: cards num cilindro, arraste para girar */
(() => {
  const stage = document.getElementById("stage"), ring = document.getElementById("ring");
  const cards = [...ring.children], n = cards.length, step = 28; // graus entre cards
  const label = document.getElementById("gcount");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cur = 0, target = 0, R = 600, w = 300, visible = false, raf = 0, dragging = false, sx = 0, st = 0, moved = 0;
  const size = () => { if (!cards[0].offsetWidth) return; w = cards[0].offsetWidth; R = (w * 1.12) / (2 * Math.sin(step * Math.PI / 360)); };
  const delta = i => { let d = ((i - cur) % n + n) % n; return d > n / 2 ? d - n : d; };
  const render = () => {
    cur += (target - cur) * (reduce ? 1 : 0.12);
    ring.style.transform = "translateZ(" + R + "px)";
    const act = ((Math.round(cur) % n) + n) % n;
    cards.forEach((c, i) => {
      const d = delta(i);
      c.style.transform = "translate(-50%,-50%) rotateY(" + (-d * step) + "deg) translateZ(" + (-R) + "px)";
      c.style.opacity = Math.max(0, Math.min(1, 1 - (Math.abs(d) - 1.8) / 1.2));
      c.classList.toggle("act", i === act);
    });
    label.textContent = "0" + (act + 1) + " / 0" + n;
  };
  const loop = () => { render(); raf = (visible && (dragging || Math.abs(target - cur) > 0.001)) ? requestAnimationFrame(loop) : 0; };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const go = k => { target = Math.round(target) + k; kick(); };

  stage.addEventListener("pointerdown", e => { dragging = true; sx = e.clientX; st = target; moved = 0; kick(); });
  stage.addEventListener("pointermove", e => { if (!dragging) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); target = st - dx / w; kick(); });
  const end = () => { if (!dragging) return; dragging = false; target = Math.round(target); kick(); };
  ["pointerup", "pointercancel", "pointerleave"].forEach(t => stage.addEventListener(t, end));
  cards.forEach((c, i) => c.addEventListener("click", () => { if (moved > 6) return; go(Math.round(delta(i))); }));
  stage.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
  document.getElementById("gnext").onclick = () => go(1);
  document.getElementById("gprev").onclick = () => go(-1);
  addEventListener("resize", () => { size(); render(); });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(stage);
  size(); render();
})();

/* 9. GALERIA WEBGL (Three.js): cards numa parede curva, como a do Jesper Landberg */
(() => {
  const wa = "https://wa.me/" + WHATS + "?text=" + encodeURIComponent("Olá, Marcelo! Gostaria de um orçamento.");
  const c2 = document.getElementById("cta2"); if (c2) c2.href = wa; document.getElementById("soc-wa").href = wa;
  const gal = document.getElementById("galeria"), wrap = document.getElementById("glwrap"), cv = document.getElementById("glc");
  if (typeof THREE === "undefined") return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas: cv, antialias: true, alpha: true}); } catch (e) { return; } // sem WebGL: fica o cilindro CSS
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  /* ====== AJUSTES: mexa aqui ====== */
  const ASPECT = 1.45, ASPECT_MOBILE = 0.8; // largura/altura do card (desktop e celular)
  const BEND = 0.07;   // curvatura da parede (0 = reta)
  const GAP = 1.02;    // espaço entre cards (1 = colados)
  const CARD_H = 0.68; // altura do card (fração da altura visível)
  const SCROLL_POR_CARD = 0.6; // rolagem que cada trabalho consome (1 = uma tela inteira)
  const CAM_Z = 6;     // distância da câmera

  /* Os trabalhos vêm dos cards do HTML (#ring .gcard). Para foto real: data-img="fotos/ensaio1.jpg" */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const works = [...document.querySelectorAll("#ring .gcard")].map(c => {
    if (c.dataset.img) { c.style.backgroundImage = "url(" + c.dataset.img + ")"; c.style.backgroundSize = "cover"; }
    return {title: c.querySelector(".gt").childNodes[0].textContent.trim(), tag: c.querySelector("small").textContent,
      hue: parseFloat(c.style.getPropertyValue("--h")) || 340, img: c.dataset.img || "",
      fotos: (c.dataset.fotos || "").split(",").map(s => s.trim()).filter(Boolean)};
  });
  const n = works.length;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  cam.position.z = CAM_Z;

  /* O truque da curva: cada vértice é empurrado para trás conforme se afasta do centro (z = -BEND·x²) */
  const vs = "uniform float uBend;varying vec2 vUv;varying float vX;void main(){vUv=uv;vec4 wp=modelMatrix*vec4(position,1.);wp.z-=uBend*wp.x*wp.x;vX=wp.x;gl_Position=projectionMatrix*viewMatrix*wp;}";
  /* Recorte arredondado, imagem em 'cover', sombra embaixo e escurecimento nas pontas */
  const fs = "uniform sampler2D uTex;uniform float uAspect,uImgAspect;varying vec2 vUv;varying float vX;void main(){" +
    "vec2 p=(vUv-.5)*vec2(uAspect,1.);vec2 q=abs(p)-vec2(uAspect,1.)*.5+.06;float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.06;if(d>0.)discard;" +
    "vec2 uv=vUv-.5;float r=uImgAspect/uAspect;if(r>1.)uv.x/=r;else uv.y*=r;vec3 c=texture2D(uTex,uv+.5).rgb;" +
    "c=mix(c,vec3(0.),smoothstep(.5,0.,vUv.y)*.6);gl_FragColor=vec4(c,mix(1.,.3,smoothstep(0.,7.,abs(vX))));}";

  const ph = (w, i) => { // imagem provisória desenhada em canvas
    const c = document.createElement("canvas"); c.width = 640; c.height = 474; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 640, 474); g.addColorStop(0, "#cfcaca"); g.addColorStop(1, "#8f8888");
    x.fillStyle = g; x.fillRect(0, 0, 640, 474);
    return c;
  };
  const mkTex = el => { const t = new THREE.Texture(el); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t; };
  const meshes = works.map((w, i) => {
    const mat = new THREE.ShaderMaterial({transparent: true, vertexShader: vs, fragmentShader: fs,
      uniforms: {uBend: {value: BEND}, uTex: {value: mkTex(ph(w, i))}, uAspect: {value: ASPECT}, uImgAspect: {value: 640 / 474}}});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 1), mat); scene.add(m);
    if (w.img) { const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => { mat.uniforms.uTex.value = mkTex(im); mat.uniforms.uImgAspect.value = im.width / im.height; kick(); };
      im.src = w.img; }
    return m;
  });

  const info = document.getElementById("glinfo"), tEl = document.getElementById("glt"), gEl = document.getElementById("glg");
  const arrow = document.getElementById("gla"), label = document.getElementById("gcount");
  let W = 3, H = 2.2, S = 3, pxU = 100, cardPx = 300, cur = 0, tgt = 0, act = -1, visible = false, raf = 0, dragging = false, sx = 0, st = 0, moved = 0, st0 = 0, ST = null, timer = 0;

  const setAct = a => { act = a; tEl.textContent = works[a].title; gEl.textContent = works[a].tag; label.textContent = "0" + (a + 1) + " / 0" + n;
    gsap.fromTo(info, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: .45, ease: "power3.out"}); };
  const render = () => {
    cur += (tgt - cur) * (reduce ? 1 : 0.1);
    const T = n * S; // volta infinita: cada card é reposicionado dentro de [-T/2, T/2)
    meshes.forEach((m, i) => { const v = (i - cur) * S; m.position.x = (((v + T / 2) % T) + T) % T - T / 2; });
    const a = ((Math.round(cur) % n) + n) % n; if (a !== act) setAct(a);
    renderer.render(scene, cam);
  };
  const loop = () => { render(); raf = (visible && (dragging || Math.abs(tgt - cur) > 0.001)) ? requestAnimationFrame(loop) : 0; };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const per = () => (ST.end - ST.start) / (n - 1);                       // rolagem (px) entre um trabalho e o próximo
  const idxNow = () => Math.round(Math.max(0, Math.min(1, ST.progress)) * (n - 1));
  const scrollY = (y, o) => window.lenis ? window.lenis.scrollTo(y, o) : window.scrollTo({top: y, behavior: "smooth"});
  const settle = () => { clearTimeout(timer); timer = setTimeout(() => { // parou de rolar: encaixa no trabalho mais próximo
    if (dragging || !ST || !ST.isActive) return; scrollY(ST.start + idxNow() * per(), {duration: 0.5}); }, 160); };
  const go = k => {
    if (!ST) { tgt = Math.round(tgt) + k; kick(); return; }
    scrollY(ST.start + Math.max(0, Math.min(n - 1, idxNow() + k)) * per(), {duration: 0.8});
  };

  /* Ensaio em tela cheia: usa o <dialog> nativo (já traz Esc, foco preso e fundo bloqueado) */
  const dlg = document.getElementById("viewer"), vT = document.getElementById("v-title"), vG = document.getElementById("v-tag");
  const vP = document.getElementById("v-photos"), vW = document.getElementById("v-wa");
  let opener = null;
  const openWork = i => {
    const w = works[i]; opener = document.activeElement;
    vT.textContent = w.title; vG.textContent = w.tag; vP.innerHTML = "";
    (w.fotos.length ? w.fotos : [null, null, null]).forEach((src, k) => { // sem fotos: 3 blocos de teste
      const f = document.createElement("figure");
      if (src) { const im = document.createElement("img"); im.src = src; im.alt = w.title + " — " + w.tag + ", foto " + (k + 1); im.loading = "lazy"; f.appendChild(im); }
      else { f.className = "ph"; f.style.setProperty("--h", w.hue + k * 18); }
      vP.appendChild(f);
    });
    vW.href = "https://wa.me/" + WHATS + "?text=" + encodeURIComponent("Olá, Marcelo! Vi o ensaio “" + w.title + "” (" + w.tag + ") e quero um orçamento.");
    if (window.lenis) window.lenis.stop();
    dlg.showModal(); dlg.scrollTop = 0;
    if (!reduce) gsap.fromTo(dlg, {clipPath: "inset(30% 25% 30% 25% round 24px)", opacity: 0}, {clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1, duration: 0.7, ease: "power3.out"});
  };
  dlg.addEventListener("close", () => { if (window.lenis) window.lenis.start(); if (opener) opener.focus(); });
  document.getElementById("v-close").onclick = () => dlg.close();

  const layout = () => {
    const bw = wrap.clientWidth, bh = wrap.clientHeight; if (!bw) return;
    renderer.setSize(bw, bh, false); cam.aspect = bw / bh; cam.updateProjectionMatrix();
    const asp = bw < 600 ? ASPECT_MOBILE : ASPECT;
    const vh = 2 * CAM_Z * Math.tan(cam.fov * Math.PI / 360), vw = vh * cam.aspect; // tamanho visível em z = 0
    H = vh * CARD_H; W = H * asp; if (W > vw * 0.8) { W = vw * 0.8; H = W / asp; }
    S = W * GAP; pxU = bh / vh;
    meshes.forEach(m => { m.scale.set(W, H, 1); m.material.uniforms.uAspect.value = asp; });
    cam.updateMatrixWorld(); // sem isso o project() usa uma câmera desatualizada e devolve NaN
    const pr = (x, y) => { const v = new THREE.Vector3(x, y, 0).project(cam); return [(v.x + 1) / 2 * bw, (1 - v.y) / 2 * bh]; };
    const bl = pr(-W / 2, -H / 2), br = pr(W / 2, -H / 2); // cantos do card central → posição do texto e da seta
    info.style.left = bl[0] + 18 + "px"; info.style.bottom = (bh - bl[1] + 16) + "px";
    arrow.style.left = (br[0] - 56) + "px"; arrow.style.top = (br[1] - 54) + "px";
    cardPx = pr(W / 2, 0)[0] - pr(-W / 2, 0)[0];
    render();
  };

  wrap.addEventListener("pointerdown", e => { dragging = true; sx = e.clientX; st = tgt; st0 = window.scrollY; moved = 0; wrap.setPointerCapture(e.pointerId); kick(); });
  wrap.addEventListener("pointermove", e => { if (!dragging) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (ST) scrollY(st0 - dx / (S * pxU) * per(), {immediate: true}); else { tgt = st - dx / (S * pxU); kick(); } });
  const end = e => { if (!dragging) return; dragging = false; if (ST) settle(); else { tgt = Math.round(tgt); kick(); }
    if (e.type === "pointerup" && moved < 6) { // toque: no card central abre; nas laterais, avança
      const dx = e.clientX - wrap.getBoundingClientRect().left - wrap.clientWidth / 2;
      if (Math.abs(dx) < cardPx / 2) openWork(act);
      else go(Math.sign(dx));
    } };
  ["pointerup", "pointercancel"].forEach(t => wrap.addEventListener(t, end));
  wrap.addEventListener("keydown", e => { if (e.key === "Enter") openWork(act); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
  document.getElementById("gnext").onclick = () => go(1);
  document.getElementById("gprev").onclick = () => go(-1);
  cv.addEventListener("webglcontextlost", e => { e.preventDefault(); gal.classList.remove("gl"); });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(wrap);
  addEventListener("resize", layout);

  gal.classList.add("gl"); // ativa o modo WebGL (CSS esconde o cilindro)
  if (!reduce) { // seção fixada: a rolagem da página passa os trabalhos, e só no fim a página continua
    ST = ScrollTrigger.create({trigger: gal, start: "top top", end: () => "+=" + (n - 1) * innerHeight * SCROLL_POR_CARD,
      pin: true, invalidateOnRefresh: true, refreshPriority: 2,
      onUpdate: self => { tgt = self.progress * (n - 1); kick(); settle(); }});
  }
  layout();
})();

/* 8. Galeria no desktop: rolagem horizontal fixada (os cards vêm do mesmo HTML do cilindro) */
(() => {
  const gal = document.getElementById("galeria"), track = document.getElementById("htrack");
  const src = [...document.querySelectorAll("#ring .gcard")], n = src.length;
  src.forEach(c => {
    const f = document.createElement("figure");
    f.className = "hcard"; f.style.cssText = c.getAttribute("style"); f.innerHTML = c.innerHTML;
    track.appendChild(f);
  });
  const label = document.getElementById("gcount");
  mm.add("(min-width:800px) and (prefers-reduced-motion: no-preference)", () => {
    if (gal.classList.contains("gl")) return; // a galeria WebGL já cuida disso
    gal.classList.add("hpin");
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {x: () => -dist(), ease: "none",
      scrollTrigger: {trigger: gal, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6,
        invalidateOnRefresh: true, refreshPriority: 2,
        onUpdate: s => { label.textContent = "0" + (Math.round(s.progress * (n - 1)) + 1) + " / 0" + n; }}});
    return () => gal.classList.remove("hpin");
  });
})();

/* 6. Vídeos: só carregam e tocam quando aparecem na tela */
const io = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (!v.dataset.src) return;
  if (e.isIntersecting) {
    if (!v.src) v.src = v.dataset.src;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {});
  } else v.pause();
}), {threshold: 0.25});
document.querySelectorAll("video").forEach(v => io.observe(v));