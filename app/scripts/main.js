'use strict';

$(document).ready(function() {

  // Injecting SVG-sprite
  var assetsPath = appPath;
  assetsPath = assetsPath || '';
  var svgPath = assetsPath + '/images/svg-defs.svg';
  $.get(svgPath, function (data) {
    var $icons = $('<div class="icons"></div>').html(new XMLSerializer().serializeToString(data.documentElement));
    $('body').prepend($icons);
  });
});
