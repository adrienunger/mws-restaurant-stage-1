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
let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("srcset", `/img_resp/${restaurant.id}-400.jpg 1x, /img_resp/${restaurant.id}-800.jpg 2x`);
  image.setAttribute("alt", restaurant.alt);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.setAttribute("class", "rev-name");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.setAttribute("class", "rev-date");
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.setAttribute("class", "rev-rating");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute("class", "rev-comments");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwicmVzdGF1cmFudF9pbmZvLmpzIiwiZ29vZ2xlTWFwc0ZvY3VzLmpzIiwicmVnaXN0ZXJTZXJ2aWNlV29ya2VyLmpzIiwiaWRiRGF0YS5qcyJdLCJuYW1lcyI6WyJEQkhlbHBlciIsIkRBVEFCQVNFX1VSTCIsInBvcnQiLCJmZXRjaFJlc3RhdXJhbnRzIiwiY2FsbGJhY2siLCJnZXRSZXN0YXVyYW50RGF0YSIsInRoZW4iLCJyZXN0YXVyYW50cyIsInVuZGVmaW5lZCIsImZldGNoIiwicmVzcG9uc2UiLCJqc29uIiwic3RvcmVSZXN0YXVyYW50RGF0YSIsImNhdGNoIiwiZSIsImVycm9yIiwiY29uc29sZSIsImxvZyIsImZldGNoUmVzdGF1cmFudEJ5SWQiLCJpZCIsInJlc3RhdXJhbnQiLCJmaW5kIiwiciIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZSIsImN1aXNpbmUiLCJyZXN1bHRzIiwiZmlsdGVyIiwiY3Vpc2luZV90eXBlIiwiZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QiLCJuZWlnaGJvcmhvb2QiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJuZWlnaGJvcmhvb2RzIiwibWFwIiwidiIsImkiLCJ1bmlxdWVOZWlnaGJvcmhvb2RzIiwiaW5kZXhPZiIsImZldGNoQ3Vpc2luZXMiLCJjdWlzaW5lcyIsInVuaXF1ZUN1aXNpbmVzIiwidXJsRm9yUmVzdGF1cmFudCIsImltYWdlVXJsRm9yUmVzdGF1cmFudCIsInBob3RvZ3JhcGgiLCJtYXBNYXJrZXJGb3JSZXN0YXVyYW50IiwibWFya2VyIiwiZ29vZ2xlIiwibWFwcyIsIk1hcmtlciIsInBvc2l0aW9uIiwibGF0bG5nIiwidGl0bGUiLCJuYW1lIiwidXJsIiwiYW5pbWF0aW9uIiwiQW5pbWF0aW9uIiwiRFJPUCIsIndpbmRvdyIsImluaXRNYXAiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwic2VsZiIsIk1hcCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJ6b29tIiwiY2VudGVyIiwic2Nyb2xsd2hlZWwiLCJmaWxsQnJlYWRjcnVtYiIsImdldFBhcmFtZXRlckJ5TmFtZSIsImZpbGxSZXN0YXVyYW50SFRNTCIsImlubmVySFRNTCIsImFkZHJlc3MiLCJpbWFnZSIsImNsYXNzTmFtZSIsInNyYyIsInNldEF0dHJpYnV0ZSIsImFsdCIsIm9wZXJhdGluZ19ob3VycyIsImZpbGxSZXN0YXVyYW50SG91cnNIVE1MIiwiZmlsbFJldmlld3NIVE1MIiwib3BlcmF0aW5nSG91cnMiLCJob3VycyIsImtleSIsInJvdyIsImNyZWF0ZUVsZW1lbnQiLCJkYXkiLCJhcHBlbmRDaGlsZCIsInRpbWUiLCJyZXZpZXdzIiwiY29udGFpbmVyIiwibm9SZXZpZXdzIiwidWwiLCJmb3JFYWNoIiwicmV2aWV3IiwiY3JlYXRlUmV2aWV3SFRNTCIsImxpIiwiZGF0ZSIsInJhdGluZyIsImNvbW1lbnRzIiwiYnJlYWRjcnVtYiIsImxvY2F0aW9uIiwiaHJlZiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsImV4ZWMiLCJkZWNvZGVVUklDb21wb25lbnQiLCJzZXRUaW1lb3V0IiwicmVtb3ZlVGFiZm9jdXNGcm9tTWFwIiwib25sb2FkIiwiZ21hcCIsInF1ZXJ5U2VsZWN0b3IiLCJnbWFwRGVzYyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJkZXNjIiwiaWZyYW1lIiwicmVnaXN0ZXJTZXJ2aWNlV29ya2VyIiwibmF2aWdhdG9yIiwic2VydmljZVdvcmtlciIsInJlZ2lzdGVyIiwiZGJQcm9taXNlIiwiaWRiIiwib3BlbiIsInVwZ3JhZGVEYiIsImNyZWF0ZU9iamVjdFN0b3JlIiwianNvbkRhdGEiLCJkYiIsInR4IiwidHJhbnNhY3Rpb24iLCJyZXN0YXVyYW50RGF0YVN0b3JlIiwib2JqZWN0U3RvcmUiLCJwdXQiLCJjb21wbGV0ZSIsImdldCJdLCJtYXBwaW5ncyI6IkFBQUE7OztBQUdBLE1BQU1BLFFBQU4s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QkksR0FBcEIsQ0FBd0IsYUFBeEIsQ0FBUDtBQUNBLEVBSk0sQ0FBUDtBQUtBIiwiZmlsZSI6ImFsbF9yZXN0YXVyYW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENvbW1vbiBkYXRhYmFzZSBoZWxwZXIgZnVuY3Rpb25zLlxyXG4gKi9cclxuY2xhc3MgREJIZWxwZXIge1xyXG5cclxuICAvKipcclxuICAgKiBEYXRhYmFzZSBVUkwuXHJcbiAgICogQ2hhbmdlIHRoaXMgdG8gcmVzdGF1cmFudHMuanNvbiBmaWxlIGxvY2F0aW9uIG9uIHlvdXIgc2VydmVyLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xyXG4gICAgY29uc3QgcG9ydCA9IDEzMzcgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxyXG4gICAgcmV0dXJuIGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vcmVzdGF1cmFudHNgO1xyXG4gIH1cclxuXHJcblxyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBnZXRSZXN0YXVyYW50RGF0YSgpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xyXG4gICAgICAvL2NoZWNrIGlmIHRoZXJlIGlzIHJlc3RhdXJhbnQgZGF0YSBzdG9yZWQgaW4gdGhlIGRiXHJcbiAgICAgIGlmIChyZXN0YXVyYW50cyAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAvL3Jlc3RhdXJhbnQgZGF0YSBpcyBzdG9yZWQuIGV4ZWN1dGUgdGhlIGNhbGxiYWNrID0+IHBhc3MgdGhlIGRhdGEgdG8gdGhlIGFwcGxpY2F0aW9uXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc3VjY2Vzc2Z1bGx5IHNlcnZlZCBmcm9tIGlkYicpO1xyXG4gICAgICAgIC8vYWZ0ZXIgZXhlY3V0aW5nIHRoZSBjYWxsYmFjayBmZXRjaCBkYXRhIGZyb20gdGhlIG5ldHdvcmsgZm9yIGEgcG9zc2libHkgbmV3ZXIgdmVyc2lvbiBhbmQgc2F2ZSBpdCB0byBkYlxyXG4gICAgICAgIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcclxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXHJcbiAgICAgICAgLnRoZW4oanNvbiA9PntcclxuICAgICAgICAgIGNvbnN0IHJlc3RhdXJhbnRzID0ganNvbjtcclxuICAgICAgICAgIHN0b3JlUmVzdGF1cmFudERhdGEocmVzdGF1cmFudHMpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGUgPT57XHJcbiAgICAgICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke2V9YCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICAvL25vIGRhdGEgc2F2ZWQgaW4gdGhlIGRiID0+IGZldGNoIGl0IGZyb20gdGhlIG5ldHdvcmssIHBhc3MgaXQgdG8gdGhlIGFwcGxpY2F0aW9uIGFuZCBzYXZlIGl0IGluIGRiXHJcbiAgICAgICAgZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxyXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgICAgICAudGhlbihqc29uID0+e1xyXG4gICAgICAgICAgY29uc3QgcmVzdGF1cmFudHMgPSBqc29uO1xyXG4gICAgICAgICAgc3RvcmVSZXN0YXVyYW50RGF0YShyZXN0YXVyYW50cyk7XHJcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZSA9PntcclxuICAgICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7ZX1gKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSkuY2F0Y2goZSA9PntcclxuICAgICAgY29uc29sZS5sb2coYEVycm9yIHdoaWxlIHRyeWluZyB0byBnZXQgcmVzdGF1cmFudCBkYXRhIHZpYSBpbmRleGVkREI6ICR7ZX1gKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGEgcmVzdGF1cmFudCBieSBpdHMgSUQuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XHJcbiAgICAgICAgaWYgKHJlc3RhdXJhbnQpIHsgLy8gR290IHRoZSByZXN0YXVyYW50XHJcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0IGluIHRoZSBkYXRhYmFzZVxyXG4gICAgICAgICAgY2FsbGJhY2soJ1Jlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QnLCBudWxsKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzICB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZ1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIGN1aXNpbmUgdHlwZVxyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gbmVpZ2hib3Job29kXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzXHJcbiAgICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVOZWlnaGJvcmhvb2RzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoQ3Vpc2luZXMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIGN1aXNpbmVzIGZyb20gYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSlcclxuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cclxuICAgKi9cclxuICBzdGF0aWMgdXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cclxuICAgKi9cclxuICBzdGF0aWMgaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgIHJldHVybiAoYC9pbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGh9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXHJcbiAgICovXHJcbiAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XHJcbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcclxuICAgICAgcG9zaXRpb246IHJlc3RhdXJhbnQubGF0bG5nLFxyXG4gICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxyXG4gICAgICB1cmw6IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCksXHJcbiAgICAgIG1hcDogbWFwLFxyXG4gICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QfVxyXG4gICAgKTtcclxuICAgIHJldHVybiBtYXJrZXI7XHJcbiAgfVxyXG5cclxufVxyXG4iLCJsZXQgcmVzdGF1cmFudDtcclxudmFyIG1hcDtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXHJcbiAqL1xyXG53aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcclxuICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xyXG4gICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLCB7XHJcbiAgICAgICAgem9vbTogMTYsXHJcbiAgICAgICAgY2VudGVyOiByZXN0YXVyYW50LmxhdGxuZyxcclxuICAgICAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICAgIGZpbGxCcmVhZGNydW1iKCk7XHJcbiAgICAgIERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQoc2VsZi5yZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXHJcbiAqL1xyXG5mZXRjaFJlc3RhdXJhbnRGcm9tVVJMID0gKGNhbGxiYWNrKSA9PiB7XHJcbiAgaWYgKHNlbGYucmVzdGF1cmFudCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcclxuICAgIGNhbGxiYWNrKG51bGwsIHNlbGYucmVzdGF1cmFudClcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgaWQgPSBnZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XHJcbiAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcclxuICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJ1xyXG4gICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCAoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcclxuICAgICAgc2VsZi5yZXN0YXVyYW50ID0gcmVzdGF1cmFudDtcclxuICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGZpbGxSZXN0YXVyYW50SFRNTCgpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KVxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlXHJcbiAqL1xyXG5maWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xyXG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1uYW1lJyk7XHJcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcblxyXG4gIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XHJcbiAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XHJcblxyXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nJyk7XHJcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJ1xyXG4gIGltYWdlLnNyYyA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICBpbWFnZS5zZXRBdHRyaWJ1dGUoXCJzcmNzZXRcIiwgYC9pbWdfcmVzcC8ke3Jlc3RhdXJhbnQuaWR9LTQwMC5qcGcgMXgsIC9pbWdfcmVzcC8ke3Jlc3RhdXJhbnQuaWR9LTgwMC5qcGcgMnhgKTtcclxuICBpbWFnZS5zZXRBdHRyaWJ1dGUoXCJhbHRcIiwgcmVzdGF1cmFudC5hbHQpO1xyXG5cclxuICBjb25zdCBjdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY3Vpc2luZScpO1xyXG4gIGN1aXNpbmUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5jdWlzaW5lX3R5cGU7XHJcblxyXG4gIC8vIGZpbGwgb3BlcmF0aW5nIGhvdXJzXHJcbiAgaWYgKHJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSB7XHJcbiAgICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpO1xyXG4gIH1cclxuICAvLyBmaWxsIHJldmlld3NcclxuICBmaWxsUmV2aWV3c0hUTUwoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IG9wZXJhdGluZyBob3VycyBIVE1MIHRhYmxlIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5maWxsUmVzdGF1cmFudEhvdXJzSFRNTCA9IChvcGVyYXRpbmdIb3VycyA9IHNlbGYucmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpID0+IHtcclxuICBjb25zdCBob3VycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWhvdXJzJyk7XHJcbiAgZm9yIChsZXQga2V5IGluIG9wZXJhdGluZ0hvdXJzKSB7XHJcbiAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xyXG5cclxuICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICBkYXkuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgcm93LmFwcGVuZENoaWxkKGRheSk7XHJcblxyXG4gICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICB0aW1lLmlubmVySFRNTCA9IG9wZXJhdGluZ0hvdXJzW2tleV07XHJcbiAgICByb3cuYXBwZW5kQ2hpbGQodGltZSk7XHJcblxyXG4gICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYWxsIHJldmlld3MgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5maWxsUmV2aWV3c0hUTUwgPSAocmV2aWV3cyA9IHNlbGYucmVzdGF1cmFudC5yZXZpZXdzKSA9PiB7XHJcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtY29udGFpbmVyJyk7XHJcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xyXG4gIHRpdGxlLmlubmVySFRNTCA9ICdSZXZpZXdzJztcclxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGl0bGUpO1xyXG5cclxuICBpZiAoIXJldmlld3MpIHtcclxuICAgIGNvbnN0IG5vUmV2aWV3cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub1Jldmlld3MpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcclxuICByZXZpZXdzLmZvckVhY2gocmV2aWV3ID0+IHtcclxuICAgIHVsLmFwcGVuZENoaWxkKGNyZWF0ZVJldmlld0hUTUwocmV2aWV3KSk7XHJcbiAgfSk7XHJcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXZpZXcgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY3JlYXRlUmV2aWV3SFRNTCA9IChyZXZpZXcpID0+IHtcclxuICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBuYW1lLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwicmV2LW5hbWVcIik7XHJcbiAgbmFtZS5pbm5lckhUTUwgPSByZXZpZXcubmFtZTtcclxuICBsaS5hcHBlbmRDaGlsZChuYW1lKTtcclxuXHJcbiAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBkYXRlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwicmV2LWRhdGVcIik7XHJcbiAgZGF0ZS5pbm5lckhUTUwgPSByZXZpZXcuZGF0ZTtcclxuICBsaS5hcHBlbmRDaGlsZChkYXRlKTtcclxuXHJcbiAgY29uc3QgcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIHJhdGluZy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInJldi1yYXRpbmdcIik7XHJcbiAgcmF0aW5nLmlubmVySFRNTCA9IGBSYXRpbmc6ICR7cmV2aWV3LnJhdGluZ31gO1xyXG4gIGxpLmFwcGVuZENoaWxkKHJhdGluZyk7XHJcblxyXG4gIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIGNvbW1lbnRzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwicmV2LWNvbW1lbnRzXCIpO1xyXG4gIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcclxuICBsaS5hcHBlbmRDaGlsZChjb21tZW50cyk7XHJcblxyXG4gIHJldHVybiBsaTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XHJcbiAqL1xyXG5maWxsQnJlYWRjcnVtYiA9IChyZXN0YXVyYW50PXNlbGYucmVzdGF1cmFudCkgPT4ge1xyXG4gIGNvbnN0IGJyZWFkY3J1bWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnJlYWRjcnVtYicpO1xyXG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICBsaS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgYnJlYWRjcnVtYi5hcHBlbmRDaGlsZChsaSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBwYXJhbWV0ZXIgYnkgbmFtZSBmcm9tIHBhZ2UgVVJMLlxyXG4gKi9cclxuZ2V0UGFyYW1ldGVyQnlOYW1lID0gKG5hbWUsIHVybCkgPT4ge1xyXG4gIGlmICghdXJsKVxyXG4gICAgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xyXG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgWz8mXSR7bmFtZX0oPShbXiYjXSopfCZ8I3wkKWApLFxyXG4gICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcclxuICBpZiAoIXJlc3VsdHMpXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICBpZiAoIXJlc3VsdHNbMl0pXHJcbiAgICByZXR1cm4gJyc7XHJcbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcclxufVxyXG4iLCJzZXRUaW1lb3V0KCAoKSA9PiB7fSw1MDAwKTtcclxuICByZW1vdmVUYWJmb2N1c0Zyb21NYXAgPSAoKSA9PiB7XHJcbiAgICB3aW5kb3cub25sb2FkID0gKCkgPT57XHJcbiAgICAgIGNvbnN0IGdtYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwJyk7XHJcbiAgICAgIGdtYXBEZXNjID0gZ21hcC5xdWVyeVNlbGVjdG9yQWxsKCcqJyk7XHJcbiAgICAgIGdtYXBEZXNjLmZvckVhY2goIChkZXNjKSA9PntcclxuICAgICAgICBkZXNjLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKS5vbmxvYWQgPSByZW1vdmVUYWJmb2N1c0Zyb21NYXAoKTtcclxuXHJcbiAgd2luZG93Lm9ubG9hZCA9ICgpID0+e1xyXG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XHJcbiAgICBpZnJhbWUudGl0bGUgPSBcIkdvb2dsZSBNYXBzXCI7XHJcbiAgfVxyXG4iLCJcclxuLyoqXHJcbiAqIFJlZ2lzdGVyIGEgc2VydmljZVdvcmtlclxyXG4gKi9cclxucmVnaXN0ZXJTZXJ2aWNlV29ya2VyID0gKCkgPT4ge1xyXG4gICAgLy9jaGVjayBpZiBzZXJ2aWNlV29ya2VyIGlzIHN1cHBvcnRlZCwgb3RoZXJ3aXNlIHJldHVyblxyXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xyXG4gIFxyXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zdy5qcycpLmNhdGNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIHdlbnQgd3JvbmcuIFNlcnZpY2VXb3JrZXIgbm90IHJlZ2lzdGVyZWRcIik7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIFxyXG4gIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpOyIsInZhciBkYlByb21pc2UgPSBpZGIub3BlbignanNvblJlc3AnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcclxuICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudERhdGEnKTtcclxuICB9KTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gc3RvcmVSZXN0YXVyYW50RGF0YShqc29uRGF0YSl7XHJcblx0ZGJQcm9taXNlLnRoZW4oZGIgPT57XHJcblx0XHR2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERhdGEnLCdyZWFkd3JpdGUnKTtcclxuXHRcdHZhciByZXN0YXVyYW50RGF0YVN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHRyZXN0YXVyYW50RGF0YVN0b3JlLnB1dChqc29uRGF0YSwgJ3Jlc3RhdXJhbnRzJyk7XHJcblx0XHRyZXR1cm4gdHguY29tcGxldGU7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJlc3RhdXJhbnREYXRhKCl7XHJcblx0cmV0dXJuIGRiUHJvbWlzZS50aGVuKGRiID0+e1xyXG5cdFx0dmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHR2YXIgcmVzdGF1cmFudERhdGFTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGF0YScpO1xyXG5cdFx0cmV0dXJuIHJlc3RhdXJhbnREYXRhU3RvcmUuZ2V0KCdyZXN0YXVyYW50cycpO1xyXG5cdH0pO1xyXG59Il19
