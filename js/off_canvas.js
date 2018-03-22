      /*
       * Open the filter-options menu when the menu icon is clicked.
       */
      var menu = document.querySelector('#menu');
      var main = document.querySelector('main');
      var filterOp = document.querySelector('.filter-options');

      menu.addEventListener('click', function(e) {
        filterOp.classList.toggle('open');
        e.stopPropagation();
      });
      main.addEventListener('click', function() {
        filterOp.classList.remove('open');
      });
