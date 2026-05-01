/** After programmatic scroll (chevron etc.), ignore chapter proximity snap briefly */
var weddingSnapSuppressUntil = 0;
function weddingSuppressChapterSnap(ms) {
    weddingSnapSuppressUntil = Date.now() + (ms || 700);
}

function JumpTo(id) {
    weddingSuppressChapterSnap(900);
    var jumpto = document.getElementById(id);
    if (!jumpto) return;
    jumpto.scrollIntoView({ block: "start", behavior: "smooth" });
}

/** Hero chevron: only while still in the first (header) section */
function updateHeaderScrollCue() {
    var scroller = weddingMainScroller();
    var btn = document.querySelector("header .header__scroll");
    var header = document.getElementById("header");
    if (!btn || !header) return;
    var y = scroller ? scroller.scrollTop : window.scrollY || 0;
    var headerH = header.offsetHeight || 0;
    var vh = window.innerHeight || 0;
    var hide = headerH > 0 && y > Math.max(40, headerH - vh * 0.72);
    btn.classList.toggle("header__scroll--hidden", hide);
    if (hide) {
        btn.setAttribute("aria-hidden", "true");
        btn.setAttribute("tabindex", "-1");
    } else {
        btn.removeAttribute("aria-hidden");
        btn.removeAttribute("tabindex");
    }
}

/** Vertical scroll lives on `.page-scroll` (optional JS chapter proximity snap); not on window */
function weddingMainScroller() {
    return document.querySelector(".page-scroll");
}

function weddingScrollTop() {
    var s = weddingMainScroller();
    return s ? s.scrollTop : window.scrollY || window.pageYOffset || 0;
}

function weddingBindScroll(handler) {
    var s = weddingMainScroller();
    if (s) {
        s.addEventListener("scroll", handler, { passive: true });
    } else {
        window.addEventListener("scroll", handler, { passive: true });
    }
}

var weddingChapterEaseRaf = null;

function weddingIsChapterEaseRunning() {
    return weddingChapterEaseRaf != null;
}

/** Slower than native `scroll-behavior: smooth` — eased scroll over ~0.8–1.2s */
function weddingEaseScrollChapterSnap(scroller, targetTop, durationMs) {
    if (weddingChapterEaseRaf != null) {
        cancelAnimationFrame(weddingChapterEaseRaf);
        weddingChapterEaseRaf = null;
    }
    var from = scroller.scrollTop;
    var dist = targetTop - from;
    if (Math.abs(dist) < 2) return;
    var dur = durationMs || 900;
    var t0 = performance.now();
    weddingSuppressChapterSnap(dur + 280);

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function tick(now) {
        var u = Math.min(1, (now - t0) / dur);
        var e = easeInOutCubic(u);
        scroller.scrollTop = Math.round(from + dist * e);
        if (u < 1) {
            weddingChapterEaseRaf = requestAnimationFrame(tick);
        } else {
            weddingChapterEaseRaf = null;
            scroller.scrollTop = targetTop;
            reveal();
            revealSecondBg();
        }
    }
    weddingChapterEaseRaf = requestAnimationFrame(tick);
}

/**
 * When scrolling stops (down only): if within a small band of the next .scroll-chapter start, align there; otherwise leave scroll unchanged.
 */
function weddingMaybeSnapChapter(scroller, dir) {
    if (!scroller || dir === 0) return;
    if (dir < 0) return;
    if (Date.now() < weddingSnapSuppressUntil) return;
    var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq && mq.matches) return;

    var chapters = scroller.querySelectorAll(".scroll-chapter");
    if (!chapters.length) return;

    var sr = scroller.getBoundingClientRect();
    var tops = [];
    for (var k = 0; k < chapters.length; k++) {
        var cr = chapters[k].getBoundingClientRect();
        tops.push(Math.round(scroller.scrollTop + (cr.top - sr.top)));
    }

    var y = scroller.scrollTop;
    var vh = scroller.clientHeight || 0;
    var band = Math.max(88, Math.min(220, Math.round(vh * 0.22)));
    /** Must have scrolled this far into the current chapter before a downward snap to the next */
    var minInPrev = Math.max(96, Math.round(vh * 0.12));
    var target = null;

    for (var i = 0; i < tops.length; i++) {
        if (tops[i] > y + 1) {
            var dn = tops[i] - y;
            if (dn <= 0 || dn > band) break;
            if (i > 0 && y - tops[i - 1] < minInPrev) break;
            target = tops[i];
            break;
        }
    }

    if (target == null) return;
    if (Math.abs(y - target) < 3) return;

    var travel = Math.abs(target - y);
    var dur = Math.min(1200, Math.max(820, 650 + travel * 0.42));
    weddingEaseScrollChapterSnap(scroller, target, dur);
}

