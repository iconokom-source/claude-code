    // Préchargement : cache réchauffé au repos pour une ouverture instantanée
    (function () {
      var warm = function () {
        getProjectList().forEach(function (u) {
          fetchContent(u).catch(function () {});
        });
      };
      if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2000 });
      else
        window.addEventListener('load', function () {
          setTimeout(warm, 500);
        });
    })();