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
      storeRestaurantData(restaurants);
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
//import * as 'idb' from './lib/idb/lib/idb.js';

var dbPromise = idb.open('jsonResp', 1, function (upgradeDb) {
	upgradeDb.createObjectStore('restaurantData');
});

function storeRestaurantData(jsonData) {
	dbPromise.then(db => {
		var tx = db.transaction('restaurantData', 'readwrite');
		var restaurantDataStore = tx.objectStore('restaurantData');
		restaurantDataStore.put(jsonData, 'restaurants');
		return tx.complete;
	});
}

function getRestaurantData() {
	dbPromise.then(db => {
		var tx = db.transaction('restaurantData');
		var restaurantDataStore = tx.objectStore('restaurantData');
		return restaurantDataStore.get('restaurants');
	});
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwibWFpbi5qcyIsIm9mZl9jYW52YXMuanMiLCJnb29nbGVNYXBzRm9jdXMuanMiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIuanMiLCJpZGJEYXRhLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiREFUQUJBU0VfVVJMIiwicG9ydCIsImZldGNoUmVzdGF1cmFudHMiLCJjYWxsYmFjayIsImZldGNoIiwidGhlbiIsInJlc3BvbnNlIiwianNvbiIsInJlc3RhdXJhbnRzIiwic3RvcmVSZXN0YXVyYW50RGF0YSIsImNhdGNoIiwiZSIsImVycm9yIiwiY29uc29sZSIsImxvZyIsImZldGNoUmVzdGF1cmFudEJ5SWQiLCJpZCIsInJlc3RhdXJhbnQiLCJmaW5kIiwiciIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZSIsImN1aXNpbmUiLCJyZXN1bHRzIiwiZmlsdGVyIiwiY3Vpc2luZV90eXBlIiwiZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QiLCJuZWlnaGJvcmhvb2QiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJuZWlnaGJvcmhvb2RzIiwibWFwIiwidiIsImkiLCJ1bmlxdWVOZWlnaGJvcmhvb2RzIiwiaW5kZXhPZiIsImZldGNoQ3Vpc2luZXMiLCJjdWlzaW5lcyIsInVuaXF1ZUN1aXNpbmVzIiwidXJsRm9yUmVzdGF1cmFudCIsImltYWdlVXJsRm9yUmVzdGF1cmFudCIsInBob3RvZ3JhcGgiLCJtYXBNYXJrZXJGb3JSZXN0YXVyYW50IiwibWFya2VyIiwiZ29vZ2xlIiwibWFwcyIsIk1hcmtlciIsInBvc2l0aW9uIiwibGF0bG5nIiwidGl0bGUiLCJuYW1lIiwidXJsIiwiYW5pbWF0aW9uIiwiQW5pbWF0aW9uIiwiRFJPUCIsIm1hcmtlcnMiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsInNlbGYiLCJmaWxsTmVpZ2hib3Job29kc0hUTUwiLCJzZWxlY3QiLCJnZXRFbGVtZW50QnlJZCIsImZvckVhY2giLCJvcHRpb24iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwidmFsdWUiLCJhcHBlbmQiLCJmaWxsQ3Vpc2luZXNIVE1MIiwid2luZG93IiwiaW5pdE1hcCIsImxvYyIsImxhdCIsImxuZyIsIk1hcCIsInpvb20iLCJjZW50ZXIiLCJzY3JvbGx3aGVlbCIsInVwZGF0ZVJlc3RhdXJhbnRzIiwiY1NlbGVjdCIsIm5TZWxlY3QiLCJjSW5kZXgiLCJzZWxlY3RlZEluZGV4IiwibkluZGV4IiwicmVzZXRSZXN0YXVyYW50cyIsImZpbGxSZXN0YXVyYW50c0hUTUwiLCJ1bCIsIm0iLCJzZXRNYXAiLCJjcmVhdGVSZXN0YXVyYW50SFRNTCIsImFkZE1hcmtlcnNUb01hcCIsImxpIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJzcmMiLCJzZXRBdHRyaWJ1dGUiLCJhbHQiLCJhZGRyZXNzIiwibW9yZSIsImhyZWYiLCJhZGRMaXN0ZW5lciIsImxvY2F0aW9uIiwicHVzaCIsIm1lbnUiLCJxdWVyeVNlbGVjdG9yIiwibWFpbiIsImZpbHRlck9wIiwiZ2V0QXR0cmlidXRlIiwiY2xhc3NMaXN0IiwidG9nZ2xlIiwic3RvcFByb3BhZ2F0aW9uIiwicmVtb3ZlIiwic2V0VGltZW91dCIsInJlbW92ZVRhYmZvY3VzRnJvbU1hcCIsIm9ubG9hZCIsImdtYXAiLCJnbWFwRGVzYyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJkZXNjIiwiaWZyYW1lIiwicmVnaXN0ZXJTZXJ2aWNlV29ya2VyIiwibmF2aWdhdG9yIiwic2VydmljZVdvcmtlciIsInJlZ2lzdGVyIiwiZGJQcm9taXNlIiwiaWRiIiwib3BlbiIsInVwZ3JhZGVEYiIsImNyZWF0ZU9iamVjdFN0b3JlIiwianNvbkRhdGEiLCJkYiIsInR4IiwidHJhbnNhY3Rpb24iLCJyZXN0YXVyYW50RGF0YVN0b3JlIiwib2JqZWN0U3RvcmUiLCJwdXQiLCJjb21wbGV0ZSIsImdldFJlc3RhdXJhbnREYXRh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SyxHQUFwQixDQUF3QixhQUF4QixDQUFQO0FBQ0EsRUFKRDtBQUtBIiwiZmlsZSI6ImFsbF9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cclxuICovXHJcbmNsYXNzIERCSGVscGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRGF0YWJhc2UgVVJMLlxyXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcclxuICAgIGNvbnN0IHBvcnQgPSAxMzM3IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcclxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L3Jlc3RhdXJhbnRzYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCByZXN0YXVyYW50cy5cclxuICAgKi9cclxuICAvKnN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICB4aHIub3BlbignR0VUJywgREJIZWxwZXIuREFUQUJBU0VfVVJMKTtcclxuICAgIHhoci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHsgLy8gR290IGEgc3VjY2VzcyByZXNwb25zZSBmcm9tIHNlcnZlciFcclxuICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhqc29uKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0eXBlb2YganNvbik7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudHMgPSBqc29uO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKTtcclxuICAgICAgfSBlbHNlIHsgLy8gT29wcyEuIEdvdCBhbiBlcnJvciBmcm9tIHNlcnZlci5cclxuICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3hoci5zdGF0dXN9YCk7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgeGhyLnNlbmQoKTtcclxuICB9Ki9cclxuXHJcblxyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBmZXRjaChEQkhlbHBlci5EQVRBQkFTRV9VUkwpXHJcbiAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXHJcbiAgICAudGhlbihqc29uID0+e1xyXG4gICAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb247XHJcbiAgICAgIHN0b3JlUmVzdGF1cmFudERhdGEocmVzdGF1cmFudHMpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGUgPT57XHJcbiAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7ZX1gKTtcclxuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICB9KTtcclxuIFxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGEgcmVzdGF1cmFudCBieSBpdHMgSUQuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XHJcbiAgICAgICAgaWYgKHJlc3RhdXJhbnQpIHsgLy8gR290IHRoZSByZXN0YXVyYW50XHJcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0IGluIHRoZSBkYXRhYmFzZVxyXG4gICAgICAgICAgY2FsbGJhY2soJ1Jlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QnLCBudWxsKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzICB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZ1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIGN1aXNpbmUgdHlwZVxyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gbmVpZ2hib3Job29kXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzXHJcbiAgICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVOZWlnaGJvcmhvb2RzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoQ3Vpc2luZXMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIGN1aXNpbmVzIGZyb20gYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSlcclxuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cclxuICAgKi9cclxuICBzdGF0aWMgdXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cclxuICAgKi9cclxuICBzdGF0aWMgaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgIHJldHVybiAoYC9pbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGh9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXHJcbiAgICovXHJcbiAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XHJcbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcclxuICAgICAgcG9zaXRpb246IHJlc3RhdXJhbnQubGF0bG5nLFxyXG4gICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxyXG4gICAgICB1cmw6IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCksXHJcbiAgICAgIG1hcDogbWFwLFxyXG4gICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QfVxyXG4gICAgKTtcclxuICAgIHJldHVybiBtYXJrZXI7XHJcbiAgfVxyXG5cclxufVxyXG4iLCJsZXQgcmVzdGF1cmFudHMsXHJcbiAgbmVpZ2hib3Job29kcyxcclxuICBjdWlzaW5lc1xyXG52YXIgbWFwXHJcbnZhciBtYXJrZXJzID0gW11cclxuXHJcblxyXG4vKipcclxuICogRmV0Y2ggbmVpZ2hib3Job29kcyBhbmQgY3Vpc2luZXMgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXHJcbiAqL1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XHJcbiAgZmV0Y2hOZWlnaGJvcmhvb2RzKCk7XHJcbiAgZmV0Y2hDdWlzaW5lcygpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5mZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XHJcbiAgREJIZWxwZXIuZmV0Y2hOZWlnaGJvcmhvb2RzKChlcnJvciwgbmVpZ2hib3Job29kcykgPT4ge1xyXG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvclxyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbGYubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHM7XHJcbiAgICAgIGZpbGxOZWlnaGJvcmhvb2RzSFRNTCgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IG5laWdoYm9yaG9vZHMgSFRNTC5cclxuICovXHJcbmZpbGxOZWlnaGJvcmhvb2RzSFRNTCA9IChuZWlnaGJvcmhvb2RzID0gc2VsZi5uZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcbiAgbmVpZ2hib3Job29kcy5mb3JFYWNoKG5laWdoYm9yaG9vZCA9PiB7XHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBvcHRpb24udmFsdWUgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgY3Vpc2luZXMgYW5kIHNldCB0aGVpciBIVE1MLlxyXG4gKi9cclxuZmV0Y2hDdWlzaW5lcyA9ICgpID0+IHtcclxuICBEQkhlbHBlci5mZXRjaEN1aXNpbmVzKChlcnJvciwgY3Vpc2luZXMpID0+IHtcclxuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsZi5jdWlzaW5lcyA9IGN1aXNpbmVzO1xyXG4gICAgICBmaWxsQ3Vpc2luZXNIVE1MKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgY3Vpc2luZXMgSFRNTC5cclxuICovXHJcbmZpbGxDdWlzaW5lc0hUTUwgPSAoY3Vpc2luZXMgPSBzZWxmLmN1aXNpbmVzKSA9PiB7XHJcbiAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1aXNpbmVzLXNlbGVjdCcpO1xyXG5cclxuICBjdWlzaW5lcy5mb3JFYWNoKGN1aXNpbmUgPT4ge1xyXG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgIG9wdGlvbi52YWx1ZSA9IGN1aXNpbmU7XHJcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXHJcbiAqL1xyXG53aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcclxuICBsZXQgbG9jID0ge1xyXG4gICAgbGF0OiA0MC43MjIyMTYsXHJcbiAgICBsbmc6IC03My45ODc1MDFcclxuICB9O1xyXG4gIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcclxuICAgIHpvb206IDEyLFxyXG4gICAgY2VudGVyOiBsb2MsXHJcbiAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICB9KTtcclxuICB1cGRhdGVSZXN0YXVyYW50cygpO1xyXG59XHJcblxyXG4vKipcclxuICogVXBkYXRlIHBhZ2UgYW5kIG1hcCBmb3IgY3VycmVudCByZXN0YXVyYW50cy5cclxuICovXHJcbnVwZGF0ZVJlc3RhdXJhbnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGNTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcbiAgY29uc3QgblNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZWlnaGJvcmhvb2RzLXNlbGVjdCcpO1xyXG5cclxuICBjb25zdCBjSW5kZXggPSBjU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcbiAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICBjb25zdCBjdWlzaW5lID0gY1NlbGVjdFtjSW5kZXhdLnZhbHVlO1xyXG4gIGNvbnN0IG5laWdoYm9yaG9vZCA9IG5TZWxlY3RbbkluZGV4XS52YWx1ZTtcclxuXHJcbiAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXNldFJlc3RhdXJhbnRzKHJlc3RhdXJhbnRzKTtcclxuICAgICAgZmlsbFJlc3RhdXJhbnRzSFRNTCgpO1xyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGVhciBjdXJyZW50IHJlc3RhdXJhbnRzLCB0aGVpciBIVE1MIGFuZCByZW1vdmUgdGhlaXIgbWFwIG1hcmtlcnMuXHJcbiAqL1xyXG5yZXNldFJlc3RhdXJhbnRzID0gKHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgLy8gUmVtb3ZlIGFsbCByZXN0YXVyYW50c1xyXG4gIHNlbGYucmVzdGF1cmFudHMgPSBbXTtcclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgdWwuaW5uZXJIVE1MID0gJyc7XHJcblxyXG4gIC8vIFJlbW92ZSBhbGwgbWFwIG1hcmtlcnNcclxuICBzZWxmLm1hcmtlcnMuZm9yRWFjaChtID0+IG0uc2V0TWFwKG51bGwpKTtcclxuICBzZWxmLm1hcmtlcnMgPSBbXTtcclxuICBzZWxmLnJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYWxsIHJlc3RhdXJhbnRzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuZmlsbFJlc3RhdXJhbnRzSFRNTCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgIHVsLmFwcGVuZChjcmVhdGVSZXN0YXVyYW50SFRNTChyZXN0YXVyYW50KSk7XHJcbiAgfSk7XHJcbiAgYWRkTWFya2Vyc1RvTWFwKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MLlxyXG4gKi9cclxuY3JlYXRlUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCkgPT4ge1xyXG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuXHJcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XHJcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgbGkuYXBwZW5kKG5hbWUpO1xyXG5cclxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XHJcbiAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gIGltYWdlLnNldEF0dHJpYnV0ZShcInNyY3NldFwiLCBgL2ltZ19yZXNwLyR7cmVzdGF1cmFudC5pZH0tMzAwLmpwZyAxeCwgL2ltZ19yZXNwLyR7cmVzdGF1cmFudC5pZH0tNjAwLmpwZyAyeGApO1xyXG4gIGltYWdlLnNldEF0dHJpYnV0ZShcImFsdFwiLCByZXN0YXVyYW50LmFsdCk7XHJcbiAgbGkuYXBwZW5kKGltYWdlKTtcclxuXHJcbiAgY29uc3QgbmVpZ2hib3Job29kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIG5laWdoYm9yaG9vZC5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5laWdoYm9yaG9vZDtcclxuICBuZWlnaGJvcmhvb2Quc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJyZXN0LW5laWdoYm9yaG9vZFwiKTtcclxuICBsaS5hcHBlbmQobmVpZ2hib3Job29kKTtcclxuXHJcbiAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBhZGRyZXNzLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuYWRkcmVzcztcclxuICBhZGRyZXNzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwicmVzdC1hZGRyZXNzXCIpO1xyXG4gIGxpLmFwcGVuZChhZGRyZXNzKTtcclxuXHJcbiAgY29uc3QgbW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICBtb3JlLmlubmVySFRNTCA9ICdWaWV3IERldGFpbHMnO1xyXG4gIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgbW9yZS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGBWaWV3IGRldGFpbHMgZm9yIHRoZSByZXN0YXVyYW50ICR7cmVzdGF1cmFudC5uYW1lfWApO1xyXG4gIGxpLmFwcGVuZChtb3JlKVxyXG5cclxuICByZXR1cm4gbGlcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZCBtYXJrZXJzIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzIHRvIHRoZSBtYXAuXHJcbiAqL1xyXG5hZGRNYXJrZXJzVG9NYXAgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgIC8vIEFkZCBtYXJrZXIgdG8gdGhlIG1hcFxyXG4gICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdjbGljaycsICgpID0+IHtcclxuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBtYXJrZXIudXJsXHJcbiAgICB9KTtcclxuICAgIHNlbGYubWFya2Vycy5wdXNoKG1hcmtlcik7XHJcbiAgfSk7XHJcbn1cclxuIiwiICAgICAgLypcclxuICAgICAgICogT3BlbiB0aGUgZmlsdGVyLW9wdGlvbnMgbWVudSB3aGVuIHRoZSBtZW51IGljb24gaXMgY2xpY2tlZC5cclxuICAgICAgICovXHJcbiAgICAgIHZhciBtZW51ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lbnUnKTtcclxuICAgICAgdmFyIG1haW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7XHJcbiAgICAgIHZhciBmaWx0ZXJPcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5maWx0ZXItb3B0aW9ucycpO1xyXG5cclxuICAgICAgbWVudS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgLy9zZXQgYXJpYS1leHBhbmRlZCBzdGF0ZVxyXG4gICAgICAgIGlmKG1lbnUuZ2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKT09XCJ0cnVlXCIpe1xyXG4gICAgICAgICAgbWVudS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJ0cnVlXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlsdGVyT3AuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBtYWluLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT57XHJcbiAgICAgICAgbWVudS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XHJcbiAgICAgICAgZmlsdGVyT3AuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpO1xyXG4gICAgICB9KTtcclxuIiwic2V0VGltZW91dCggKCkgPT4ge30sNTAwMCk7XHJcbiAgcmVtb3ZlVGFiZm9jdXNGcm9tTWFwID0gKCkgPT4ge1xyXG4gICAgd2luZG93Lm9ubG9hZCA9ICgpID0+e1xyXG4gICAgICBjb25zdCBnbWFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21hcCcpO1xyXG4gICAgICBnbWFwRGVzYyA9IGdtYXAucXVlcnlTZWxlY3RvckFsbCgnKicpO1xyXG4gICAgICBnbWFwRGVzYy5mb3JFYWNoKCAoZGVzYykgPT57XHJcbiAgICAgICAgZGVzYy5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIikub25sb2FkID0gcmVtb3ZlVGFiZm9jdXNGcm9tTWFwKCk7XHJcblxyXG4gIHdpbmRvdy5vbmxvYWQgPSAoKSA9PntcclxuICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZScpO1xyXG4gICAgaWZyYW1lLnRpdGxlID0gXCJHb29nbGUgTWFwc1wiO1xyXG4gIH1cclxuIiwiXHJcbi8qKlxyXG4gKiBSZWdpc3RlciBhIHNlcnZpY2VXb3JrZXJcclxuICovXHJcbnJlZ2lzdGVyU2VydmljZVdvcmtlciA9ICgpID0+IHtcclxuICAgIC8vY2hlY2sgaWYgc2VydmljZVdvcmtlciBpcyBzdXBwb3J0ZWQsIG90aGVyd2lzZSByZXR1cm5cclxuICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHJldHVybjtcclxuICBcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnKS5jYXRjaChmdW5jdGlvbigpe1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyB3ZW50IHdyb25nLiBTZXJ2aWNlV29ya2VyIG5vdCByZWdpc3RlcmVkXCIpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICBcclxuICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTsiLCIvL2ltcG9ydCAqIGFzICdpZGInIGZyb20gJy4vbGliL2lkYi9saWIvaWRiLmpzJztcclxuXHJcbnZhciBkYlByb21pc2UgPSBpZGIub3BlbignanNvblJlc3AnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcclxuICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudERhdGEnKTtcclxuICB9KTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gc3RvcmVSZXN0YXVyYW50RGF0YShqc29uRGF0YSl7XHJcblx0ZGJQcm9taXNlLnRoZW4oZGIgPT57XHJcblx0XHR2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERhdGEnLCdyZWFkd3JpdGUnKTtcclxuXHRcdHZhciByZXN0YXVyYW50RGF0YVN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHRyZXN0YXVyYW50RGF0YVN0b3JlLnB1dChqc29uRGF0YSwgJ3Jlc3RhdXJhbnRzJyk7XHJcblx0XHRyZXR1cm4gdHguY29tcGxldGU7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJlc3RhdXJhbnREYXRhKCl7XHJcblx0ZGJQcm9taXNlLnRoZW4oZGIgPT57XHJcblx0XHR2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERhdGEnKTtcclxuXHRcdHZhciByZXN0YXVyYW50RGF0YVN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHRyZXR1cm4gcmVzdGF1cmFudERhdGFTdG9yZS5nZXQoJ3Jlc3RhdXJhbnRzJyk7XHJcblx0fSk7XHJcbn0iXX0=
