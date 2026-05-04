/** English UI when the document root declares English (e.g. <html lang="en"> or in-place form toggle). */
function weddingUiIsEnglish() {
    var lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    return lang === "en" || lang.indexOf("en-") === 0;
}

function JumpTo(id) {
    var jumpto = document.getElementById(id);
    if (!jumpto) return;
    jumpto.scrollIntoView({ block: "start", behavior: "smooth" });
}

/** Form + home: zh/en in one URL — toggle document language + persist choice (localStorage weddingFormLocale). */
(function weddingFormLangInPlace() {
    var nav = document.querySelector(".form-lang-switch");
    if (!nav || !nav.querySelector("[data-form-lang]")) return;

    var STORAGE_KEY = "weddingFormLocale";

    function docIsEnglish() {
        var lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
        return lang === "en" || lang.indexOf("en-") === 0;
    }

    function getDocTitle() {
        var root = document.documentElement;
        return docIsEnglish()
            ? root.getAttribute("data-doc-title-en") || document.title
            : root.getAttribute("data-doc-title-zh") || document.title;
    }

    function applyMapLocale() {
        var map = window.WEDDING_FORM_MAP || {};
        var iframe = document.getElementById("form-map-iframe");
        if (!iframe) return;
        var pack = docIsEnglish() ? map.en : map.zh;
        if (!pack || !pack.src) return;
        if (iframe.getAttribute("src") !== pack.src) iframe.setAttribute("src", pack.src);
        iframe.setAttribute("title", pack.title || "");
    }

    function applyHeaderScrollLabel() {
        var a = document.getElementById("form-header-scroll");
        if (!a) return;
        a.setAttribute("aria-label", docIsEnglish() ? "Scroll to content below" : "捲動至下方內容");
    }

    function applyRsvpIframeTitle() {
        var iframe = document.getElementById("rsvp-google-form");
        if (!iframe) return;
        iframe.setAttribute("title", docIsEnglish() ? "Wedding RSVP form" : "婚禮 RSVP 表單");
    }

    /** Home page: album aria-labels + hint copy follow locale (no duplicate DOM for a11y). */
    function applyHomeAlbumAria() {
        if (!document.body.classList.contains("page-home")) return;
        var en = docIsEnglish();
        var gallery = document.getElementById("photo-gallery");
        if (gallery) gallery.setAttribute("aria-label", en ? "Wedding album" : "婚禮相簿");
        var stackOpen = document.getElementById("album-stack-open");
        if (stackOpen) stackOpen.setAttribute("aria-label", en ? "Open full-screen gallery" : "開啟相簿大圖");
        var hint = document.querySelector(".album-stack__hint");
        if (hint) hint.textContent = en ? "Tap for full screen · swipe to browse" : "點擊看大圖 · 左右滑換圖";
        var lb = document.getElementById("album-lightbox");
        if (lb) lb.setAttribute("aria-label", en ? "Full-screen photo" : "相片全螢幕檢視");
        var closeBtn = document.querySelector("#album-lightbox .album-lightbox__close");
        if (closeBtn) closeBtn.setAttribute("aria-label", en ? "Close" : "關閉");
        var prev = document.getElementById("album-lb-prev");
        if (prev) prev.setAttribute("aria-label", en ? "Previous" : "上一張");
        var next = document.getElementById("album-lb-next");
        if (next) next.setAttribute("aria-label", en ? "Next" : "下一張");
    }

    function syncButtons() {
        var isEn = docIsEnglish();
        var buttons = nav.querySelectorAll(".form-lang-switch__btn[data-form-lang]");
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var on = (btn.getAttribute("data-form-lang") === "en") === isEn;
            btn.setAttribute("aria-pressed", on ? "true" : "false");
        }
    }

    /** Toggle [data-form-lang] blocks (CSS backup is in panels.css; hidden is authoritative after JS runs). */
    function applyFormLocaleVisibility() {
        var isEn = docIsEnglish();
        var els = document.querySelectorAll("[data-form-lang]");
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.classList.contains("form-lang-switch__btn")) continue;
            if (el.classList.contains("rsvp-embed-placeholder")) continue;
            var lg = el.getAttribute("data-form-lang");
            if (lg === "zh") el.hidden = isEn;
            else if (lg === "en") el.hidden = !isEn;
        }
        syncRsvpPlaceholderLocale();
    }

    /** When RSVP iframe is not embedded, show only the hint for the active language. */
    function syncRsvpPlaceholderLocale() {
        var iframe = document.getElementById("rsvp-google-form");
        if (!iframe || !iframe.hasAttribute("hidden")) return;
        var isEn = docIsEnglish();
        var hints = document.querySelectorAll("#RSVParea .rsvp-embed-placeholder[data-form-lang]");
        for (var j = 0; j < hints.length; j++) {
            var h = hints[j];
            var lg = h.getAttribute("data-form-lang");
            if (lg === "zh") h.hidden = isEn;
            else if (lg === "en") h.hidden = !isEn;
        }
    }

    function announceLocaleToDom() {
        applyFormLocaleVisibility();
        document.title = getDocTitle();
        applyMapLocale();
        applyHeaderScrollLabel();
        applyRsvpIframeTitle();
        applyHomeAlbumAria();
        syncButtons();
        try {
            document.dispatchEvent(new CustomEvent("wedding:locale"));
        } catch (e0) {}
    }

    function setLocale(lang) {
        var isEn = lang === "en";
        document.documentElement.lang = isEn ? "en" : "zh-Hant";
        try {
            localStorage.setItem(STORAGE_KEY, isEn ? "en" : "zh");
        } catch (e1) {}
        announceLocaleToDom();
    }

    nav.addEventListener("click", function (ev) {
        var btn = ev.target.closest(".form-lang-switch__btn[data-form-lang]");
        if (!btn || !nav.contains(btn)) return;
        var lang = btn.getAttribute("data-form-lang");
        if (lang === "zh") setLocale("zh");
        else if (lang === "en") setLocale("en");
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", announceLocaleToDom);
    } else {
        announceLocaleToDom();
    }
})();

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

