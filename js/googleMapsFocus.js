setTimeout(function(){},5000);
  removeTabfocusFromMap = () => {
    window.onload = function () {
      const gmap = document.querySelector('#map');
      gmapDesc = gmap.querySelectorAll('*');
      gmapDesc.forEach(function(desc) {
        desc.setAttribute("tabindex", "-1");
      }, this);
    }
  }
  document.getElementById("map").onload = removeTabfocusFromMap();

  window.onload = function () {
    const iframe = document.querySelector('iframe');
    iframe.title = "Google Maps";
  }
