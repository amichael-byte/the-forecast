document.addEventListener('DOMContentLoaded', function () {

    // ── Build pin DOM ─────────────────────────────────────────
    document.querySelectorAll('.pin-wrap').forEach(function (wrap) {
        const label = wrap.getAttribute('data-label');

        const dot = document.createElement('div');
        dot.className = 'pin-dot';

        const ring = document.createElement('div');
        ring.className = 'pin-ring';

        const lbl = document.createElement('span');
        lbl.className = 'pin-label';
        lbl.textContent = label;

        wrap.appendChild(ring);
        wrap.appendChild(dot);
        wrap.appendChild(lbl);
    });

    // ── Draggable map ─────────────────────────────────────────
    const mapLayer = document.getElementById('mapLayer');
    const mapImg   = document.getElementById('mapImg');
    const frame    = document.querySelector('.phone-screen');

    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 125;
    let currentY = 500;

    function getBounds() {
        const frameW = frame.offsetWidth;
        const frameH = frame.offsetHeight;
        const imgW   = mapImg.offsetWidth;
        const imgH   = mapImg.offsetHeight;
        const overlapX = (imgW - frameW) / 2;
        const overlapY = (imgH - frameH) / 2;
        return { minX: -overlapX, maxX: overlapX, minY: -overlapY, maxY: overlapY };
    }

    function clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }

    function applyTransform() {
        mapLayer.style.transform = `translate(${currentX}px, ${currentY}px)`;
        updateActivePin();
    }

    // ── Proximity: always activate the single nearest pin ─────
    // No distance gate — whichever pin is closest to screen
    // center wins unconditionally, including edge pins.
    const pins = Array.from(document.querySelectorAll('.pin-wrap'));
    let activePin = null;

    function updateActivePin() {
        const frameRect = frame.getBoundingClientRect();
        const frameCX = frameRect.left + frame.offsetWidth  / 2;
        const frameCY = frameRect.top  + frame.offsetHeight / 2;

        let nearest = null;
        let nearestDist = Infinity;

        pins.forEach(function (pin) {
            const rect = pin.getBoundingClientRect();
            const pinX = rect.left + rect.width  / 2;
            const pinY = rect.top  + rect.height / 2;
            const dist = Math.hypot(pinX - frameCX, pinY - frameCY);

            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = pin;
            }
        });

        if (nearest && nearest !== activePin) {
            if (activePin) activePin.classList.remove('pin-active');
            nearest.classList.add('pin-active');
            activePin = nearest;
        }
    }

    // Apply starting position
    applyTransform();

    // Mouse
    mapLayer.addEventListener('mousedown', function (e) {
        if (e.target.closest('a')) return;
        isDragging = true;
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
        mapLayer.style.transition = 'none';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        const b = getBounds();
        currentX = clamp(e.clientX - startX, b.minX, b.maxX);
        currentY = clamp(e.clientY - startY, b.minY, b.maxY);
        applyTransform();
    });

    document.addEventListener('mouseup', function () {
        if (!isDragging) return;
        isDragging = false;
        mapLayer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });

    // Touch
    mapLayer.addEventListener('touchstart', function (e) {
        if (e.target.closest('a')) return;
        isDragging = true;
        const t = e.touches[0];
        startX = t.clientX - currentX;
        startY = t.clientY - currentY;
        mapLayer.style.transition = 'none';
    }, { passive: true });

    mapLayer.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        e.preventDefault();
        const t = e.touches[0];
        const b = getBounds();
        currentX = clamp(t.clientX - startX, b.minX, b.maxX);
        currentY = clamp(t.clientY - startY, b.minY, b.maxY);
        applyTransform();
    }, { passive: false });

    mapLayer.addEventListener('touchend', function () {
        isDragging = false;
        mapLayer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });

    // ── Menu drawer ───────────────────────────────────────────
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const menuDrawer   = document.getElementById('menuDrawer');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const menuClose    = document.getElementById('menuClose');

    function openMenu() {
        menuDrawer.classList.add('open');
        menuBackdrop.classList.add('open');
    }

    function closeMenu() {
        menuDrawer.classList.remove('open');
        menuBackdrop.classList.remove('open');
    }

    hamburgerBtn.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    menuBackdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });
});