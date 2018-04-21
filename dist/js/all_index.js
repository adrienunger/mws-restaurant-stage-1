/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  /*static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        console.log(json);
        console.log(typeof json);
        const restaurants = json;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }*/

  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL).then(response => response.json()).then(json => {
      const restaurants = json;
      callback(null, restaurants);
    }).catch(e => {
      const error = `Request failed. Returned status of ${e}`;
      console.log(error);
      callback(error, null);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP });
    return marker;
  }

}
let restaurants, neighborhoods, cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("srcset", `/img_resp/${restaurant.id}-300.jpg 1x, /img_resp/${restaurant.id}-600.jpg 2x`);
  image.setAttribute("alt", restaurant.alt);
  li.append(image);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute("class", "rest-neighborhood");
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute("class", "rest-address");
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute("aria-label", `View details for the restaurant ${restaurant.name}`);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
/*
 * Open the filter-options menu when the menu icon is clicked.
 */
var menu = document.querySelector('#menu');
var main = document.querySelector('main');
var filterOp = document.querySelector('.filter-options');

menu.addEventListener('click', e => {
  //set aria-expanded state
  if (menu.getAttribute("aria-expanded") == "true") {
    menu.setAttribute("aria-expanded", "false");
  } else {
    menu.setAttribute("aria-expanded", "true");
  }

  filterOp.classList.toggle('open');
  e.stopPropagation();
});
main.addEventListener('click', () => {
  menu.setAttribute("aria-expanded", "false");
  filterOp.classList.remove('open');
});
var _this = this;

setTimeout(() => {}, 5000);
removeTabfocusFromMap = () => {
  window.onload = () => {
    const gmap = document.querySelector('#map');
    gmapDesc = gmap.querySelectorAll('*');
    gmapDesc.forEach(desc => {
      desc.setAttribute("tabindex", "-1");
    }, _this);
  };
};
document.getElementById("map").onload = removeTabfocusFromMap();

window.onload = () => {
  const iframe = document.querySelector('iframe');
  iframe.title = "Google Maps";
};

/**
 * Register a serviceWorker
 */
registerServiceWorker = () => {
  //check if serviceWorker is supported, otherwise return
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js').catch(function () {
    console.log("Something went wrong. ServiceWorker not registered");
  });
};