function weddingInitChapterProximitySnap() {
    var scroller = weddingMainScroller();
    if (!scroller) return;
    var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq && mq.matches) return;
    if (!scroller.querySelector(".scroll-chapter")) return;

    var lastST = scroller.scrollTop;
    var burst = 0;
    var deb;
    scroller.addEventListener(
        "scroll",
        function () {
            if (Date.now() < weddingSnapSuppressUntil) {
                lastST = scroller.scrollTop;
                burst = 0;
                return;
            }
            var n = scroller.scrollTop;
            burst += n - lastST;
            lastST = n;
            clearTimeout(deb);
            deb = setTimeout(function () {
                var dir = burst > 12 ? 1 : burst < -12 ? -1 : 0;
                burst = 0;
                weddingMaybeSnapChapter(scroller, dir);
            }, 200);
        },
        { passive: true }
    );
}

/* Pixels from bottom of viewport — element is “revealed” when its top crosses above this line (shared with revealSecondBg) */
var WEDDING_SCROLL_REVEAL_INSET = 150;

//
function reveal(){
    if (weddingIsChapterEaseRunning()) return;
    var reveals = document.querySelectorAll(".countdown-area-box>div,#photo-gallery,.dresscode-box,.intro-box,.intro-content,.time")
    for (var i = 0; i < reveals.length; i++){
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = WEDDING_SCROLL_REVEAL_INSET;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        } else {
            reveals[i].classList.remove("active");
        }
    }
}
weddingBindScroll(reveal);

//
function setBgOpacity(el, opacity) {
    if (!el) return;
    var next = opacity ? "1" : "0";
    if (el.style.opacity === next) return;
    el.style.opacity = next;
}

/* Once the intro photo has triggered the blurred second bg, keep it for the rest of the page until we return to the hero */
var weddingSecondBgLocked = false;

/* Second hero image: when intro picture (#intro .intro-photo) crosses the reveal line — same inset as reveal() (WEDDING_SCROLL_REVEAL_INSET) */
function revealSecondBg(){
    if (weddingIsChapterEaseRunning()) return;
    var el = document.getElementById("secondbg");
    var home = document.getElementById("homebg");
    if (!el) return;
    var introPhoto = document.querySelector("#intro .intro-photo");
    if (!introPhoto) return;
    var scrollY = weddingScrollTop();
    if (scrollY < 80) {
        weddingSecondBgLocked = false;
    } else {
        var windowHeight = window.innerHeight;
        var elementTop = introPhoto.getBoundingClientRect().top;
        if (elementTop < windowHeight - WEDDING_SCROLL_REVEAL_INSET) {
            weddingSecondBgLocked = true;
        }
    }

    if (weddingSecondBgLocked) {
        setBgOpacity(el, true);
        setBgOpacity(home, false);
    } else {
        setBgOpacity(el, false);
        setBgOpacity(home, true);
    }
}
weddingBindScroll(revealSecondBg);
window.addEventListener("resize", revealSecondBg);

weddingBindScroll(updateHeaderScrollCue);
window.addEventListener("resize", updateHeaderScrollCue);


function submitform(responseText) {
    var submitsuccess = document.getElementById("submit-success");
    if (!submitsuccess) {
        return;
    }
    var detail = document.getElementById("rsvp-response-detail");
    if (detail) {
        var t = responseText != null ? String(responseText).trim() : "";
        if (t && t.toUpperCase() !== "OK") {
            detail.textContent = t;
            detail.removeAttribute("hidden");
        } else {
            detail.textContent = "";
            detail.setAttribute("hidden", "hidden");
        }
    }
    submitsuccess.style.display = "flex";
}

function submitok(){
    window.location.reload();
}

//
var weddingIso = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.dateIso) || "2026-10-03T16:30:00";
var TheDay = new Date(weddingIso).getTime();

