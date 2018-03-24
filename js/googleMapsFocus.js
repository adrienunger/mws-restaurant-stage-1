setTimeout( () => {},5000);
  removeTabfocusFromMap = () => {
    window.onload = () =>{
      const gmap = document.querySelector('#map');
      gmapDesc = gmap.querySelectorAll('*');
      gmapDesc.forEach( (desc) =>{
        desc.setAttribute("tabindex", "-1");
      }, this);
    }
  }
  document.getElementById("map").onload = removeTabfocusFromMap();

  window.onload = () =>{
    const iframe = document.querySelector('iframe');
    iframe.title = "Google Maps";
  }
