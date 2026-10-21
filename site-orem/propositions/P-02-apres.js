    // Préchargement à l'intention : la page d'une carte est chargée au survol, au focus ou au toucher
    (function () {
      var vus = {};
      var warm = function (e) {
        var a = e.target.closest && e.target.closest(CONFIG.trigger);
        var h = a && a.getAttribute('href');
        if (h && !vus[h]) { vus[h] = 1; fetchContent(h).catch(function () { vus[h] = 0; }); }
      };
      ['pointerover', 'focusin', 'touchstart'].forEach(function (t) { document.addEventListener(t, warm, { passive: true }); });
    })();