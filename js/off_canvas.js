      /*
       * Open the filter-options menu when the menu icon is clicked.
       */
      var menu = document.querySelector('#menu');
      var main = document.querySelector('main');
      var filterOp = document.querySelector('.filter-options');

      menu.addEventListener('click', function(e) {
        //set aria-expanded state
        if(menu.getAttribute("aria-expanded")=="true"){
          menu.setAttribute("aria-expanded", "false");
        }else{
          menu.setAttribute("aria-expanded", "true");
        }

        filterOp.classList.toggle('open');
        e.stopPropagation();
      });
      main.addEventListener('click', function() {
        menu.setAttribute("aria-expanded", "false");
        filterOp.classList.remove('open');
      });
