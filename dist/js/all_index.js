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
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("srcset", `/img_resp/${restaurant.id}-300.jpg 1x, /img_resp/${restaurant.id}-600.jpg 2x`);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwibWFpbi5qcyIsIm9mZl9jYW52YXMuanMiLCJnb29nbGVNYXBzRm9jdXMuanMiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIuanMiLCJpZGJEYXRhLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiREFUQUJBU0VfVVJMIiwicG9ydCIsImZldGNoUmVzdGF1cmFudHMiLCJjYWxsYmFjayIsImdldFJlc3RhdXJhbnREYXRhIiwidGhlbiIsInJlc3RhdXJhbnRzIiwidW5kZWZpbmVkIiwiZmV0Y2giLCJyZXNwb25zZSIsImpzb24iLCJzdG9yZVJlc3RhdXJhbnREYXRhIiwiY2F0Y2giLCJlIiwiZXJyb3IiLCJjb25zb2xlIiwibG9nIiwiZmV0Y2hSZXN0YXVyYW50QnlJZCIsImlkIiwicmVzdGF1cmFudCIsImZpbmQiLCJyIiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lIiwiY3Vpc2luZSIsInJlc3VsdHMiLCJmaWx0ZXIiLCJjdWlzaW5lX3R5cGUiLCJmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZCIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZCIsImZldGNoTmVpZ2hib3Job29kcyIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiZmV0Y2hDdWlzaW5lcyIsImN1aXNpbmVzIiwidW5pcXVlQ3Vpc2luZXMiLCJ1cmxGb3JSZXN0YXVyYW50IiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwicGhvdG9ncmFwaCIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJtYXJrZXIiLCJnb29nbGUiLCJtYXBzIiwiTWFya2VyIiwicG9zaXRpb24iLCJsYXRsbmciLCJ0aXRsZSIsIm5hbWUiLCJ1cmwiLCJhbmltYXRpb24iLCJBbmltYXRpb24iLCJEUk9QIiwibWFya2VycyIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50Iiwic2VsZiIsImZpbGxOZWlnaGJvcmhvb2RzSFRNTCIsInNlbGVjdCIsImdldEVsZW1lbnRCeUlkIiwiZm9yRWFjaCIsIm9wdGlvbiIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ2YWx1ZSIsImFwcGVuZCIsImZpbGxDdWlzaW5lc0hUTUwiLCJ3aW5kb3ciLCJpbml0TWFwIiwibG9jIiwibGF0IiwibG5nIiwiTWFwIiwiem9vbSIsImNlbnRlciIsInNjcm9sbHdoZWVsIiwidXBkYXRlUmVzdGF1cmFudHMiLCJjU2VsZWN0IiwiblNlbGVjdCIsImNJbmRleCIsInNlbGVjdGVkSW5kZXgiLCJuSW5kZXgiLCJyZXNldFJlc3RhdXJhbnRzIiwiZmlsbFJlc3RhdXJhbnRzSFRNTCIsInVsIiwibSIsInNldE1hcCIsImNyZWF0ZVJlc3RhdXJhbnRIVE1MIiwiYWRkTWFya2Vyc1RvTWFwIiwibGkiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsInNldEF0dHJpYnV0ZSIsImFkZHJlc3MiLCJtb3JlIiwiaHJlZiIsImFkZExpc3RlbmVyIiwibG9jYXRpb24iLCJwdXNoIiwibWVudSIsInF1ZXJ5U2VsZWN0b3IiLCJtYWluIiwiZmlsdGVyT3AiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3QiLCJ0b2dnbGUiLCJzdG9wUHJvcGFnYXRpb24iLCJyZW1vdmUiLCJzZXRUaW1lb3V0IiwicmVtb3ZlVGFiZm9jdXNGcm9tTWFwIiwib25sb2FkIiwiZ21hcCIsImdtYXBEZXNjIiwicXVlcnlTZWxlY3RvckFsbCIsImRlc2MiLCJpZnJhbWUiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwicmVnaXN0ZXIiLCJkYlByb21pc2UiLCJpZGIiLCJvcGVuIiwidXBncmFkZURiIiwiY3JlYXRlT2JqZWN0U3RvcmUiLCJqc29uRGF0YSIsImRiIiwidHgiLCJ0cmFuc2FjdGlvbiIsInJlc3RhdXJhbnREYXRhU3RvcmUiLCJvYmplY3RTdG9yZSIsInB1dCIsImNv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UyxVQUFULEVBQXFCLENBQXJCLEVBQXdCLFVBQVNDLFNBQVQsRUFBb0I7QUFDeERBLFdBQVVDLGlCQUFWLENBQTRCLGdCQUE1QjtBQUNELENBRmEsQ0FBaEI7O0FBTUEsU0FBU3RILG1CQUFULENBQTZCdUgsUUFBN0IsRUFBc0M7QUFDckNMLFdBQVV4SCxJQUFWLENBQWU4SCxNQUFLO0FBQ25CLE1BQUlDLEtBQUtELEdBQUdFLFdBQUgsQ0FBZSxnQkFBZixFQUFnQyxXQUFoQyxDQUFUO0FBQ0EsTUFBSUMsc0JBQXNCRixHQUFHRyxXQUFILENBQWUsZ0JBQWYsQ0FBMUI7QUFDQUQsc0JBQW9CRSxHQUFwQixDQUF3Qk4sUUFBeEIsRUFBa0MsYUFBbEM7QUFDQSxTQUFPRSxHQUFHSyxRQUFWO0FBQ0EsRUFMRDtBQU1BOztBQUVELFNBQVNySSxpQkFBVCxHQUE0QjtBQUMzQixRQUFPeUgsVUFBVXhILElBQVYsQ0FBZThILE1BQUs7QUFDMUIsTUFBSUMsS0FBS0QsR0FBR0UsV0FBSCxDQUFlLGdCQUFmLENBQVQ7QUFDQSxNQUFJQyxzQkFBc0JGLEdBQUdHLFdBQUgsQ0FBZSxnQkFBZixDQUExQjtBQUNBLFNBQU9ELG9CQUFvQkksR0FBcEIsQ0FBd0IsYUFBeEIsQ0FBUDtBQUNBLEVBSk0sQ0FBUDtBQUtBIiwiZmlsZSI6ImFsbF9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cclxuICovXHJcbmNsYXNzIERCSGVscGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRGF0YWJhc2UgVVJMLlxyXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcclxuICAgIGNvbnN0IHBvcnQgPSAxMzM3IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcclxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L3Jlc3RhdXJhbnRzYDtcclxuICB9XHJcblxyXG5cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cyhjYWxsYmFjaykge1xyXG4gICAgZ2V0UmVzdGF1cmFudERhdGEoKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgLy9jaGVjayBpZiB0aGVyZSBpcyByZXN0YXVyYW50IGRhdGEgc3RvcmVkIGluIHRoZSBkYlxyXG4gICAgICBpZiAocmVzdGF1cmFudHMgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgLy9yZXN0YXVyYW50IGRhdGEgaXMgc3RvcmVkLiBleGVjdXRlIHRoZSBjYWxsYmFjayA9PiBwYXNzIHRoZSBkYXRhIHRvIHRoZSBhcHBsaWNhdGlvblxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3N1Y2Nlc3NmdWxseSBzZXJ2ZWQgZnJvbSBpZGInKTtcclxuICAgICAgICAvL2FmdGVyIGV4ZWN1dGluZyB0aGUgY2FsbGJhY2sgZmV0Y2ggZGF0YSBmcm9tIHRoZSBuZXR3b3JrIGZvciBhIHBvc3NpYmx5IG5ld2VyIHZlcnNpb24gYW5kIHNhdmUgaXQgdG8gZGJcclxuICAgICAgICBmZXRjaChEQkhlbHBlci5EQVRBQkFTRV9VUkwpXHJcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxyXG4gICAgICAgIC50aGVuKGpzb24gPT57XHJcbiAgICAgICAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb247XHJcbiAgICAgICAgICBzdG9yZVJlc3RhdXJhbnREYXRhKHJlc3RhdXJhbnRzKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlID0+e1xyXG4gICAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtlfWApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgLy9ubyBkYXRhIHNhdmVkIGluIHRoZSBkYiA9PiBmZXRjaCBpdCBmcm9tIHRoZSBuZXR3b3JrLCBwYXNzIGl0IHRvIHRoZSBhcHBsaWNhdGlvbiBhbmQgc2F2ZSBpdCBpbiBkYlxyXG4gICAgICAgIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcclxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXHJcbiAgICAgICAgLnRoZW4oanNvbiA9PntcclxuICAgICAgICAgIGNvbnN0IHJlc3RhdXJhbnRzID0ganNvbjtcclxuICAgICAgICAgIHN0b3JlUmVzdGF1cmFudERhdGEocmVzdGF1cmFudHMpO1xyXG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGUgPT57XHJcbiAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke2V9YCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pLmNhdGNoKGUgPT57XHJcbiAgICAgIGNvbnNvbGUubG9nKGBFcnJvciB3aGlsZSB0cnlpbmcgdG8gZ2V0IHJlc3RhdXJhbnQgZGF0YSB2aWEgaW5kZXhlZERCOiAke2V9YCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCBjYWxsYmFjaykge1xyXG4gICAgLy8gZmV0Y2ggYWxsIHJlc3RhdXJhbnRzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50ID0gcmVzdGF1cmFudHMuZmluZChyID0+IHIuaWQgPT0gaWQpO1xyXG4gICAgICAgIGlmIChyZXN0YXVyYW50KSB7IC8vIEdvdCB0aGUgcmVzdGF1cmFudFxyXG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcclxuICAgICAgICAgIGNhbGxiYWNrKCdSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0JywgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSB0eXBlIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSBhbmQgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSByZXN0YXVyYW50c1xyXG4gICAgICAgIGlmIChjdWlzaW5lICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBjdWlzaW5lXHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gR2V0IGFsbCBuZWlnaGJvcmhvb2RzIGZyb20gYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKVxyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlTmVpZ2hib3Job29kcyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgIGNvbnN0IGN1aXNpbmVzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5jdWlzaW5lX3R5cGUpXHJcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgLi9yZXN0YXVyYW50Lmh0bWw/aWQ9JHtyZXN0YXVyYW50LmlkfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGAvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxyXG4gICAqL1xyXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgIHBvc2l0aW9uOiByZXN0YXVyYW50LmxhdGxuZyxcclxuICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcclxuICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxyXG4gICAgICBtYXA6IG1hcCxcclxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cclxuICAgICk7XHJcbiAgICByZXR1cm4gbWFya2VyO1xyXG4gIH1cclxuXHJcbn1cclxuIiwibGV0IHJlc3RhdXJhbnRzLFxyXG4gIG5laWdoYm9yaG9vZHMsXHJcbiAgY3Vpc2luZXNcclxudmFyIG1hcFxyXG52YXIgbWFya2VycyA9IFtdXHJcblxyXG5cclxuLyoqXHJcbiAqIEZldGNoIG5laWdoYm9yaG9vZHMgYW5kIGN1aXNpbmVzIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxyXG4gKi9cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xyXG4gIGZldGNoTmVpZ2hib3Job29kcygpO1xyXG4gIGZldGNoQ3Vpc2luZXMoKTtcclxufSk7XHJcblxyXG4vKipcclxuICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgYW5kIHNldCB0aGVpciBIVE1MLlxyXG4gKi9cclxuZmV0Y2hOZWlnaGJvcmhvb2RzID0gKCkgPT4ge1xyXG4gIERCSGVscGVyLmZldGNoTmVpZ2hib3Job29kcygoZXJyb3IsIG5laWdoYm9yaG9vZHMpID0+IHtcclxuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3JcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxmLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xyXG4gICAgICBmaWxsTmVpZ2hib3Job29kc0hUTUwoKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBuZWlnaGJvcmhvb2RzIEhUTUwuXHJcbiAqL1xyXG5maWxsTmVpZ2hib3Job29kc0hUTUwgPSAobmVpZ2hib3Job29kcyA9IHNlbGYubmVpZ2hib3Job29kcykgPT4ge1xyXG4gIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZWlnaGJvcmhvb2RzLXNlbGVjdCcpO1xyXG4gIG5laWdoYm9yaG9vZHMuZm9yRWFjaChuZWlnaGJvcmhvb2QgPT4ge1xyXG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xyXG4gICAgb3B0aW9uLnZhbHVlID0gbmVpZ2hib3Job29kO1xyXG4gICAgc2VsZWN0LmFwcGVuZChvcHRpb24pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2ggYWxsIGN1aXNpbmVzIGFuZCBzZXQgdGhlaXIgSFRNTC5cclxuICovXHJcbmZldGNoQ3Vpc2luZXMgPSAoKSA9PiB7XHJcbiAgREJIZWxwZXIuZmV0Y2hDdWlzaW5lcygoZXJyb3IsIGN1aXNpbmVzKSA9PiB7XHJcbiAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbGYuY3Vpc2luZXMgPSBjdWlzaW5lcztcclxuICAgICAgZmlsbEN1aXNpbmVzSFRNTCgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IGN1aXNpbmVzIEhUTUwuXHJcbiAqL1xyXG5maWxsQ3Vpc2luZXNIVE1MID0gKGN1aXNpbmVzID0gc2VsZi5jdWlzaW5lcykgPT4ge1xyXG4gIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcclxuXHJcbiAgY3Vpc2luZXMuZm9yRWFjaChjdWlzaW5lID0+IHtcclxuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLmlubmVySFRNTCA9IGN1aXNpbmU7XHJcbiAgICBvcHRpb24udmFsdWUgPSBjdWlzaW5lO1xyXG4gICAgc2VsZWN0LmFwcGVuZChvcHRpb24pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgbGV0IGxvYyA9IHtcclxuICAgIGxhdDogNDAuNzIyMjE2LFxyXG4gICAgbG5nOiAtNzMuOTg3NTAxXHJcbiAgfTtcclxuICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLCB7XHJcbiAgICB6b29tOiAxMixcclxuICAgIGNlbnRlcjogbG9jLFxyXG4gICAgc2Nyb2xsd2hlZWw6IGZhbHNlXHJcbiAgfSk7XHJcbiAgdXBkYXRlUmVzdGF1cmFudHMoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSBwYWdlIGFuZCBtYXAgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMuXHJcbiAqL1xyXG51cGRhdGVSZXN0YXVyYW50cyA9ICgpID0+IHtcclxuICBjb25zdCBjU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1aXNpbmVzLXNlbGVjdCcpO1xyXG4gIGNvbnN0IG5TZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcclxuXHJcbiAgY29uc3QgY0luZGV4ID0gY1NlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG4gIGNvbnN0IG5JbmRleCA9IG5TZWxlY3Quc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgY29uc3QgY3Vpc2luZSA9IGNTZWxlY3RbY0luZGV4XS52YWx1ZTtcclxuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBuU2VsZWN0W25JbmRleF0udmFsdWU7XHJcblxyXG4gIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzZXRSZXN0YXVyYW50cyhyZXN0YXVyYW50cyk7XHJcbiAgICAgIGZpbGxSZXN0YXVyYW50c0hUTUwoKTtcclxuICAgIH1cclxuICB9KVxyXG59XHJcblxyXG4vKipcclxuICogQ2xlYXIgY3VycmVudCByZXN0YXVyYW50cywgdGhlaXIgSFRNTCBhbmQgcmVtb3ZlIHRoZWlyIG1hcCBtYXJrZXJzLlxyXG4gKi9cclxucmVzZXRSZXN0YXVyYW50cyA9IChyZXN0YXVyYW50cykgPT4ge1xyXG4gIC8vIFJlbW92ZSBhbGwgcmVzdGF1cmFudHNcclxuICBzZWxmLnJlc3RhdXJhbnRzID0gW107XHJcbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG4gIHVsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICAvLyBSZW1vdmUgYWxsIG1hcCBtYXJrZXJzXHJcbiAgc2VsZi5tYXJrZXJzLmZvckVhY2gobSA9PiBtLnNldE1hcChudWxsKSk7XHJcbiAgc2VsZi5tYXJrZXJzID0gW107XHJcbiAgc2VsZi5yZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFsbCByZXN0YXVyYW50cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmZpbGxSZXN0YXVyYW50c0hUTUwgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG4gIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICB1bC5hcHBlbmQoY3JlYXRlUmVzdGF1cmFudEhUTUwocmVzdGF1cmFudCkpO1xyXG4gIH0pO1xyXG4gIGFkZE1hcmtlcnNUb01hcCgpO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTC5cclxuICovXHJcbmNyZWF0ZVJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQpID0+IHtcclxuICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcblxyXG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xyXG4gIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gIGxpLmFwcGVuZChuYW1lKTtcclxuXHJcbiAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gIGltYWdlLnNyYyA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICBpbWFnZS5zZXRBdHRyaWJ1dGUoXCJzcmNzZXRcIiwgYC9pbWdfcmVzcC8ke3Jlc3RhdXJhbnQuaWR9LTMwMC5qcGcgMXgsIC9pbWdfcmVzcC8ke3Jlc3RhdXJhbnQuaWR9LTYwMC5qcGcgMnhgKTtcclxuICBpbWFnZS5zZXRBdHRyaWJ1dGUoXCJhbHRcIiwgYEFuIGltYWdlIG9mIHRoZSByZXN0YXVyYW50ICR7cmVzdGF1cmFudC5uYW1lfSBpbiAke3Jlc3RhdXJhbnQubmVpZ2hib3Job29kfS5gKTtcclxuICBsaS5hcHBlbmQoaW1hZ2UpO1xyXG5cclxuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgbmVpZ2hib3Job29kLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmVpZ2hib3Job29kO1xyXG4gIG5laWdoYm9yaG9vZC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInJlc3QtbmVpZ2hib3Job29kXCIpO1xyXG4gIGxpLmFwcGVuZChuZWlnaGJvcmhvb2QpO1xyXG5cclxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gIGFkZHJlc3Muc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJyZXN0LWFkZHJlc3NcIik7XHJcbiAgbGkuYXBwZW5kKGFkZHJlc3MpO1xyXG5cclxuICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gIG1vcmUuaW5uZXJIVE1MID0gJ1ZpZXcgRGV0YWlscyc7XHJcbiAgbW9yZS5ocmVmID0gREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICBtb3JlLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgYFZpZXcgZGV0YWlscyBmb3IgdGhlIHJlc3RhdXJhbnQgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XHJcbiAgbGkuYXBwZW5kKG1vcmUpXHJcblxyXG4gIHJldHVybiBsaVxyXG59XHJcblxyXG4vKipcclxuICogQWRkIG1hcmtlcnMgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMgdG8gdGhlIG1hcC5cclxuICovXHJcbmFkZE1hcmtlcnNUb01hcCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgLy8gQWRkIG1hcmtlciB0byB0aGUgbWFwXHJcbiAgICBjb25zdCBtYXJrZXIgPSBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHNlbGYubWFwKTtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci51cmxcclxuICAgIH0pO1xyXG4gICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICB9KTtcclxufVxyXG4iLCIgICAgICAvKlxyXG4gICAgICAgKiBPcGVuIHRoZSBmaWx0ZXItb3B0aW9ucyBtZW51IHdoZW4gdGhlIG1lbnUgaWNvbiBpcyBjbGlja2VkLlxyXG4gICAgICAgKi9cclxuICAgICAgdmFyIG1lbnUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVudScpO1xyXG4gICAgICB2YXIgbWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKTtcclxuICAgICAgdmFyIGZpbHRlck9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1vcHRpb25zJyk7XHJcblxyXG4gICAgICBtZW51LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgICAgICAvL3NldCBhcmlhLWV4cGFuZGVkIHN0YXRlXHJcbiAgICAgICAgaWYobWVudS5nZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIpPT1cInRydWVcIil7XHJcbiAgICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIG1lbnUuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaWx0ZXJPcC5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgfSk7XHJcbiAgICAgIG1haW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PntcclxuICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgICBmaWx0ZXJPcC5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7XHJcbiAgICAgIH0pO1xyXG4iLCJzZXRUaW1lb3V0KCAoKSA9PiB7fSw1MDAwKTtcclxuICByZW1vdmVUYWJmb2N1c0Zyb21NYXAgPSAoKSA9PiB7XHJcbiAgICB3aW5kb3cub25sb2FkID0gKCkgPT57XHJcbiAgICAgIGNvbnN0IGdtYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwJyk7XHJcbiAgICAgIGdtYXBEZXNjID0gZ21hcC5xdWVyeVNlbGVjdG9yQWxsKCcqJyk7XHJcbiAgICAgIGdtYXBEZXNjLmZvckVhY2goIChkZXNjKSA9PntcclxuICAgICAgICBkZXNjLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKS5vbmxvYWQgPSByZW1vdmVUYWJmb2N1c0Zyb21NYXAoKTtcclxuXHJcbiAgd2luZG93Lm9ubG9hZCA9ICgpID0+e1xyXG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XHJcbiAgICBpZnJhbWUudGl0bGUgPSBcIkdvb2dsZSBNYXBzXCI7XHJcbiAgfVxyXG4iLCJcclxuLyoqXHJcbiAqIFJlZ2lzdGVyIGEgc2VydmljZVdvcmtlclxyXG4gKi9cclxucmVnaXN0ZXJTZXJ2aWNlV29ya2VyID0gKCkgPT4ge1xyXG4gICAgLy9jaGVjayBpZiBzZXJ2aWNlV29ya2VyIGlzIHN1cHBvcnRlZCwgb3RoZXJ3aXNlIHJldHVyblxyXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xyXG4gIFxyXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zdy5qcycpLmNhdGNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIHdlbnQgd3JvbmcuIFNlcnZpY2VXb3JrZXIgbm90IHJlZ2lzdGVyZWRcIik7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIFxyXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpOyIsInZhciBkYlByb21pc2UgPSBpZGIub3BlbignanNvblJlc3AnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcclxuICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudERhdGEnKTtcclxuICB9KTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gc3RvcmVSZXN0YXVyYW50RGF0YShqc29uRGF0YSl7XHJcblx0ZGJQcm9taXNlLnRoZW4oZGIgPT57XHJcblx0XHR2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERhdGEnLCdyZWFkd3JpdGUnKTtcclxuXHRcdHZhciByZXN0YXVyYW50RGF0YVN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHRyZXN0YXVyYW50RGF0YVN0b3JlLnB1dChqc29uRGF0YSwgJ3Jlc3RhdXJhbnRzJyk7XHJcblx0XHRyZXR1cm4gdHguY29tcGxldGU7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJlc3RhdXJhbnREYXRhKCl7XHJcblx0cmV0dXJuIGRiUHJvbWlzZS50aGVuKGRiID0+e1xyXG5cdFx0dmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHR2YXIgcmVzdGF1cmFudERhdGFTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGF0YScpO1xyXG5cdFx0cmV0dXJuIHJlc3RhdXJhbnREYXRhU3RvcmUuZ2V0KCdyZXN0YXVyYW50cycpO1xyXG5cdH0pO1xyXG59Il19
