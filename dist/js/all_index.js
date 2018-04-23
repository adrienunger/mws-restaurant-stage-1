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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwibWFpbi5qcyIsIm9mZl9jYW52YXMuanMiLCJnb29nbGVNYXBzRm9jdXMuanMiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIuanMiLCJpZGJEYXRhLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiREFUQUJBU0VfVVJMIiwicG9ydCIsImZldGNoUmVzdGF1cmFudHMiLCJjYWxsYmFjayIsImdldFJlc3RhdXJhbnREYXRhIiwidGhlbiIsInJlc3RhdXJhbnRzIiwidW5kZWZpbmVkIiwiZmV0Y2giLCJyZXNwb25zZSIsImpzb24iLCJzdG9yZVJlc3RhdXJhbnREYXRhIiwiY2F0Y2giLCJlIiwiZXJyb3IiLCJjb25zb2xlIiwibG9nIiwiZmV0Y2hSZXN0YXVyYW50QnlJZCIsImlkIiwicmVzdGF1cmFudCIsImZpbmQiLCJyIiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lIiwiY3Vpc2luZSIsInJlc3VsdHMiLCJmaWx0ZXIiLCJjdWlzaW5lX3R5cGUiLCJmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZCIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZCIsImZldGNoTmVpZ2hib3Job29kcyIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiZmV0Y2hDdWlzaW5lcyIsImN1aXNpbmVzIiwidW5pcXVlQ3Vpc2luZXMiLCJ1cmxGb3JSZXN0YXVyYW50IiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwicGhvdG9ncmFwaCIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJtYXJrZXIiLCJnb29nbGUiLCJtYXBzIiwiTWFya2VyIiwicG9zaXRpb24iLCJsYXRsbmciLCJ0aXRsZSIsIm5hbWUiLCJ1cmwiLCJhbmltYXRpb24iLCJBbmltYXRpb24iLCJEUk9QIiwibWFya2VycyIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50Iiwic2VsZiIsImZpbGxOZWlnaGJvcmhvb2RzSFRNTCIsInNlbGVjdCIsImdldEVsZW1lbnRCeUlkIiwiZm9yRWFjaCIsIm9wdGlvbiIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ2YWx1ZSIsImFwcGVuZCIsImZpbGxDdWlzaW5lc0hUTUwiLCJ3aW5kb3ciLCJpbml0TWFwIiwibG9jIiwibGF0IiwibG5nIiwiTWFwIiwiem9vbSIsImNlbnRlciIsInNjcm9sbHdoZWVsIiwidXBkYXRlUmVzdGF1cmFudHMiLCJjU2VsZWN0IiwiblNlbGVjdCIsImNJbmRleCIsInNlbGVjdGVkSW5kZXgiLCJuSW5kZXgiLCJyZXNldFJlc3RhdXJhbnRzIiwiZmlsbFJlc3RhdXJhbnRzSFRNTCIsInVsIiwibSIsInNldE1hcCIsImNyZWF0ZVJlc3RhdXJhbnRIVE1MIiwiYWRkTWFya2Vyc1RvTWFwIiwibGkiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsInNldEF0dHJpYnV0ZSIsImFsdCIsImFkZHJlc3MiLCJtb3JlIiwiaHJlZiIsImFkZExpc3RlbmVyIiwibG9jYXRpb24iLCJwdXNoIiwibWVudSIsInF1ZXJ5U2VsZWN0b3IiLCJtYWluIiwiZmlsdGVyT3AiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3QiLCJ0b2dnbGUiLCJzdG9wUHJvcGFnYXRpb24iLCJyZW1vdmUiLCJzZXRUaW1lb3V0IiwicmVtb3ZlVGFiZm9jdXNGcm9tTWFwIiwib25sb2FkIiwiZ21hcCIsImdtYXBEZXNjIiwicXVlcnlTZWxlY3RvckFsbCIsImRlc2MiLCJpZnJhbWUiLCJyZWdpc3RlclNlcnZpY2VXb3JrZXIiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwicmVnaXN0ZXIiLCJkYlByb21pc2UiLCJpZGIiLCJvcGVuIiwidXBncmFkZURiIiwiY3JlYXRlT2JqZWN0U3RvcmUiLCJqc29uRGF0YSIsImRiIiwidHgiLCJ0cmFuc2FjdGlvbiIsInJlc3RhdXJhbnREYXRhU3RvcmUiLCJvYmplY3RTdG9yZSIsInB1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VUFBU0MsU0FBVCxFQUFvQjtBQUN4REEsV0FBVUMsaUJBQVYsQ0FBNEIsZ0JBQTVCO0FBQ0QsQ0FGYSxDQUFoQjs7QUFNQSxTQUFTdkgsbUJBQVQsQ0FBNkJ3SCxRQUE3QixFQUFzQztBQUNyQ0wsV0FBVXpILElBQVYsQ0FBZStILE1BQUs7QUFDbkIsTUFBSUMsS0FBS0QsR0FBR0UsV0FBSCxDQUFlLGdCQUFmLEVBQWdDLFdBQWhDLENBQVQ7QUFDQSxNQUFJQyxzQkFBc0JGLEdBQUdHLFdBQUgsQ0FBZSxnQkFBZixDQUExQjtBQUNBRCxzQkFBb0JFLEdBQXBCLENBQXdCTixRQUF4QixFQUFrQyxhQUFsQztBQUNBLFNBQU9FLEdBQUdLLFFBQVY7QUFDQSxFQUxEO0FBTUE7O0FBRUQsU0FBU3RJLGlCQUFULEdBQTRCO0FBQzNCLFFBQU8wSCxVQUFVekgsSUFBVixDQUFlK0gsTUFBSztBQUMxQixNQUFJQyxLQUFLRCxHQUFHRSxXQUFILENBQWUsZ0JBQWYsQ0FBVDtBQUNBLE1BQUlDLHNCQUFzQkYsR0FBR0csV0FBSCxDQUFlLGdCQUFmLENBQTFCO0FBQ0EsU0FBT0Qsb0JBQW9CSSxHQUFwQixDQUF3QixhQUF4QixDQUFQO0FBQ0EsRUFKTSxDQUFQO0FBS0EiLCJmaWxlIjoiYWxsX2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENvbW1vbiBkYXRhYmFzZSBoZWxwZXIgZnVuY3Rpb25zLlxyXG4gKi9cclxuY2xhc3MgREJIZWxwZXIge1xyXG5cclxuICAvKipcclxuICAgKiBEYXRhYmFzZSBVUkwuXHJcbiAgICogQ2hhbmdlIHRoaXMgdG8gcmVzdGF1cmFudHMuanNvbiBmaWxlIGxvY2F0aW9uIG9uIHlvdXIgc2VydmVyLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xyXG4gICAgY29uc3QgcG9ydCA9IDEzMzcgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxyXG4gICAgcmV0dXJuIGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vcmVzdGF1cmFudHNgO1xyXG4gIH1cclxuXHJcblxyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBnZXRSZXN0YXVyYW50RGF0YSgpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xyXG4gICAgICAvL2NoZWNrIGlmIHRoZXJlIGlzIHJlc3RhdXJhbnQgZGF0YSBzdG9yZWQgaW4gdGhlIGRiXHJcbiAgICAgIGlmIChyZXN0YXVyYW50cyAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAvL3Jlc3RhdXJhbnQgZGF0YSBpcyBzdG9yZWQuIGV4ZWN1dGUgdGhlIGNhbGxiYWNrID0+IHBhc3MgdGhlIGRhdGEgdG8gdGhlIGFwcGxpY2F0aW9uXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc3VjY2Vzc2Z1bGx5IHNlcnZlZCBmcm9tIGlkYicpO1xyXG4gICAgICAgIC8vYWZ0ZXIgZXhlY3V0aW5nIHRoZSBjYWxsYmFjayBmZXRjaCBkYXRhIGZyb20gdGhlIG5ldHdvcmsgZm9yIGEgcG9zc2libHkgbmV3ZXIgdmVyc2lvbiBhbmQgc2F2ZSBpdCB0byBkYlxyXG4gICAgICAgIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcclxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXHJcbiAgICAgICAgLnRoZW4oanNvbiA9PntcclxuICAgICAgICAgIGNvbnN0IHJlc3RhdXJhbnRzID0ganNvbjtcclxuICAgICAgICAgIHN0b3JlUmVzdGF1cmFudERhdGEocmVzdGF1cmFudHMpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGUgPT57XHJcbiAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke2V9YCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICAvL25vIGRhdGEgc2F2ZWQgaW4gdGhlIGRiID0+IGZldGNoIGl0IGZyb20gdGhlIG5ldHdvcmssIHBhc3MgaXQgdG8gdGhlIGFwcGxpY2F0aW9uIGFuZCBzYXZlIGl0IGluIGRiXHJcbiAgICAgICAgZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxyXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgICAgICAudGhlbihqc29uID0+e1xyXG4gICAgICAgICAgY29uc3QgcmVzdGF1cmFudHMgPSBqc29uO1xyXG4gICAgICAgICAgc3RvcmVSZXN0YXVyYW50RGF0YShyZXN0YXVyYW50cyk7XHJcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZSA9PntcclxuICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7ZX1gKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSkuY2F0Y2goZSA9PntcclxuICAgICAgY29uc29sZS5sb2coYEVycm9yIHdoaWxlIHRyeWluZyB0byBnZXQgcmVzdGF1cmFudCBkYXRhIHZpYSBpbmRleGVkREI6ICR7ZX1gKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGEgcmVzdGF1cmFudCBieSBpdHMgSUQuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XHJcbiAgICAgICAgaWYgKHJlc3RhdXJhbnQpIHsgLy8gR290IHRoZSByZXN0YXVyYW50XHJcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0IGluIHRoZSBkYXRhYmFzZVxyXG4gICAgICAgICAgY2FsbGJhY2soJ1Jlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QnLCBudWxsKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzICB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZ1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIGN1aXNpbmUgdHlwZVxyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gbmVpZ2hib3Job29kXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzXHJcbiAgICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVOZWlnaGJvcmhvb2RzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoQ3Vpc2luZXMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIGN1aXNpbmVzIGZyb20gYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSlcclxuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cclxuICAgKi9cclxuICBzdGF0aWMgdXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cclxuICAgKi9cclxuICBzdGF0aWMgaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgIHJldHVybiAoYC9pbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGh9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXHJcbiAgICovXHJcbiAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XHJcbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcclxuICAgICAgcG9zaXRpb246IHJlc3RhdXJhbnQubGF0bG5nLFxyXG4gICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxyXG4gICAgICB1cmw6IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCksXHJcbiAgICAgIG1hcDogbWFwLFxyXG4gICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QfVxyXG4gICAgKTtcclxuICAgIHJldHVybiBtYXJrZXI7XHJcbiAgfVxyXG5cclxufVxyXG4iLCJsZXQgcmVzdGF1cmFudHMsXHJcbiAgbmVpZ2hib3Job29kcyxcclxuICBjdWlzaW5lc1xyXG52YXIgbWFwXHJcbnZhciBtYXJrZXJzID0gW11cclxuXHJcblxyXG4vKipcclxuICogRmV0Y2ggbmVpZ2hib3Job29kcyBhbmQgY3Vpc2luZXMgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXHJcbiAqL1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XHJcbiAgZmV0Y2hOZWlnaGJvcmhvb2RzKCk7XHJcbiAgZmV0Y2hDdWlzaW5lcygpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5mZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XHJcbiAgREJIZWxwZXIuZmV0Y2hOZWlnaGJvcmhvb2RzKChlcnJvciwgbmVpZ2hib3Job29kcykgPT4ge1xyXG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvclxyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbGYubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHM7XHJcbiAgICAgIGZpbGxOZWlnaGJvcmhvb2RzSFRNTCgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IG5laWdoYm9yaG9vZHMgSFRNTC5cclxuICovXHJcbmZpbGxOZWlnaGJvcmhvb2RzSFRNTCA9IChuZWlnaGJvcmhvb2RzID0gc2VsZi5uZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcbiAgbmVpZ2hib3Job29kcy5mb3JFYWNoKG5laWdoYm9yaG9vZCA9PiB7XHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBvcHRpb24udmFsdWUgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgY3Vpc2luZXMgYW5kIHNldCB0aGVpciBIVE1MLlxyXG4gKi9cclxuZmV0Y2hDdWlzaW5lcyA9ICgpID0+IHtcclxuICBEQkhlbHBlci5mZXRjaEN1aXNpbmVzKChlcnJvciwgY3Vpc2luZXMpID0+IHtcclxuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsZi5jdWlzaW5lcyA9IGN1aXNpbmVzO1xyXG4gICAgICBmaWxsQ3Vpc2luZXNIVE1MKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgY3Vpc2luZXMgSFRNTC5cclxuICovXHJcbmZpbGxDdWlzaW5lc0hUTUwgPSAoY3Vpc2luZXMgPSBzZWxmLmN1aXNpbmVzKSA9PiB7XHJcbiAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1aXNpbmVzLXNlbGVjdCcpO1xyXG5cclxuICBjdWlzaW5lcy5mb3JFYWNoKGN1aXNpbmUgPT4ge1xyXG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgIG9wdGlvbi52YWx1ZSA9IGN1aXNpbmU7XHJcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXHJcbiAqL1xyXG53aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcclxuICBsZXQgbG9jID0ge1xyXG4gICAgbGF0OiA0MC43MjIyMTYsXHJcbiAgICBsbmc6IC03My45ODc1MDFcclxuICB9O1xyXG4gIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcclxuICAgIHpvb206IDEyLFxyXG4gICAgY2VudGVyOiBsb2MsXHJcbiAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICB9KTtcclxuICB1cGRhdGVSZXN0YXVyYW50cygpO1xyXG59XHJcblxyXG4vKipcclxuICogVXBkYXRlIHBhZ2UgYW5kIG1hcCBmb3IgY3VycmVudCByZXN0YXVyYW50cy5cclxuICovXHJcbnVwZGF0ZVJlc3RhdXJhbnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGNTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcbiAgY29uc3QgblNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZWlnaGJvcmhvb2RzLXNlbGVjdCcpO1xyXG5cclxuICBjb25zdCBjSW5kZXggPSBjU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcbiAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICBjb25zdCBjdWlzaW5lID0gY1NlbGVjdFtjSW5kZXhdLnZhbHVlO1xyXG4gIGNvbnN0IG5laWdoYm9yaG9vZCA9IG5TZWxlY3RbbkluZGV4XS52YWx1ZTtcclxuXHJcbiAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXNldFJlc3RhdXJhbnRzKHJlc3RhdXJhbnRzKTtcclxuICAgICAgZmlsbFJlc3RhdXJhbnRzSFRNTCgpO1xyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGVhciBjdXJyZW50IHJlc3RhdXJhbnRzLCB0aGVpciBIVE1MIGFuZCByZW1vdmUgdGhlaXIgbWFwIG1hcmtlcnMuXHJcbiAqL1xyXG5yZXNldFJlc3RhdXJhbnRzID0gKHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgLy8gUmVtb3ZlIGFsbCByZXN0YXVyYW50c1xyXG4gIHNlbGYucmVzdGF1cmFudHMgPSBbXTtcclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgdWwuaW5uZXJIVE1MID0gJyc7XHJcblxyXG4gIC8vIFJlbW92ZSBhbGwgbWFwIG1hcmtlcnNcclxuICBzZWxmLm1hcmtlcnMuZm9yRWFjaChtID0+IG0uc2V0TWFwKG51bGwpKTtcclxuICBzZWxmLm1hcmtlcnMgPSBbXTtcclxuICBzZWxmLnJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYWxsIHJlc3RhdXJhbnRzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuZmlsbFJlc3RhdXJhbnRzSFRNTCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgIHVsLmFwcGVuZChjcmVhdGVSZXN0YXVyYW50SFRNTChyZXN0YXVyYW50KSk7XHJcbiAgfSk7XHJcbiAgYWRkTWFya2Vyc1RvTWFwKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MLlxyXG4gKi9cclxuY3JlYXRlUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCkgPT4ge1xyXG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuXHJcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XHJcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgbGkuYXBwZW5kKG5hbWUpO1xyXG5cclxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XHJcbiAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gIGltYWdlLnNldEF0dHJpYnV0ZShcInNyY3NldFwiLCBgL2ltZ19yZXNwLyR7cmVzdGF1cmFudC5pZH0tMzAwLmpwZyAxeCwgL2ltZ19yZXNwLyR7cmVzdGF1cmFudC5pZH0tNjAwLmpwZyAyeGApO1xyXG4gIGltYWdlLnNldEF0dHJpYnV0ZShcImFsdFwiLCByZXN0YXVyYW50LmFsdCk7XHJcbiAgbGkuYXBwZW5kKGltYWdlKTtcclxuXHJcbiAgY29uc3QgbmVpZ2hib3Job29kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIG5laWdoYm9yaG9vZC5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5laWdoYm9yaG9vZDtcclxuICBuZWlnaGJvcmhvb2Quc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJyZXN0LW5laWdoYm9yaG9vZFwiKTtcclxuICBsaS5hcHBlbmQobmVpZ2hib3Job29kKTtcclxuXHJcbiAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBhZGRyZXNzLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuYWRkcmVzcztcclxuICBhZGRyZXNzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwicmVzdC1hZGRyZXNzXCIpO1xyXG4gIGxpLmFwcGVuZChhZGRyZXNzKTtcclxuXHJcbiAgY29uc3QgbW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICBtb3JlLmlubmVySFRNTCA9ICdWaWV3IERldGFpbHMnO1xyXG4gIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgbW9yZS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGBWaWV3IGRldGFpbHMgZm9yIHRoZSByZXN0YXVyYW50ICR7cmVzdGF1cmFudC5uYW1lfWApO1xyXG4gIGxpLmFwcGVuZChtb3JlKVxyXG5cclxuICByZXR1cm4gbGlcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZCBtYXJrZXJzIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzIHRvIHRoZSBtYXAuXHJcbiAqL1xyXG5hZGRNYXJrZXJzVG9NYXAgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgIC8vIEFkZCBtYXJrZXIgdG8gdGhlIG1hcFxyXG4gICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdjbGljaycsICgpID0+IHtcclxuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBtYXJrZXIudXJsXHJcbiAgICB9KTtcclxuICAgIHNlbGYubWFya2Vycy5wdXNoKG1hcmtlcik7XHJcbiAgfSk7XHJcbn1cclxuIiwiICAgICAgLypcclxuICAgICAgICogT3BlbiB0aGUgZmlsdGVyLW9wdGlvbnMgbWVudSB3aGVuIHRoZSBtZW51IGljb24gaXMgY2xpY2tlZC5cclxuICAgICAgICovXHJcbiAgICAgIHZhciBtZW51ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lbnUnKTtcclxuICAgICAgdmFyIG1haW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7XHJcbiAgICAgIHZhciBmaWx0ZXJPcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5maWx0ZXItb3B0aW9ucycpO1xyXG5cclxuICAgICAgbWVudS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgLy9zZXQgYXJpYS1leHBhbmRlZCBzdGF0ZVxyXG4gICAgICAgIGlmKG1lbnUuZ2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKT09XCJ0cnVlXCIpe1xyXG4gICAgICAgICAgbWVudS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBtZW51LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJ0cnVlXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlsdGVyT3AuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBtYWluLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT57XHJcbiAgICAgICAgbWVudS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XHJcbiAgICAgICAgZmlsdGVyT3AuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpO1xyXG4gICAgICB9KTtcclxuIiwic2V0VGltZW91dCggKCkgPT4ge30sNTAwMCk7XHJcbiAgcmVtb3ZlVGFiZm9jdXNGcm9tTWFwID0gKCkgPT4ge1xyXG4gICAgd2luZG93Lm9ubG9hZCA9ICgpID0+e1xyXG4gICAgICBjb25zdCBnbWFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21hcCcpO1xyXG4gICAgICBnbWFwRGVzYyA9IGdtYXAucXVlcnlTZWxlY3RvckFsbCgnKicpO1xyXG4gICAgICBnbWFwRGVzYy5mb3JFYWNoKCAoZGVzYykgPT57XHJcbiAgICAgICAgZGVzYy5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIikub25sb2FkID0gcmVtb3ZlVGFiZm9jdXNGcm9tTWFwKCk7XHJcblxyXG4gIHdpbmRvdy5vbmxvYWQgPSAoKSA9PntcclxuICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZScpO1xyXG4gICAgaWZyYW1lLnRpdGxlID0gXCJHb29nbGUgTWFwc1wiO1xyXG4gIH1cclxuIiwiXHJcbi8qKlxyXG4gKiBSZWdpc3RlciBhIHNlcnZpY2VXb3JrZXJcclxuICovXHJcbnJlZ2lzdGVyU2VydmljZVdvcmtlciA9ICgpID0+IHtcclxuICAgIC8vY2hlY2sgaWYgc2VydmljZVdvcmtlciBpcyBzdXBwb3J0ZWQsIG90aGVyd2lzZSByZXR1cm5cclxuICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHJldHVybjtcclxuICBcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnKS5jYXRjaChmdW5jdGlvbigpe1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyB3ZW50IHdyb25nLiBTZXJ2aWNlV29ya2VyIG5vdCByZWdpc3RlcmVkXCIpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICBcclxuICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTsiLCJ2YXIgZGJQcm9taXNlID0gaWRiLm9wZW4oJ2pzb25SZXNwJywgMSwgZnVuY3Rpb24odXBncmFkZURiKSB7XHJcbiAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcbiAgfSk7XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIHN0b3JlUmVzdGF1cmFudERhdGEoanNvbkRhdGEpe1xyXG5cdGRiUHJvbWlzZS50aGVuKGRiID0+e1xyXG5cdFx0dmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnREYXRhJywncmVhZHdyaXRlJyk7XHJcblx0XHR2YXIgcmVzdGF1cmFudERhdGFTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGF0YScpO1xyXG5cdFx0cmVzdGF1cmFudERhdGFTdG9yZS5wdXQoanNvbkRhdGEsICdyZXN0YXVyYW50cycpO1xyXG5cdFx0cmV0dXJuIHR4LmNvbXBsZXRlO1xyXG5cdH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRSZXN0YXVyYW50RGF0YSgpe1xyXG5cdHJldHVybiBkYlByb21pc2UudGhlbihkYiA9PntcclxuXHRcdHZhciB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50RGF0YScpO1xyXG5cdFx0dmFyIHJlc3RhdXJhbnREYXRhU3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudERhdGEnKTtcclxuXHRcdHJldHVybiByZXN0YXVyYW50RGF0YVN0b3JlLmdldCgncmVzdGF1cmFudHMnKTtcclxuXHR9KTtcclxufSJdfQ==