var x = setInterval(function() {
  var elDays = document.getElementById("days");
  var elHours = document.getElementById("hours");
  var elMins = document.getElementById("mins");
  var elSecs = document.getElementById("secs");
  var elCountdown = document.getElementById("countdown");
  var elCountdownArea = document.getElementById("countdown-area");

  var now = new Date().getTime();
  var distance = TheDay - now;
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (elDays) elDays.innerHTML = days;
  if (elHours) elHours.innerHTML = hours;
  if (elMins) elMins.innerHTML = minutes;
  if (elSecs) elSecs.innerHTML = seconds;

  if (elCountdown) {
    elCountdown.innerHTML = "距離婚禮還剩 " + days + " 天<br>" + hours + " 小時 "
      + minutes + " 分鐘 " + seconds + " 秒<br>讓我們一起期待吧！";
  }

  if (distance < 0) {
    clearInterval(x);
    if (elCountdownArea) elCountdownArea.innerHTML = "<h2>Wedding Countdown</h2><br>IT'S TIME TO CELEBRATE !";
    if (elCountdown) elCountdown.innerHTML = "LET'S CELEBRATE !";
  }
}, 1000);

reveal();
revealSecondBg();
updateHeaderScrollCue();
weddingInitChapterProximitySnap();

(function initAlbumGallery() {
    var root = document.getElementById("photo-gallery");
    var srcNodes = root ? root.querySelectorAll(".album-src-list img") : [];
    var stackOpen = document.getElementById("album-stack-open");
    var stackTop = document.getElementById("album-stack-top");
    var layers = root ? root.querySelectorAll(".album-stack__layer") : [];
    var lb = document.getElementById("album-lightbox");
    var lbImg = document.getElementById("album-lightbox-img");
    var lbCounter = document.getElementById("album-lb-counter");
    var lbPrev = document.getElementById("album-lb-prev");
    var lbNext = document.getElementById("album-lb-next");
    var lbStage = lb ? lb.querySelector(".album-lightbox__stage") : null;

    var urls = [];
    var alts = [];
    var n = srcNodes.length;
    var albumIndex = 0;
    var lastFocus = null;

    if (!root || !n || !stackOpen || !stackTop || !lb || !lbImg) {
        window.weddingAlbumReset = function () {};
        return;
    }

    for (var s = 0; s < srcNodes.length; s++) {
        urls.push(srcNodes[s].getAttribute("src") || "");
        alts.push(srcNodes[s].getAttribute("alt") || "婚禮相片");
    }

    function setLayerBg(el, url) {
        if (!el || !url) return;
        el.style.backgroundImage = "url('" + url.replace(/'/g, "%27") + "')";
    }

    function updateStack() {
        if (!n) return;
        stackTop.src = urls[albumIndex];
        stackTop.alt = alts[albumIndex];
        if (layers.length >= 3) {
            setLayerBg(layers[0], urls[(albumIndex + 3) % n]);
            setLayerBg(layers[1], urls[(albumIndex + 2) % n]);
            setLayerBg(layers[2], urls[(albumIndex + 1) % n]);
        }
    }

    function updateLightbox() {
        lbImg.src = urls[albumIndex];
        lbImg.alt = alts[albumIndex];
        if (lbCounter) lbCounter.textContent = albumIndex + 1 + " / " + n;
    }

    function albumGo(i) {
        if (!n) return;
        albumIndex = ((i % n) + n) % n;
        updateStack();
        if (!lb.hasAttribute("hidden")) {
            updateLightbox();
        }
    }

    function openLightbox() {
        lastFocus = document.activeElement;
        updateLightbox();
        lb.removeAttribute("hidden");
        document.body.classList.add("album-lightbox-open");
        stackOpen.setAttribute("aria-expanded", "true");
        var closeBtn = lb.querySelector(".album-lightbox__close");
        if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
        lb.setAttribute("hidden", "hidden");
        document.body.classList.remove("album-lightbox-open");
        stackOpen.setAttribute("aria-expanded", "false");
        updateStack();
        if (lastFocus && typeof lastFocus.focus === "function") {
            try {
                lastFocus.focus();
            } catch (err) {}
        }
    }

    var stackSuppressClick = false;
    var stackTouchX0 = null;

    function albumSwipeThresholdPx(el) {
        var w = el && el.offsetWidth ? el.offsetWidth : 280;
        return Math.max(18, Math.min(32, Math.round(w * 0.065)));
    }

    stackOpen.addEventListener("click", function (e) {
        if (stackSuppressClick) {
            e.preventDefault();
            return;
        }
        openLightbox();
    });

    stackOpen.addEventListener(
        "touchstart",
        function (e) {
            if (!e.changedTouches || !e.changedTouches.length) return;
            stackTouchX0 = e.changedTouches[0].screenX;
        },
        { passive: true }
    );

    stackOpen.addEventListener("touchcancel", function () {
        stackTouchX0 = null;
    });

    stackOpen.addEventListener(
        "touchend",
        function (e) {
            if (stackTouchX0 == null || !e.changedTouches || !e.changedTouches.length) return;
            var dx = e.changedTouches[0].screenX - stackTouchX0;
            stackTouchX0 = null;
            var thr = albumSwipeThresholdPx(stackOpen);
            if (Math.abs(dx) < thr) return;
            stackSuppressClick = true;
            window.setTimeout(function () {
                stackSuppressClick = false;
            }, 280);
            if (dx < 0) albumGo(albumIndex + 1);
            else albumGo(albumIndex - 1);
        },
        { passive: true }
    );

    lb.querySelectorAll("[data-album-close]").forEach(function (el) {
        el.addEventListener("click", function () {
            closeLightbox();
        });
    });

    if (lbPrev) lbPrev.addEventListener("click", function () { albumGo(albumIndex - 1); });
    if (lbNext) lbNext.addEventListener("click", function () { albumGo(albumIndex + 1); });

    var touchStartX = null;
    if (lbStage) {
        lbStage.addEventListener(
            "touchstart",
            function (e) {
                if (!e.changedTouches || !e.changedTouches.length) return;
                touchStartX = e.changedTouches[0].screenX;
            },
            { passive: true }
        );
        lbStage.addEventListener("touchcancel", function () {
            touchStartX = null;
        });
        lbStage.addEventListener(
            "touchend",
            function (e) {
                if (touchStartX == null || !e.changedTouches || !e.changedTouches.length) return;
                var dx = e.changedTouches[0].screenX - touchStartX;
                touchStartX = null;
                var thr = albumSwipeThresholdPx(lbStage);
                if (dx < -thr) albumGo(albumIndex + 1);
                else if (dx > thr) albumGo(albumIndex - 1);
            },
            { passive: true }
        );
    }

    document.addEventListener("keydown", function (e) {
        if (lb.hasAttribute("hidden")) return;
        if (e.key === "Escape") {
            closeLightbox();
            e.preventDefault();
            return;
        }
        if (e.key === "ArrowLeft") {
            albumGo(albumIndex - 1);
            e.preventDefault();
        } else if (e.key === "ArrowRight") {
            albumGo(albumIndex + 1);
            e.preventDefault();
        }
    });

    window.weddingAlbumReset = function () {
        albumIndex = 0;
        updateStack();
    };

    window.weddingAlbumReset();
})();