registerServiceWorker();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwibWFpbi5qcyIsIm9mZl9jYW52YXMuanMiLCJnb29nbGVNYXBzRm9jdXMuanMiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIuanMiXSwibmFtZXMiOlsiREJIZWxwZXIiLCJEQVRBQkFTRV9VUkwiLCJwb3J0IiwiZmV0Y2hSZXN0YXVyYW50cyIsImNhbGxiYWNrIiwiZmV0Y2giLCJ0aGVuIiwicmVzcG9uc2UiLCJqc29uIiwicmVzdGF1cmFudHMiLCJjYXRjaCIsImUiLCJlcnJvciIsImNvbnNvbGUiLCJsb2ciLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiaWQiLCJyZXN0YXVyYW50IiwiZmluZCIsInIiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUiLCJjdWlzaW5lIiwicmVzdWx0cyIsImZpbHRlciIsImN1aXNpbmVfdHlwZSIsImZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kIiwibmVpZ2hib3Job29kIiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kIiwiZmV0Y2hOZWlnaGJvcmhvb2RzIiwibmVpZ2hib3Job29kcyIsIm1hcCIsInYiLCJpIiwidW5pcXVlTmVpZ2hib3Job29kcyIsImluZGV4T2YiLCJmZXRjaEN1aXNpbmVzIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsInVybEZvclJlc3RhdXJhbnQiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJwaG90b2dyYXBoIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm1hcmtlciIsImdvb2dsZSIsIm1hcHMiLCJNYXJrZXIiLCJwb3NpdGlvbiIsImxhdGxuZyIsInRpdGxlIiwibmFtZSIsInVybCIsImFuaW1hdGlvbiIsIkFuaW1hdGlvbiIsIkRST1AiLCJtYXJrZXJzIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJzZWxmIiwiZmlsbE5laWdoYm9yaG9vZHNIVE1MIiwic2VsZWN0IiwiZ2V0RWxlbWVudEJ5SWQiLCJmb3JFYWNoIiwib3B0aW9uIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsInZhbHVlIiwiYXBwZW5kIiwiZmlsbEN1aXNpbmVzSFRNTCIsIndpbmRvdyIsImluaXRNYXAiLCJsb2MiLCJsYXQiLCJsbmciLCJNYXAiLCJ6b29tIiwiY2VudGVyIiwic2Nyb2xsd2hlZWwiLCJ1cGRhdGVSZXN0YXVyYW50cyIsImNTZWxlY3QiLCJuU2VsZWN0IiwiY0luZGV4Iiwic2VsZWN0ZWRJbmRleCIsIm5JbmRleCIsInJlc2V0UmVzdGF1cmFudHMiLCJmaWxsUmVzdGF1cmFudHNIVE1MIiwidWwiLCJtIiwic2V0TWFwIiwiY3JlYXRlUmVzdGF1cmFudEhUTUwiLCJhZGRNYXJrZXJzVG9NYXAiLCJsaSIsImltYWdlIiwiY2xhc3NOYW1lIiwic3JjIiwic2V0QXR0cmlidXRlIiwiYWx0IiwiYWRkcmVzcyIsIm1vcmUiLCJocmVmIiwiYWRkTGlzdGVuZXIiLCJsb2NhdGlvbiIsInB1c2giLCJtZW51IiwicXVlcnlTZWxlY3RvciIsIm1haW4iLCJmaWx0ZXJPcCIsImdldEF0dHJpYnV0ZSIsImNsYXNzTGlzdCIsInRvZ2dsZSIsInN0b3BQcm9wYWdhdGlvbiIsInJlbW92ZSIsInNldFRpbWVvdXQiLCJyZW1vdmVUYWJmb2N1c0Zyb21NYXAiLCJvbmxvYWQiLCJnbWFwIiwiZ21hcERlc2MiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZGVzYyIsImlmcmFtZSIsInJlZ2lzdGVyU2VydmljZVdvcmtlciIsIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciJdLCJtYXBwaW5ncyI6IkFBQUE7OztBQUdBLE1BQU1BLFFBQU4sQ0FBZTs7QUFFYjs7OztBQUlBLGFBQVdDLFlBQVgsR0FBMEI7QUFDeEIsVUFBTUMsT0FBTyxJQUFiLENBRHdCLENBQ047QUFDbEIsV0FBUSxvQkFBbUJBLElBQUssY0FBaEM7QUFDRDs7QUFFRDs7O0FBR0E7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxTQUFPQyxnQkFBUCxDQUF3QkMsUUFB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OztBQUU5QkQsWUFBVUMsYUFBVixDQUF3QkMsUUFBeEIsQ0FBaUMsUUFBakMsRUFBMkNqSCxLQUEzQyxDQUFpRCxZQUFVO0FBQ3pERyxZQUFRQyxHQUFSLENBQVksb0RBQVo7QUFDRCxHQUZEO0FBR0QsQ0FQSDs7QUFTRTBHIiwiZmlsZSI6ImFsbF9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cclxuICovXHJcbmNsYXNzIERCSGVscGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRGF0YWJhc2UgVVJMLlxyXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcclxuICAgIGNvbnN0IHBvcnQgPSAxMzM3IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcclxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L3Jlc3RhdXJhbnRzYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCByZXN0YXVyYW50cy5cclxuICAgKi9cclxuICAvKnN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICB4aHIub3BlbignR0VUJywgREJIZWxwZXIuREFUQUJBU0VfVVJMKTtcclxuICAgIHhoci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHsgLy8gR290IGEgc3VjY2VzcyByZXNwb25zZSBmcm9tIHNlcnZlciFcclxuICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhqc29uKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0eXBlb2YganNvbik7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudHMgPSBqc29uO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKTtcclxuICAgICAgfSBlbHNlIHsgLy8gT29wcyEuIEdvdCBhbiBlcnJvciBmcm9tIHNlcnZlci5cclxuICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3hoci5zdGF0dXN9YCk7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgeGhyLnNlbmQoKTtcclxuICB9Ki9cclxuXHJcblxyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBmZXRjaChEQkhlbHBlci5EQVRBQkFTRV9VUkwpXHJcbiAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXHJcbiAgICAudGhlbihqc29uID0+e1xyXG4gICAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb247XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZSA9PntcclxuICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtlfWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgIH0pO1xyXG4gXHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIGZldGNoIGFsbCByZXN0YXVyYW50cyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudCA9IHJlc3RhdXJhbnRzLmZpbmQociA9PiByLmlkID09IGlkKTtcclxuICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcclxuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICAgICAgICBjYWxsYmFjaygnUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCcsIG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lKGN1aXNpbmUsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZChuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHNcclxuICAgICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxyXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZWlnaGJvcmhvb2QgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IG5laWdoYm9yaG9vZFxyXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoTmVpZ2hib3Job29kcyhjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCBhbGwgbmVpZ2hib3Job29kcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZClcclxuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIG5laWdoYm9yaG9vZHNcclxuICAgICAgICBjb25zdCB1bmlxdWVOZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcy5maWx0ZXIoKHYsIGkpID0+IG5laWdoYm9yaG9vZHMuaW5kZXhPZih2KSA9PSBpKVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBjdWlzaW5lcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hDdWlzaW5lcyhjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKVxyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcclxuICAgICAgICBjb25zdCB1bmlxdWVDdWlzaW5lcyA9IGN1aXNpbmVzLmZpbHRlcigodiwgaSkgPT4gY3Vpc2luZXMuaW5kZXhPZih2KSA9PSBpKVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZUN1aXNpbmVzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXN0YXVyYW50IHBhZ2UgVVJMLlxyXG4gICAqL1xyXG4gIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgIHJldHVybiAoYC4vcmVzdGF1cmFudC5odG1sP2lkPSR7cmVzdGF1cmFudC5pZH1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgVVJMLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgL2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cclxuICAgKi9cclxuICBzdGF0aWMgbWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBtYXApIHtcclxuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xyXG4gICAgICBwb3NpdGlvbjogcmVzdGF1cmFudC5sYXRsbmcsXHJcbiAgICAgIHRpdGxlOiByZXN0YXVyYW50Lm5hbWUsXHJcbiAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcclxuICAgICAgbWFwOiBtYXAsXHJcbiAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1B9XHJcbiAgICApO1xyXG4gICAgcmV0dXJuIG1hcmtlcjtcclxuICB9XHJcblxyXG59XHJcbiIsImxldCByZXN0YXVyYW50cyxcclxuICBuZWlnaGJvcmhvb2RzLFxyXG4gIGN1aXNpbmVzXHJcbnZhciBtYXBcclxudmFyIG1hcmtlcnMgPSBbXVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBuZWlnaGJvcmhvb2RzIGFuZCBjdWlzaW5lcyBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cclxuICovXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcclxuICBmZXRjaE5laWdoYm9yaG9vZHMoKTtcclxuICBmZXRjaEN1aXNpbmVzKCk7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIGFuZCBzZXQgdGhlaXIgSFRNTC5cclxuICovXHJcbmZldGNoTmVpZ2hib3Job29kcyA9ICgpID0+IHtcclxuICBEQkhlbHBlci5mZXRjaE5laWdoYm9yaG9vZHMoKGVycm9yLCBuZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsZi5uZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcztcclxuICAgICAgZmlsbE5laWdoYm9yaG9vZHNIVE1MKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgbmVpZ2hib3Job29kcyBIVE1MLlxyXG4gKi9cclxuZmlsbE5laWdoYm9yaG9vZHNIVE1MID0gKG5laWdoYm9yaG9vZHMgPSBzZWxmLm5laWdoYm9yaG9vZHMpID0+IHtcclxuICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcclxuICBuZWlnaGJvcmhvb2RzLmZvckVhY2gobmVpZ2hib3Job29kID0+IHtcclxuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLmlubmVySFRNTCA9IG5laWdoYm9yaG9vZDtcclxuICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcclxuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBjdWlzaW5lcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5mZXRjaEN1aXNpbmVzID0gKCkgPT4ge1xyXG4gIERCSGVscGVyLmZldGNoQ3Vpc2luZXMoKGVycm9yLCBjdWlzaW5lcykgPT4ge1xyXG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxmLmN1aXNpbmVzID0gY3Vpc2luZXM7XHJcbiAgICAgIGZpbGxDdWlzaW5lc0hUTUwoKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBjdWlzaW5lcyBIVE1MLlxyXG4gKi9cclxuZmlsbEN1aXNpbmVzSFRNTCA9IChjdWlzaW5lcyA9IHNlbGYuY3Vpc2luZXMpID0+IHtcclxuICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcblxyXG4gIGN1aXNpbmVzLmZvckVhY2goY3Vpc2luZSA9PiB7XHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBjdWlzaW5lO1xyXG4gICAgb3B0aW9uLnZhbHVlID0gY3Vpc2luZTtcclxuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgR29vZ2xlIG1hcCwgY2FsbGVkIGZyb20gSFRNTC5cclxuICovXHJcbndpbmRvdy5pbml0TWFwID0gKCkgPT4ge1xyXG4gIGxldCBsb2MgPSB7XHJcbiAgICBsYXQ6IDQwLjcyMjIxNixcclxuICAgIGxuZzogLTczLjk4NzUwMVxyXG4gIH07XHJcbiAgc2VsZi5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKSwge1xyXG4gICAgem9vbTogMTIsXHJcbiAgICBjZW50ZXI6IGxvYyxcclxuICAgIHNjcm9sbHdoZWVsOiBmYWxzZVxyXG4gIH0pO1xyXG4gIHVwZGF0ZVJlc3RhdXJhbnRzKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgcGFnZSBhbmQgbWFwIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzLlxyXG4gKi9cclxudXBkYXRlUmVzdGF1cmFudHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY1NlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcclxuICBjb25zdCBuU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcblxyXG4gIGNvbnN0IGNJbmRleCA9IGNTZWxlY3Quc2VsZWN0ZWRJbmRleDtcclxuICBjb25zdCBuSW5kZXggPSBuU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gIGNvbnN0IGN1aXNpbmUgPSBjU2VsZWN0W2NJbmRleF0udmFsdWU7XHJcbiAgY29uc3QgbmVpZ2hib3Job29kID0gblNlbGVjdFtuSW5kZXhdLnZhbHVlO1xyXG5cclxuICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCAoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlc2V0UmVzdGF1cmFudHMocmVzdGF1cmFudHMpO1xyXG4gICAgICBmaWxsUmVzdGF1cmFudHNIVE1MKCk7XHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG5cclxuLyoqXHJcbiAqIENsZWFyIGN1cnJlbnQgcmVzdGF1cmFudHMsIHRoZWlyIEhUTUwgYW5kIHJlbW92ZSB0aGVpciBtYXAgbWFya2Vycy5cclxuICovXHJcbnJlc2V0UmVzdGF1cmFudHMgPSAocmVzdGF1cmFudHMpID0+IHtcclxuICAvLyBSZW1vdmUgYWxsIHJlc3RhdXJhbnRzXHJcbiAgc2VsZi5yZXN0YXVyYW50cyA9IFtdO1xyXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICB1bC5pbm5lckhUTUwgPSAnJztcclxuXHJcbiAgLy8gUmVtb3ZlIGFsbCBtYXAgbWFya2Vyc1xyXG4gIHNlbGYubWFya2Vycy5mb3JFYWNoKG0gPT4gbS5zZXRNYXAobnVsbCkpO1xyXG4gIHNlbGYubWFya2VycyA9IFtdO1xyXG4gIHNlbGYucmVzdGF1cmFudHMgPSByZXN0YXVyYW50cztcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbGwgcmVzdGF1cmFudHMgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5maWxsUmVzdGF1cmFudHNIVE1MID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgdWwuYXBwZW5kKGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpKTtcclxuICB9KTtcclxuICBhZGRNYXJrZXJzVG9NYXAoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwuXHJcbiAqL1xyXG5jcmVhdGVSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50KSA9PiB7XHJcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcclxuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICBsaS5hcHBlbmQobmFtZSk7XHJcblxyXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJztcclxuICBpbWFnZS5zcmMgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgaW1hZ2Uuc2V0QXR0cmlidXRlKFwic3Jjc2V0XCIsIGAvaW1nX3Jlc3AvJHtyZXN0YXVyYW50LmlkfS0zMDAuanBnIDF4LCAvaW1nX3Jlc3AvJHtyZXN0YXVyYW50LmlkfS02MDAuanBnIDJ4YCk7XHJcbiAgaW1hZ2Uuc2V0QXR0cmlidXRlKFwiYWx0XCIsIHJlc3RhdXJhbnQuYWx0KTtcclxuICBsaS5hcHBlbmQoaW1hZ2UpO1xyXG5cclxuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgbmVpZ2hib3Job29kLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmVpZ2hib3Job29kO1xyXG4gIG5laWdoYm9yaG9vZC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInJlc3QtbmVpZ2hib3Job29kXCIpO1xyXG4gIGxpLmFwcGVuZChuZWlnaGJvcmhvb2QpO1xyXG5cclxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gIGFkZHJlc3Muc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJyZXN0LWFkZHJlc3NcIik7XHJcbiAgbGkuYXBwZW5kKGFkZHJlc3MpO1xyXG5cclxuICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gIG1vcmUuaW5uZXJIVE1MID0gJ1ZpZXcgRGV0YWlscyc7XHJcbiAgbW9yZS5ocmVmID0gREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICBtb3JlLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgYFZpZXcgZGV0YWlscyBmb3IgdGhlIHJlc3RhdXJhbnQgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XHJcbiAgbGkuYXBwZW5kKG1vcmUpXHJcblxyXG4gIHJldHVybiBsaVxyXG59XHJcblxyXG4vKipcclxuICogQWRkIG1hcmtlcnMgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMgdG8gdGhlIG1hcC5cclxuICovXHJcbmFkZE1hcmtlcnNUb01hcCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgLy8gQWRkIG1hcmtlciB0byB0aGUgbWFwXHJcbiAgICBjb25zdCBtYXJrZXIgPSBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHNlbGYubWFwKTtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci51cmxcclxuICAgIH0pO1xyXG4gICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICB9KTtcclxufVxyXG4iLCIgICAgICAvKlxyXG4gICAgICAgKiBPcGVuIHRoZSBmaWx0ZXItb3B0aW9ucyBtZW51IHdoZW4gdGhlIG1lbnUgaWNvbiBpcyBjbGlja2VkLlxyXG4gICAgICAgKi9cclxuICAgICAgdmFyIG1lbnUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVudScpO1xyXG4gICAgICB2YXIgbWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKTtcclxuICAgICAgdmFyIGZpbHRlck9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1vcHRpb25zJyk7XHJcblxyXG4gICAgICBtZW51LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgICAgICAvL3NldCBhcmlhLWV4cGFuZGVkIHN0YXRlXHJcbiAgICAgICAgaWYobWVudS5nZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIpPT1cInRydWVcIil7XHJcbiAgICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIG1lbnUuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaWx0ZXJPcC5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgfSk7XHJcbiAgICAgIG1haW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PntcclxuICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgICBmaWx0ZXJPcC5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7XHJcbiAgICAgIH0pO1xyXG4iLCJzZXRUaW1lb3V0KCAoKSA9PiB7fSw1MDAwKTtcclxuICByZW1vdmVUYWJmb2N1c0Zyb21NYXAgPSAoKSA9PiB7XHJcbiAgICB3aW5kb3cub25sb2FkID0gKCkgPT57XHJcbiAgICAgIGNvbnN0IGdtYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwJyk7XHJcbiAgICAgIGdtYXBEZXNjID0gZ21hcC5xdWVyeVNlbGVjdG9yQWxsKCcqJyk7XHJcbiAgICAgIGdtYXBEZXNjLmZvckVhY2goIChkZXNjKSA9PntcclxuICAgICAgICBkZXNjLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKS5vbmxvYWQgPSByZW1vdmVUYWJmb2N1c0Zyb21NYXAoKTtcclxuXHJcbiAgd2luZG93Lm9ubG9hZCA9ICgpID0+e1xyXG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XHJcbiAgICBpZnJhbWUudGl0bGUgPSBcIkdvb2dsZSBNYXBzXCI7XHJcbiAgfVxyXG4iLCJcclxuLyoqXHJcbiAqIFJlZ2lzdGVyIGEgc2VydmljZVdvcmtlclxyXG4gKi9cclxucmVnaXN0ZXJTZXJ2aWNlV29ya2VyID0gKCkgPT4ge1xyXG4gICAgLy9jaGVjayBpZiBzZXJ2aWNlV29ya2VyIGlzIHN1cHBvcnRlZCwgb3RoZXJ3aXNlIHJldHVyblxyXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xyXG4gIFxyXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zdy5qcycpLmNhdGNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIHdlbnQgd3JvbmcuIFNlcnZpY2VXb3JrZXIgbm90IHJlZ2lzdGVyZWRcIik7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIFxyXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpOyJdfQ==
