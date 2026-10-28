(function () {
  var mouse = { x: 0, y: 0 };
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('pointermove', function (e) {
    mouse.x = e.clientX / innerWidth * 2 - 1;
    mouse.y = e.clientY / innerHeight * 2 - 1;
  });

  function mat(o) { return new THREE.MeshStandardMaterial(o); }

  function build(type, color) {
    var g = new THREE.Group(), c = new THREE.Color(color), i, m;
    if (type === 'cup') {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(1, .75, 2.2, 32, 1, true),
        mat({ color: 0xffffff, transparent: true, opacity: .25, side: THREE.DoubleSide })));
      m = new THREE.Mesh(new THREE.CylinderGeometry(.92, .72, 1.6, 32), mat({ color: c, transparent: true, opacity: .92 }));
      m.position.y = -.25; g.add(m);
      m = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .15, 32), mat({ color: 0xe8efe6 }));
      m.position.y = 1.15; g.add(m);
      m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.9, 12), mat({ color: 0x4f7a5a }));
      m.position.set(.3, 1.9, 0); m.rotation.z = -.2; g.add(m);
      for (i = 0; i < 16; i++) {
        m = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 16), mat({ color: 0x2b1d14, roughness: .3 }));
        m.position.set((Math.random() - .5) * 1, -1 + Math.random() * .35, (Math.random() - .5) * 1);
        g.add(m);
      }
      g.scale.setScalar(.85);
    } else if (type === 'gem') {
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), mat({ color: c, flatShading: true, roughness: .3 })));
    } else if (type === 'knot') {
      g.add(new THREE.Mesh(new THREE.TorusKnotGeometry(.8, .28, 90, 12), mat({ color: c, roughness: .35 })));
    } else {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), mat({ color: c, roughness: .4 })));
      m = new THREE.Mesh(new THREE.SphereGeometry(.45, 20, 20), mat({ color: 0xffffff }));
      m.position.set(.75, .75, .75); g.add(m);
    }
    return g;
  }

  function scene(canvas) {
    var type = canvas.dataset.type || 'cup', pearls = canvas.dataset.pearls === '1';
    var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, .1, 50);
    cam.position.set(0, .4, 6);
    var r = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    sc.add(new THREE.AmbientLight(0xffffff, .8));
    var d = new THREE.DirectionalLight(0xffffff, 1.1); d.position.set(3, 4, 5); sc.add(d);
    var p = new THREE.PointLight(0x9fd3ab, 1.2, 20); p.position.set(-3, -1, 3); sc.add(p);
    var obj = build(type, canvas.dataset.color || '#6f9a7b'); sc.add(obj);
    var floaters = [];
    if (pearls) for (var i = 0; i < 12; i++) {
      var s = new THREE.Mesh(new THREE.SphereGeometry(.1 + Math.random() * .12, 16, 16), mat({ color: 0x2b1d14, roughness: .3 }));
      s.userData = { a: Math.random() * 6.28, rad: 2 + Math.random() * 1.3, y: (Math.random() - .5) * 3, sp: .2 + Math.random() * .4 };
      sc.add(s); floaters.push(s);
    }
    var hover = false, visible = true, t = 0, k = 1;
    canvas.addEventListener('pointerenter', function () { hover = true; });
    canvas.addEventListener('pointerleave', function () { hover = false; });
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
    new ResizeObserver(function () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }).observe(canvas);
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      t += .016;
      if (!still) obj.rotation.y += hover ? .035 : .01;
      obj.rotation.x += (mouse.y * .35 - obj.rotation.x) * .05;
      obj.position.y = still ? 0 : Math.sin(t * 1.5) * .15;
      k += ((hover ? 1.15 : 1) - k) * .1; obj.scale.setScalar(k * (type === 'cup' ? .85 : 1));
      cam.position.x += (mouse.x * .8 - cam.position.x) * .05; cam.lookAt(0, 0, 0);
      floaters.forEach(function (f) {
        var u = f.userData; u.a += u.sp * .01 * 3;
        f.position.set(Math.cos(u.a) * u.rad, u.y + Math.sin(t + u.a) * .2, Math.sin(u.a) * u.rad);
      });
      r.render(sc, cam);
    })();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.THREE) document.querySelectorAll('canvas[data-3d]').forEach(scene);

    var btn = document.querySelector('.menu-btn'), nav = document.querySelector('nav');
    btn.addEventListener('click', function () {
      var o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o);
    });

    document.querySelectorAll('[data-count]').forEach(function (el) {
      var end = +el.dataset.count, n = 0, step = Math.max(1, Math.round(end / 90));
      new IntersectionObserver(function (e, ob) {
        if (!e[0].isIntersecting) return; ob.disconnect();
        var id = setInterval(function () {
          n = Math.min(end, n + step); el.textContent = n.toLocaleString();
          if (n >= end) clearInterval(id);
        }, 20);
      }).observe(el);
    });

    var fb = document.querySelectorAll('.filters button');
    fb.forEach(function (b) {
      b.addEventListener('click', function () {
        fb.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
        document.querySelectorAll('[data-cat]').forEach(function (c) {
          c.classList.toggle('hide', b.dataset.filter !== 'all' && c.dataset.cat !== b.dataset.filter);
        });
      });
    });

    var form = document.getElementById('contact-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var body = 'Name: ' + f.get('name') + '\nEmail: ' + f.get('email') + '\n\n' + f.get('message');
      location.href = 'mailto:contact@ecoboba.com?subject=' + encodeURIComponent(f.get('subject')) + '&body=' + encodeURIComponent(body);
      document.getElementById('status').textContent = 'Opening your email app… thank you!';
    });
  });
})();