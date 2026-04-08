document.addEventListener('DOMContentLoaded', function () {

    // ── Find current record ───────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    let currentIndex = records.findIndex(r => r.id === params.get('id'));
    if (currentIndex === -1) currentIndex = 0;

    // ── DOM refs ──────────────────────────────────────────────
    const skyPhoto         = document.getElementById('skyPhoto');
    const interiorContent  = document.getElementById('interiorContent');
    const recordName       = document.getElementById('recordName');
    const recordArtistYear = document.getElementById('recordArtistYear');
    const wTemp            = document.getElementById('wTemp');
    const wVisibility      = document.getElementById('wVisibility');
    const wPressure        = document.getElementById('wPressure');
    const wSky             = document.getElementById('wSky');
    const wDesc            = document.getElementById('wDesc');
    const tempPill         = document.getElementById('tempTriangle');
    const tempStrip        = document.getElementById('tempStrip');
    const dataRow          = document.getElementById('dataRow');
    const panelToggle      = document.getElementById('panelToggle');
    const menuList         = document.getElementById('menuList');

    let isDraggingStrip = false;
    let showingDesc     = false;

    // ── Panel toggle ──────────────────────────────────────────
    panelToggle.addEventListener('click', function () {
        showingDesc = !showingDesc;
        dataRow.classList.toggle('show-desc', showingDesc);
        panelToggle.innerHTML = showingDesc ? '&lt;' : '&gt;';
    });

    // ── Title fitter ──────────────────────────────────────────
    function fitTitle() {
        const maxWidth = recordName.parentElement.offsetWidth - 56;
        let fontSize   = 48;
        recordName.style.fontSize   = fontSize + 'px';
        recordName.style.whiteSpace = 'nowrap';
        while (recordName.scrollWidth > maxWidth && fontSize > 16) {
            fontSize -= 1;
            recordName.style.fontSize = fontSize + 'px';
        }
        recordName.style.whiteSpace = 'normal';
    }

    // ── Apply record content ──────────────────────────────────
    function applyRecord(record) {
        document.title = record.title + ' — The Forecast';
        history.replaceState(null, '', 'interior.html?id=' + record.id);

        recordName.textContent       = record.title;
        recordArtistYear.textContent = record.artist + ' \u2013 ' + record.year;
        wTemp.textContent            = record.temp + '°';
        wVisibility.textContent      = record.visibility;
        wPressure.textContent        = record.pressure;
        wSky.textContent             = record.skyDesc;
        wDesc.textContent            = record.desc;

        interiorContent.classList.remove('theme-light', 'theme-dark');
        interiorContent.classList.add('theme-' + record.theme);

        skyPhoto.src = record.sky;
        skyPhoto.alt = record.title + ' sky';

        fitTitle();
    }

    // ── Fade transition ───────────────────────────────────────
    function transitionTo(index) {
        if (index < 0 || index >= records.length) return;
        if (index === currentIndex) return;
        currentIndex = index;

        interiorContent.classList.add('fading');
        skyPhoto.classList.add('fading');

        setTimeout(function () {
            applyRecord(records[currentIndex]);
            movePillTo(records[currentIndex].tempPosition);
            interiorContent.classList.remove('fading');
            skyPhoto.classList.remove('fading');
        }, 400);
    }

    // ── Pill positioning ──────────────────────────────────────
    function movePillTo(pct) {
        tempPill.style.left = pct + '%';
    }

    // ── Strip drag helpers ────────────────────────────────────
    function getPct(clientX) {
        const rect = tempStrip.getBoundingClientRect();
        return Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100));
    }

    function indexFromPct(pct) {
        let nearest     = 0;
        let nearestDist = Infinity;
        records.forEach(function (r, i) {
            const dist = Math.abs(r.tempPosition - pct);
            if (dist < nearestDist) { nearestDist = dist; nearest = i; }
        });
        return nearest;
    }

    function onDragMove(clientX) {
        const pct   = getPct(clientX);
        const index = indexFromPct(pct);
        tempPill.style.left = pct + '%';
        if (index !== currentIndex) {
            currentIndex = index;
            applyRecord(records[currentIndex]);
        }
    }

    function onDragEnd() {
        if (!isDraggingStrip) return;
        isDraggingStrip = false;
        skyPhoto.style.transition = '';
        tempPill.style.transition = 'left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        tempPill.style.left       = records[currentIndex].tempPosition + '%';
        setTimeout(function () { tempPill.style.transition = ''; }, 300);
    }

    function onDragStart(clientX) {
        isDraggingStrip           = true;
        tempPill.style.transition = 'none';
        skyPhoto.style.transition = 'none';
        onDragMove(clientX);
    }

    function attachDragEvents(element) {
        element.addEventListener('mousedown', function (e) {
            e.preventDefault();
            onDragStart(e.clientX);
            function onMove(e) { onDragMove(e.clientX); }
            function onUp() {
                onDragEnd();
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup',   onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup',   onUp);
        });
        element.addEventListener('touchstart', function (e) {
            e.preventDefault();
            onDragStart(e.touches[0].clientX);
        }, { passive: false });
        element.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (isDraggingStrip) onDragMove(e.touches[0].clientX);
        }, { passive: false });
        element.addEventListener('touchend', function (e) {
            e.preventDefault();
            onDragEnd();
        }, { passive: false });
    }

    attachDragEvents(tempStrip);
    attachDragEvents(tempPill);

    // ── Swipe navigation ──────────────────────────────────────
    let swipeTouchStartX    = 0;
    let swipeTouchStartY    = 0;
    let swipeStartedOnStrip = false;

    document.addEventListener('touchstart', function (e) {
        swipeTouchStartX    = e.touches[0].clientX;
        swipeTouchStartY    = e.touches[0].clientY;
        swipeStartedOnStrip = tempStrip.contains(e.target) || tempPill.contains(e.target);
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
        if (swipeStartedOnStrip || isDraggingStrip) return;
        const dx = e.changedTouches[0].clientX - swipeTouchStartX;
        const dy = e.changedTouches[0].clientY - swipeTouchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0) transitionTo(currentIndex + 1);
            else        transitionTo(currentIndex - 1);
        }
    }, { passive: true });

    // ── Arrow keys ────────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') transitionTo(currentIndex + 1);
        if (e.key === 'ArrowLeft')  transitionTo(currentIndex - 1);
        if (e.key === 'Escape')     closeMenu();
    });

    // ── Initial render ────────────────────────────────────────
    const initial = records[currentIndex];
    skyPhoto.src  = initial.sky;
    skyPhoto.alt  = initial.title + ' sky';
    applyRecord(initial);
    tempPill.style.transition = 'none';
    movePillTo(initial.tempPosition);
    setTimeout(function () { tempPill.style.transition = ''; }, 50);

    // ── Build menu list ───────────────────────────────────────
    records.forEach(function (r) {
        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href        = 'interior.html?id=' + r.id;
        a.textContent = r.title + ' \u2014 ' + r.artist;
        li.appendChild(a);
        menuList.appendChild(li);
    });

    // ── Menu drawer ───────────────────────────────────────────
    const hamburger    = document.getElementById('interiorHamburger');
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

    if (hamburger)    hamburger.addEventListener('click', openMenu);
    if (menuClose)    menuClose.addEventListener('click', closeMenu);
    if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
});