(function weddingBackgroundAudio() {
    var cfg = window.WEDDING_CONFIG || {};
    var audioSrc = cfg.audioSrc;
    var audio = document.querySelector("audio");
    if (!audio) return;

    function hasValidSrc() {
        if (audioSrc) return true;
        try {
            var u = audio.currentSrc || audio.src;
            return !!(u && String(u).indexOf("example.com") === -1);
        } catch (e) {
            return false;
        }
    }

    if (audioSrc) {
        audio.src = audioSrc;
        audio.loop = true;
    }

    try {
        audio.defaultMuted = false;
        audio.muted = false;
        audio.volume = 1;
    } catch (eVol) {}

    function attemptPlay() {
        if (!hasValidSrc()) return Promise.resolve();
        try {
            var result = audio.play();
            if (result && typeof result.then === "function") {
                return result.catch(function () {});
            }
        } catch (err) {}
        return Promise.resolve();
    }

    /** When guest has turned music off via the control, do not auto-restart on random taps. */
    var userTurnedMusicOff = false;

    function tryPlayAuto() {
        if (userTurnedMusicOff) return;
        attemptPlay();
    }

    var audioToggleBtn = null;

    function syncAudioToggle() {
        if (!audioToggleBtn) return;
        var playing = !audio.paused;
        audioToggleBtn.classList.toggle("wedding-audio-toggle--off", !playing);
        audioToggleBtn.setAttribute("aria-pressed", playing ? "true" : "false");
        audioToggleBtn.setAttribute("aria-label", playing ? "關閉背景音樂" : "開啟背景音樂");
    }

    function installAudioToggle() {
        if (audioToggleBtn || !hasValidSrc()) return;
        audioToggleBtn = document.createElement("button");
        audioToggleBtn.type = "button";
        audioToggleBtn.className = "wedding-audio-toggle";
        audioToggleBtn.setAttribute("lang", "zh-Hant");
        audioToggleBtn.innerHTML =
            '<svg class="wedding-audio-toggle__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">' +
            '<path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />' +
            "</svg>" +
            '<span class="wedding-audio-toggle__sr">背景音樂</span>';
        audioToggleBtn.setAttribute("aria-pressed", "false");
        audioToggleBtn.setAttribute("aria-label", "開啟背景音樂");
        var lastMusicToggleAt = 0;
        function handleMusicToggle(ev) {
            ev.stopPropagation();
            var now = Date.now();
            if (now - lastMusicToggleAt < 320) return;
            lastMusicToggleAt = now;
            if (audio.paused) {
                userTurnedMusicOff = false;
                Promise.resolve(attemptPlay()).finally(syncAudioToggle);
            } else {
                userTurnedMusicOff = true;
                audio.pause();
                syncAudioToggle();
            }
        }
        audioToggleBtn.addEventListener("click", handleMusicToggle);
        audioToggleBtn.addEventListener(
            "touchend",
            function (ev) {
                if (!audioToggleBtn.contains(ev.target)) return;
                ev.stopPropagation();
                if (ev.cancelable) ev.preventDefault();
                handleMusicToggle(ev);
            },
            { passive: false }
        );
        audio.addEventListener("play", syncAudioToggle);
        audio.addEventListener("pause", syncAudioToggle);
        document.body.appendChild(audioToggleBtn);
        syncAudioToggle();
        installMusicHint();
    }

    var weddingMusicHintKey = "weddingAudioHintDismissed";

    function installMusicHint() {
        if (!hasValidSrc()) return;
        try {
            if (window.localStorage && window.localStorage.getItem(weddingMusicHintKey)) return;
        } catch (eLS) {}

        var hintRoot = null;
        var onKeyDown = null;

        function closeMusicHint() {
            if (onKeyDown) {
                document.removeEventListener("keydown", onKeyDown);
                onKeyDown = null;
            }
            try {
                if (window.localStorage) window.localStorage.setItem(weddingMusicHintKey, "1");
            } catch (eLS2) {}
            if (hintRoot && hintRoot.parentNode) {
                hintRoot.parentNode.removeChild(hintRoot);
            }
            hintRoot = null;
            document.body.style.overflow = "";
            var psUnlock = document.querySelector(".page-scroll");
            if (psUnlock) psUnlock.style.overflow = "";
        }

        function openMusicHint() {
            if (hintRoot) return;
            hintRoot = document.createElement("div");
            hintRoot.className = "wedding-audio-hint";
            hintRoot.setAttribute("role", "dialog");
            hintRoot.setAttribute("aria-modal", "true");
            hintRoot.setAttribute("aria-labelledby", "wedding-audio-hint-title");
            hintRoot.setAttribute("lang", "zh-Hant");

            var box = document.createElement("div");
            box.className = "wedding-audio-hint__box";

            var p = document.createElement("p");
            p.id = "wedding-audio-hint-title";
            p.className = "wedding-audio-hint__text";
            p.textContent =
                "本頁會播放背景音樂。若想關閉，請點選畫面右下角的音樂按鈕。";

            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wedding-audio-hint__btn";
            btn.textContent = "知道了";

            box.appendChild(p);
            box.appendChild(btn);
            hintRoot.appendChild(box);

            btn.addEventListener("click", closeMusicHint);
            hintRoot.addEventListener("click", function (ev) {
                if (ev.target === hintRoot) closeMusicHint();
            });

            onKeyDown = function (ev) {
                if (ev.key === "Escape") closeMusicHint();
            };
            document.addEventListener("keydown", onKeyDown);

            document.body.style.overflow = "hidden";
            var psLock = document.querySelector(".page-scroll");
            if (psLock) psLock.style.overflow = "hidden";
            document.body.appendChild(hintRoot);
            try {
                btn.focus();
            } catch (eF) {}
        }

        window.setTimeout(openMusicHint, 450);
    }

    function init() {
        installAudioToggle();
        audio.addEventListener(
            "canplay",
            function () {
                tryPlayAuto();
            },
            { once: true }
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", tryPlayAuto);
    } else {
        tryPlayAuto();
    }

    document.addEventListener("click", tryPlayAuto);
    document.addEventListener("touchend", tryPlayAuto, { passive: true });
    window.addEventListener("load", tryPlayAuto, { once: true });
})();