/** Vertical scroll lives on `.page-scroll`; not on window */
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

/* Pixels from bottom of viewport — element is “revealed” when its top crosses above this line (shared with revealSecondBg) */
var WEDDING_SCROLL_REVEAL_INSET = 150;

//
function reveal(){
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
    if (weddingUiIsEnglish()) {
      elCountdown.innerHTML =
        "Wedding in " +
        days +
        " days, " +
        hours +
        " hours, " +
        minutes +
        " minutes, " +
        seconds +
        " seconds<br>We can't wait to celebrate with you!";
    } else {
      elCountdown.innerHTML =
        "距離婚禮還剩 " +
        days +
        " 天<br>" +
        hours +
        " 小時 " +
        minutes +
        " 分鐘 " +
        seconds +
        " 秒<br>讓我們一起期待吧！";
    }
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
        alts.push(srcNodes[s].getAttribute("alt") || (weddingUiIsEnglish() ? "Wedding photo" : "婚禮相片"));
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

    document.addEventListener("wedding:locale", function () {
        if (!audioToggleBtn) return;
        audioToggleBtn.setAttribute("lang", weddingUiIsEnglish() ? "en" : "zh-Hant");
        var sr = audioToggleBtn.querySelector(".wedding-audio-toggle__sr");
        if (sr) sr.textContent = weddingUiIsEnglish() ? "Background music" : "背景音樂";
        syncAudioToggle();
    });

    function syncAudioToggle() {
        if (!audioToggleBtn) return;
        var playing = !audio.paused;
        audioToggleBtn.classList.toggle("wedding-audio-toggle--off", !playing);
        audioToggleBtn.setAttribute("aria-pressed", playing ? "true" : "false");
        audioToggleBtn.setAttribute(
            "aria-label",
            playing
                ? weddingUiIsEnglish()
                    ? "Turn off background music"
                    : "關閉背景音樂"
                : weddingUiIsEnglish()
                  ? "Turn on background music"
                  : "開啟背景音樂"
        );
    }

    function installAudioToggle() {
        if (audioToggleBtn || !hasValidSrc()) return;
        audioToggleBtn = document.createElement("button");
        audioToggleBtn.type = "button";
        audioToggleBtn.className = "wedding-audio-toggle";
        audioToggleBtn.setAttribute("lang", weddingUiIsEnglish() ? "en" : "zh-Hant");
        audioToggleBtn.innerHTML =
            '<svg class="wedding-audio-toggle__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">' +
            '<path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />' +
            "</svg>" +
            '<span class="wedding-audio-toggle__sr">' +
            (weddingUiIsEnglish() ? "Background music" : "背景音樂") +
            "</span>";
        audioToggleBtn.setAttribute("aria-pressed", "false");
        audioToggleBtn.setAttribute(
            "aria-label",
            weddingUiIsEnglish() ? "Turn on background music" : "開啟背景音樂"
        );
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
            hintRoot.setAttribute("lang", weddingUiIsEnglish() ? "en" : "zh-Hant");

            var box = document.createElement("div");
            box.className = "wedding-audio-hint__box";

            var p1 = document.createElement("p");
            p1.id = "wedding-audio-hint-title";
            p1.className = "wedding-audio-hint__text";
            p1.textContent = weddingUiIsEnglish()
                ? "This page plays background music."
                : "本頁會播放背景音樂。";

            var p2 = document.createElement("p");
            p2.className = "wedding-audio-hint__text wedding-audio-hint__text--note";
            p2.textContent = weddingUiIsEnglish()
                ? "* To turn it off, tap the icon in the lower-right corner."
                : "* 若要關閉音樂，請點選右下角的圖示即可。";

            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wedding-audio-hint__btn";
            btn.textContent = weddingUiIsEnglish() ? "Got it" : "知道了";

            box.appendChild(p1);
            box.appendChild(p2);
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