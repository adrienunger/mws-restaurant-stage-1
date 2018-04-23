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

  static fetchRestaurants(callback) {
    getRestaurantData().then(restaurants => {
      //check if there is restaurant data stored in the db
      if (restaurants !== undefined) {
        //restaurant data is stored. execute the callback => pass the data to the application
        callback(null, restaurants);
        //console.log('successfully served from idb');
        //after executing the callback fetch data from the network for a possibly newer version and save it to db
        fetch(DBHelper.DATABASE_URL).then(response => response.json()).then(json => {
          const restaurants = json;
          storeRestaurantData(restaurants);
        }).catch(e => {
          const error = `Request failed. Returned status of ${e}`;
          console.log(error);
          callback(error, null);
        });
      } else {
        //no data saved in the db => fetch it from the network, pass it to the application and save it in db
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
    }).catch(e => {
      console.log(`Error while trying to get restaurant data via indexedDB: ${e}`);
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
  image.className = 'restaurant-img responsively-lazy';
  //check if image data is available in the restaurant data
  if (DBHelper.imageUrlForRestaurant(restaurant) !== '/img/undefined') {
    image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}.jpg`;
  } else {
    image.src = `/img/${restaurant.id}.jpg`;
  }

  image.setAttribute("srcset", "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==");
  image.setAttribute("data-srcset", `/img_resp/${restaurant.id}-300.jpg 1x, /img_resp/${restaurant.id}-600.jpg 2x`);
  image.setAttribute("alt", `An image of the restaurant ${restaurant.name} in ${restaurant.neighborhood}.`);
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
	return dbPromise.then(db => {
		var tx = db.transaction('restaurantData');
		var restaurantDataStore = tx.objectStore('restaurantData');
		return restaurantDataStore.get('restaurants');
	});
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwibWFpbi5qcyIsIm9mZl9jYW52YXMuanMiLCJnb29nbGVNYXBzRm9jdXMuanMiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIuanMiLCJpZGJEYXRhLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiREFUQUJBU0VfVVJMIiwicG9ydCIsImZldGNoUmVzdGF1cmFudHMiLCJjYWxsYmFjayIsImdldFJlc3RhdXJhbnREYXRhIiwidGhlbiIsInJlc3RhdXJhbnRzIiwidW5kZWZpbmVkIiwiZmV0Y2giLCJyZXNwb25zZSIsImpzb24iLCJzdG9yZVJlc3RhdXJhbnREYXRhIiwiY2F0Y2giLCJlIiwiZXJyb3IiLCJjb25zb2xlIiwibG9nIiwiZmV0Y2hSZXN0YXVyYW50QnlJZCIsImlkIiwicmVzdGF1cmFudCIsImZpbmQiLCJyIiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lIiwiY3Vpc2luZSIsInJlc3VsdHMiLCJmaWx0ZXIiLCJjdWlzaW5lX3R5cGUiLCJmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZCIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZCIsImZldGNoTmVpZ2hib3Job29kcyIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiZmV0Y2hDdWlzaW5lcyIsImN1aXNpbmVzIiwidW5pcXVlQ3Vpc2luZXMiLCJ1cmxGb3JSZXN0YXVyYW50IiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwicGhvdG9ncmFwaCIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJtYXJrZXIiLCJnb29nbGUiLCJtYXBzIiwiTWFya2VyIiwicG9zaXRpb24iLCJsYXRsbmciLCJ0aXRsZSIsIm5hbWUiLCJ1cmwiLCJhbmltYXRpb24iLCJBbmltYXRpb24iLCJEUk9QIiwibWFya2VycyIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50Iiwic2VsZiIsImZpbGxOZWlnaGJvcmhvb2RzSFRNTCIsInNlbGVjdCIsImdldEVsZW1lbnRCeUlkIiwiZm9yRWFjaCIsIm9wdGlvbiIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ2YWx1ZSIsImFwcGVuZCIsImZpbGxDdWlzaW5lc0hUTUwiLCJ3aW5kb3ciLCJpbml0TWFwIiwibG9jIiwibGF0IiwibG5nIiwiTWFwIiwiem9vbSIsImNlbnRlciIsInNjcm9sbHdoZWVsIiwidXBkYXRlUmVzdGF1cmFudHMiLCJjU2VsZWN0IiwiblNlbGVjdCIsImNJbmRleCIsInNlbGVjdGVkSW5kZXgiLCJuSW5kZXgiLCJyZXNldFJlc3RhdXJhbnRzIiwiZmlsbFJlc3RhdXJhbnRzSFRNTCIsInVsIiwibSIsInNldE1hcCIsImNyZWF0ZVJlc3RhdXJhbnRIVE1MIiwiYWRkTWFya2Vyc1RvTWFwIiwibGkiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsInNldEF0dHJpYnV0ZSIsImFkZHJlc3MiLCJtb3JlIiwiaHJlZiIsImFkZExpc3RlbmVyIiwibG9jYXRpb24iLCJwdXNoIiwibWVudSIsInF1ZXJ5U2VsZWN0b3IiLCJtYWluIiwiZmlsdGVyT3AiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3QiLCJ0b2dnbGUiLCJzdG9wUHJvcGFnYXRpb24iLCJyZW1vdmUiLCJzZXRUaW1lb3V0IiwicmVtb3ZlVGFiZm9jdXNGcm9tTWFwIiwib25sb2FkIiwiZ21hcCIsImdtYXBEZXNjIiwicXVlcnlTZWxlY3RvckFsbCIsImRlc2MiLCJpZnJhbWUiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwicmVnaXN0ZXIiLCJkYlByb21pc2UiLCJpZGIiLCJvcGVuIiwidXBncmFkZURiIiwiY3JlYXRlT2JqZWN0U3RvcmUiLCJqc29uRGF0YSIsImRiIiwidHgiLCJ0cmFuc2FjdGlvbiIsInJlc3RhdXJhbnREYXRhU3RvcmUiLCJvYmplY3RTdG9yZSIsInB1dCIsImNv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QSxNQUFJLENBQUNDLFVBQVVDLGFBQWYsRUFBOEI7O0FBRTlCRCxZQUFVQyxhQUFWLENBQXdCQyxRQUF4QixDQUFpQyxRQUFqQyxFQUEyQ2hILEtBQTNDLENBQWlELFlBQVU7QUFDekRHLFlBQVFDLEdBQVIsQ0FBWSxvREFBWjtBQUNELEdBRkQ7QUFHRCxDQVBIOztBQVNFeUc7QUNiRixJQUFJSSxZQUFZQyxJQUFJQyxJQUFKLENBQVMsVUFBVCxFQUFxQixDQUFyQixFQUF3QixVQUFTQyxTQUFULEVBQW9CO0FBQ3hEQSxXQUFVQyxpQkFBVixDQUE0QixnQkFBNUI7QUFDRCxDQUZhLENBQWhCOztBQU1BLFNBQVN0SCxtQkFBVCxDQUE2QnVILFFBQTdCLEVBQXNDO0FBQ3JDTCxXQUFVeEgsSUFBVixDQUFlOEgsTUFBSztBQUNuQixNQUFJQyxLQUFLRCxHQUFHRSxXQUFILENBQWUsZ0JBQWYsRUFBZ0MsV0FBaEMsQ0FBVDtBQUNBLE1BQUlDLHNCQUFzQkYsR0FBR0csV0FBSCxDQUFlLGdCQUFmLENBQTFCO0FBQ0FELHNCQUFvQkUsR0FBcEIsQ0FBd0JOLFFBQXhCLEVBQWtDLGFBQWxDO0FBQ0EsU0FBT0UsR0FBR0ssUUFBVjtBQUNBLEVBTEQ7QUFNQTs7QUFFRCxTQUFTckksaUJBQVQsR0FBNEI7QUFDM0IsUUFBT3lILFVBQVV4SCxJQUFWLENBQWU4SCxNQUFLO0FBQzFCLE1BQUlDLEtBQUtELEdBQUdFLFdBQUgsQ0FBZSxnQkFBZixDQUFUO0FBQ0EsTUFBSUMsc0JBQXNCRixHQUFHRyxXQUFILENBQWUsZ0JBQWYsQ0FBMUI7QUFDQSxTQUFPRCxvQkFBb0JJLEdBQXBCLENBQXdCLGFBQXhCLENBQVA7QUFDQSxFQUpNLENBQVA7QUFLQSIsImZpbGUiOiJhbGxfaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXHJcbiAqL1xyXG5jbGFzcyBEQkhlbHBlciB7XHJcblxyXG4gIC8qKlxyXG4gICAqIERhdGFiYXNlIFVSTC5cclxuICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXHJcbiAgICovXHJcbiAgc3RhdGljIGdldCBEQVRBQkFTRV9VUkwoKSB7XHJcbiAgICBjb25zdCBwb3J0ID0gMTMzNyAvLyBDaGFuZ2UgdGhpcyB0byB5b3VyIHNlcnZlciBwb3J0XHJcbiAgICByZXR1cm4gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9yZXN0YXVyYW50c2A7XHJcbiAgfVxyXG5cclxuXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudHMoY2FsbGJhY2spIHtcclxuICAgIGdldFJlc3RhdXJhbnREYXRhKCkudGhlbihyZXN0YXVyYW50cyA9PiB7XHJcbiAgICAgIC8vY2hlY2sgaWYgdGhlcmUgaXMgcmVzdGF1cmFudCBkYXRhIHN0b3JlZCBpbiB0aGUgZGJcclxuICAgICAgaWYgKHJlc3RhdXJhbnRzICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgIC8vcmVzdGF1cmFudCBkYXRhIGlzIHN0b3JlZC4gZXhlY3V0ZSB0aGUgY2FsbGJhY2sgPT4gcGFzcyB0aGUgZGF0YSB0byB0aGUgYXBwbGljYXRpb25cclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cylcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdzdWNjZXNzZnVsbHkgc2VydmVkIGZyb20gaWRiJyk7XHJcbiAgICAgICAgLy9hZnRlciBleGVjdXRpbmcgdGhlIGNhbGxiYWNrIGZldGNoIGRhdGEgZnJvbSB0aGUgbmV0d29yayBmb3IgYSBwb3NzaWJseSBuZXdlciB2ZXJzaW9uIGFuZCBzYXZlIGl0IHRvIGRiXHJcbiAgICAgICAgZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxyXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgICAgICAudGhlbihqc29uID0+e1xyXG4gICAgICAgICAgY29uc3QgcmVzdGF1cmFudHMgPSBqc29uO1xyXG4gICAgICAgICAgc3RvcmVSZXN0YXVyYW50RGF0YShyZXN0YXVyYW50cyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZSA9PntcclxuICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7ZX1gKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIC8vbm8gZGF0YSBzYXZlZCBpbiB0aGUgZGIgPT4gZmV0Y2ggaXQgZnJvbSB0aGUgbmV0d29yaywgcGFzcyBpdCB0byB0aGUgYXBwbGljYXRpb24gYW5kIHNhdmUgaXQgaW4gZGJcclxuICAgICAgICBmZXRjaChEQkhlbHBlci5EQVRBQkFTRV9VUkwpXHJcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxyXG4gICAgICAgIC50aGVuKGpzb24gPT57XHJcbiAgICAgICAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb247XHJcbiAgICAgICAgICBzdG9yZVJlc3RhdXJhbnREYXRhKHJlc3RhdXJhbnRzKTtcclxuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlID0+e1xyXG4gICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtlfWApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KS5jYXRjaChlID0+e1xyXG4gICAgICBjb25zb2xlLmxvZyhgRXJyb3Igd2hpbGUgdHJ5aW5nIHRvIGdldCByZXN0YXVyYW50IGRhdGEgdmlhIGluZGV4ZWREQjogJHtlfWApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIGZldGNoIGFsbCByZXN0YXVyYW50cyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudCA9IHJlc3RhdXJhbnRzLmZpbmQociA9PiByLmlkID09IGlkKTtcclxuICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcclxuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICAgICAgICBjYWxsYmFjaygnUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCcsIG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lKGN1aXNpbmUsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZChuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHNcclxuICAgICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxyXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZWlnaGJvcmhvb2QgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IG5laWdoYm9yaG9vZFxyXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoTmVpZ2hib3Job29kcyhjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCBhbGwgbmVpZ2hib3Job29kcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZClcclxuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIG5laWdoYm9yaG9vZHNcclxuICAgICAgICBjb25zdCB1bmlxdWVOZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcy5maWx0ZXIoKHYsIGkpID0+IG5laWdoYm9yaG9vZHMuaW5kZXhPZih2KSA9PSBpKVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBjdWlzaW5lcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hDdWlzaW5lcyhjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKVxyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcclxuICAgICAgICBjb25zdCB1bmlxdWVDdWlzaW5lcyA9IGN1aXNpbmVzLmZpbHRlcigodiwgaSkgPT4gY3Vpc2luZXMuaW5kZXhPZih2KSA9PSBpKVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZUN1aXNpbmVzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXN0YXVyYW50IHBhZ2UgVVJMLlxyXG4gICAqL1xyXG4gIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgIHJldHVybiAoYC4vcmVzdGF1cmFudC5odG1sP2lkPSR7cmVzdGF1cmFudC5pZH1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgVVJMLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgL2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cclxuICAgKi9cclxuICBzdGF0aWMgbWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBtYXApIHtcclxuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xyXG4gICAgICBwb3NpdGlvbjogcmVzdGF1cmFudC5sYXRsbmcsXHJcbiAgICAgIHRpdGxlOiByZXN0YXVyYW50Lm5hbWUsXHJcbiAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcclxuICAgICAgbWFwOiBtYXAsXHJcbiAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1B9XHJcbiAgICApO1xyXG4gICAgcmV0dXJuIG1hcmtlcjtcclxuICB9XHJcblxyXG59XHJcbiIsImxldCByZXN0YXVyYW50cyxcclxuICBuZWlnaGJvcmhvb2RzLFxyXG4gIGN1aXNpbmVzXHJcbnZhciBtYXBcclxudmFyIG1hcmtlcnMgPSBbXVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBuZWlnaGJvcmhvb2RzIGFuZCBjdWlzaW5lcyBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cclxuICovXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcclxuICBmZXRjaE5laWdoYm9yaG9vZHMoKTtcclxuICBmZXRjaEN1aXNpbmVzKCk7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIGFuZCBzZXQgdGhlaXIgSFRNTC5cclxuICovXHJcbmZldGNoTmVpZ2hib3Job29kcyA9ICgpID0+IHtcclxuICBEQkhlbHBlci5mZXRjaE5laWdoYm9yaG9vZHMoKGVycm9yLCBuZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsZi5uZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcztcclxuICAgICAgZmlsbE5laWdoYm9yaG9vZHNIVE1MKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgbmVpZ2hib3Job29kcyBIVE1MLlxyXG4gKi9cclxuZmlsbE5laWdoYm9yaG9vZHNIVE1MID0gKG5laWdoYm9yaG9vZHMgPSBzZWxmLm5laWdoYm9yaG9vZHMpID0+IHtcclxuICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcclxuICBuZWlnaGJvcmhvb2RzLmZvckVhY2gobmVpZ2hib3Job29kID0+IHtcclxuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLmlubmVySFRNTCA9IG5laWdoYm9yaG9vZDtcclxuICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcclxuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBjdWlzaW5lcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5mZXRjaEN1aXNpbmVzID0gKCkgPT4ge1xyXG4gIERCSGVscGVyLmZldGNoQ3Vpc2luZXMoKGVycm9yLCBjdWlzaW5lcykgPT4ge1xyXG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxmLmN1aXNpbmVzID0gY3Vpc2luZXM7XHJcbiAgICAgIGZpbGxDdWlzaW5lc0hUTUwoKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBjdWlzaW5lcyBIVE1MLlxyXG4gKi9cclxuZmlsbEN1aXNpbmVzSFRNTCA9IChjdWlzaW5lcyA9IHNlbGYuY3Vpc2luZXMpID0+IHtcclxuICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcblxyXG4gIGN1aXNpbmVzLmZvckVhY2goY3Vpc2luZSA9PiB7XHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBjdWlzaW5lO1xyXG4gICAgb3B0aW9uLnZhbHVlID0gY3Vpc2luZTtcclxuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgR29vZ2xlIG1hcCwgY2FsbGVkIGZyb20gSFRNTC5cclxuICovXHJcbndpbmRvdy5pbml0TWFwID0gKCkgPT4ge1xyXG4gIGxldCBsb2MgPSB7XHJcbiAgICBsYXQ6IDQwLjcyMjIxNixcclxuICAgIGxuZzogLTczLjk4NzUwMVxyXG4gIH07XHJcbiAgc2VsZi5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKSwge1xyXG4gICAgem9vbTogMTIsXHJcbiAgICBjZW50ZXI6IGxvYyxcclxuICAgIHNjcm9sbHdoZWVsOiBmYWxzZVxyXG4gIH0pO1xyXG4gIHVwZGF0ZVJlc3RhdXJhbnRzKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgcGFnZSBhbmQgbWFwIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzLlxyXG4gKi9cclxudXBkYXRlUmVzdGF1cmFudHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY1NlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcclxuICBjb25zdCBuU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcblxyXG4gIGNvbnN0IGNJbmRleCA9IGNTZWxlY3Quc2VsZWN0ZWRJbmRleDtcclxuICBjb25zdCBuSW5kZXggPSBuU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gIGNvbnN0IGN1aXNpbmUgPSBjU2VsZWN0W2NJbmRleF0udmFsdWU7XHJcbiAgY29uc3QgbmVpZ2hib3Job29kID0gblNlbGVjdFtuSW5kZXhdLnZhbHVlO1xyXG5cclxuICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCAoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlc2V0UmVzdGF1cmFudHMocmVzdGF1cmFudHMpO1xyXG4gICAgICBmaWxsUmVzdGF1cmFudHNIVE1MKCk7XHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG5cclxuLyoqXHJcbiAqIENsZWFyIGN1cnJlbnQgcmVzdGF1cmFudHMsIHRoZWlyIEhUTUwgYW5kIHJlbW92ZSB0aGVpciBtYXAgbWFya2Vycy5cclxuICovXHJcbnJlc2V0UmVzdGF1cmFudHMgPSAocmVzdGF1cmFudHMpID0+IHtcclxuICAvLyBSZW1vdmUgYWxsIHJlc3RhdXJhbnRzXHJcbiAgc2VsZi5yZXN0YXVyYW50cyA9IFtdO1xyXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICB1bC5pbm5lckhUTUwgPSAnJztcclxuXHJcbiAgLy8gUmVtb3ZlIGFsbCBtYXAgbWFya2Vyc1xyXG4gIHNlbGYubWFya2Vycy5mb3JFYWNoKG0gPT4gbS5zZXRNYXAobnVsbCkpO1xyXG4gIHNlbGYubWFya2VycyA9IFtdO1xyXG4gIHNlbGYucmVzdGF1cmFudHMgPSByZXN0YXVyYW50cztcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbGwgcmVzdGF1cmFudHMgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5maWxsUmVzdGF1cmFudHNIVE1MID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgdWwuYXBwZW5kKGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpKTtcclxuICB9KTtcclxuICBhZGRNYXJrZXJzVG9NYXAoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwuXHJcbiAqL1xyXG5jcmVhdGVSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50KSA9PiB7XHJcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcclxuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICBsaS5hcHBlbmQobmFtZSk7XHJcblxyXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nIHJlc3BvbnNpdmVseS1sYXp5JztcclxuICAvL2NoZWNrIGlmIGltYWdlIGRhdGEgaXMgYXZhaWxhYmxlIGluIHRoZSByZXN0YXVyYW50IGRhdGFcclxuICBpZiAoREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpICE9PSAnL2ltZy91bmRlZmluZWQnKXtcclxuICAgIGltYWdlLnNyYyA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0uanBnYDtcclxuICB9ZWxzZXtcclxuICAgIGltYWdlLnNyYyA9IGAvaW1nLyR7cmVzdGF1cmFudC5pZH0uanBnYDtcclxuICB9XHJcblxyXG4gIGltYWdlLnNldEF0dHJpYnV0ZShcInNyY3NldFwiLCBcImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQVAvLy8vLy8veUg1QkFFS0FBRUFMQUFBQUFBQkFBRUFBQUlDVEFFQU93PT1cIik7XHJcbiAgaW1hZ2Uuc2V0QXR0cmlidXRlKFwiZGF0YS1zcmNzZXRcIiwgYC9pbWdfcmVzcC8ke3Jlc3RhdXJhbnQuaWR9LTMwMC5qcGcgMXgsIC9pbWdfcmVzcC8ke3Jlc3RhdXJhbnQuaWR9LTYwMC5qcGcgMnhgKTtcclxuICBpbWFnZS5zZXRBdHRyaWJ1dGUoXCJhbHRcIiwgYEFuIGltYWdlIG9mIHRoZSByZXN0YXVyYW50ICR7cmVzdGF1cmFudC5uYW1lfSBpbiAke3Jlc3RhdXJhbnQubmVpZ2hib3Job29kfS5gKTtcclxuICBsaS5hcHBlbmQoaW1hZ2UpO1xyXG5cclxuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgbmVpZ2hib3Job29kLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmVpZ2hib3Job29kO1xyXG4gIG5laWdoYm9yaG9vZC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInJlc3QtbmVpZ2hib3Job29kXCIpO1xyXG4gIGxpLmFwcGVuZChuZWlnaGJvcmhvb2QpO1xyXG5cclxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gIGFkZHJlc3Muc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJyZXN0LWFkZHJlc3NcIik7XHJcbiAgbGkuYXBwZW5kKGFkZHJlc3MpO1xyXG5cclxuICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gIG1vcmUuaW5uZXJIVE1MID0gJ1ZpZXcgRGV0YWlscyc7XHJcbiAgbW9yZS5ocmVmID0gREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICBtb3JlLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgYFZpZXcgZGV0YWlscyBmb3IgdGhlIHJlc3RhdXJhbnQgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XHJcbiAgbGkuYXBwZW5kKG1vcmUpXHJcblxyXG4gIHJldHVybiBsaVxyXG59XHJcblxyXG4vKipcclxuICogQWRkIG1hcmtlcnMgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMgdG8gdGhlIG1hcC5cclxuICovXHJcbmFkZE1hcmtlcnNUb01hcCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgLy8gQWRkIG1hcmtlciB0byB0aGUgbWFwXHJcbiAgICBjb25zdCBtYXJrZXIgPSBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHNlbGYubWFwKTtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci51cmxcclxuICAgIH0pO1xyXG4gICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICB9KTtcclxufVxyXG4iLCIgICAgICAvKlxyXG4gICAgICAgKiBPcGVuIHRoZSBmaWx0ZXItb3B0aW9ucyBtZW51IHdoZW4gdGhlIG1lbnUgaWNvbiBpcyBjbGlja2VkLlxyXG4gICAgICAgKi9cclxuICAgICAgdmFyIG1lbnUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVudScpO1xyXG4gICAgICB2YXIgbWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKTtcclxuICAgICAgdmFyIGZpbHRlck9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1vcHRpb25zJyk7XHJcblxyXG4gICAgICBtZW51LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgICAgICAvL3NldCBhcmlhLWV4cGFuZGVkIHN0YXRlXHJcbiAgICAgICAgaWYobWVudS5nZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIpPT1cInRydWVcIil7XHJcbiAgICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIG1lbnUuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaWx0ZXJPcC5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgfSk7XHJcbiAgICAgIG1haW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PntcclxuICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgICBmaWx0ZXJPcC5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7XHJcbiAgICAgIH0pO1xyXG4iLCJzZXRUaW1lb3V0KCAoKSA9PiB7fSw1MDAwKTtcclxuICByZW1vdmVUYWJmb2N1c0Zyb21NYXAgPSAoKSA9PiB7XHJcbiAgICB3aW5kb3cub25sb2FkID0gKCkgPT57XHJcbiAgICAgIGNvbnN0IGdtYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwJyk7XHJcbiAgICAgIGdtYXBEZXNjID0gZ21hcC5xdWVyeVNlbGVjdG9yQWxsKCcqJyk7XHJcbiAgICAgIGdtYXBEZXNjLmZvckVhY2goIChkZXNjKSA9PntcclxuICAgICAgICBkZXNjLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKS5vbmxvYWQgPSByZW1vdmVUYWJmb2N1c0Zyb21NYXAoKTtcclxuXHJcbiAgd2luZG93Lm9ubG9hZCA9ICgpID0+e1xyXG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XHJcbiAgICBpZnJhbWUudGl0bGUgPSBcIkdvb2dsZSBNYXBzXCI7XHJcbiAgfVxyXG4iLCJcclxuLyoqXHJcbiAqIFJlZ2lzdGVyIGEgc2VydmljZVdvcmtlclxyXG4gKi9cclxucmVnaXN0ZXJTZXJ2aWNlV29ya2VyID0gKCkgPT4ge1xyXG4gICAgLy9jaGVjayBpZiBzZXJ2aWNlV29ya2VyIGlzIHN1cHBvcnRlZCwgb3RoZXJ3aXNlIHJldHVyblxyXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xyXG4gIFxyXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zdy5qcycpLmNhdGNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIHdlbnQgd3JvbmcuIFNlcnZpY2VXb3JrZXIgbm90IHJlZ2lzdGVyZWRcIik7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIFxyXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpOyIsInZhciBkYlByb21pc2UgPSBpZGIub3BlbignanNvblJlc3AnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcclxuICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudERhdGEnKTtcclxuICB9KTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gc3RvcmVSZXN0YXVyYW50RGF0YShqc29uRGF0YSl7XHJcblx0ZGJQcm9taXNlLnRoZW4oZGIgPT57XHJcblx0XHR2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERhdGEnLCdyZWFkd3JpdGUnKTtcclxuXHRcdHZhciByZXN0YXVyYW50RGF0YVN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHRyZXN0YXVyYW50RGF0YVN0b3JlLnB1dChqc29uRGF0YSwgJ3Jlc3RhdXJhbnRzJyk7XHJcblx0XHRyZXR1cm4gdHguY29tcGxldGU7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJlc3RhdXJhbnREYXRhKCl7XHJcblx0cmV0dXJuIGRiUHJvbWlzZS50aGVuKGRiID0+e1xyXG5cdFx0dmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHR2YXIgcmVzdGF1cmFudERhdGFTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGF0YScpO1xyXG5cdFx0cmV0dXJuIHJlc3RhdXJhbnREYXRhU3RvcmUuZ2V0KCdyZXN0YXVyYW50cycpO1xyXG5cdH0pO1xyXG59Il19
