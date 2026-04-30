function JumpTo(id) {
    var jumpto = document.getElementById(id);
    if (!jumpto) return;
    jumpto.scrollIntoView({ block: 'start' , behavior: 'smooth' });
}

/* Pixels from bottom of viewport — element is “revealed” when its top crosses above this line (shared with revealSecondBg) */
var WEDDING_SCROLL_REVEAL_INSET = 150;

//
function reveal(){
    var reveals = document.querySelectorAll(".countdown-area-box>div,#photo-gallery,.dresscode-box,.intro-box,.intro-content,.time,.invite h2,.invite p")
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
window.addEventListener("scroll",reveal)

//
function setBgOpacity(el, opacity) {
    if (!el) return;
    el.style.opacity = opacity ? "1" : "0";
}

/* Once the invite title has triggered the blurred second bg, keep it for the rest of the page until we return to the hero */
var weddingSecondBgLocked = false;

/* Second hero image: when “we’re getting married” (#invite-heading) shows — same rule as reveal() for .invite h2 (elementVisible 150) */
function revealSecondBg(){
    var el = document.getElementById("secondbg");
    var home = document.getElementById("homebg");
    if (!el) return;
    var heading = document.getElementById("invite-heading");
    if (!heading) return;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    if (scrollY < 80) {
        weddingSecondBgLocked = false;
    } else {
        var windowHeight = window.innerHeight;
        var elementTop = heading.getBoundingClientRect().top;
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
window.addEventListener("scroll", revealSecondBg);
window.addEventListener("resize", revealSecondBg);


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

revealSecondBg();

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

(function weddingAudioAutoplay() {
    function tryPlay() {
        var audio = document.querySelector("audio");
        if (!audio) return;
        var result = audio.play();
        if (result && typeof result.catch === "function") {
            result.catch(function () {});
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", tryPlay);
    } else {
        tryPlay();
    }

    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("touchend", tryPlay, { once: true, passive: true });
})();