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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwicmVzdGF1cmFudF9pbmZvLmpzIiwiZ29vZ2xlTWFwc0ZvY3VzLmpzIiwicmVnaXN0ZXJTZXJ2aWNlV29ya2VyLmpzIiwiaWRiRGF0YS5qcyJdLCJuYW1lcyI6WyJEQkhlbHBlciIsIkRBVEFCQVNFX1VSTCIsInBvcnQiLCJmZXRjaFJlc3RhdXJhbnRzIiwiY2FsbGJhY2siLCJmZXRjaCIsInRoZW4iLCJyZXNwb25zZSIsImpzb24iLCJyZXN0YXVyYW50cyIsInN0b3JlUmVzdGF1cmFudERhdGEiLCJjYXRjaCIsImUiLCJlcnJvciIsImNvbnNvbGUiLCJsb2ciLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiaWQiLCJyZXN0YXVyYW50IiwiZmluZCIsInIiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUiLCJjdWlzaW5lIiwicmVzdWx0cyIsImZpbHRlciIsImN1aXNpbmVfdHlwZSIsImZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kIiwibmVpZ2hib3Job29kIiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kIiwiZmV0Y2hOZWlnaGJvcmhvb2RzIiwibmVpZ2hib3Job29kcyIsIm1hcCIsInYiLCJpIiwidW5pcXVlTmVpZ2hib3Job29kcyIsImluZGV4T2YiLCJmZXRjaEN1aXNpbmVzIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsInVybEZvclJlc3RhdXJhbnQiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJwaG90b2dyYXBoIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm1hcmtlciIsImdvb2dsZSIsIm1hcHMiLCJNYXJrZXIiLCJwb3NpdGlvbiIsImxhdGxuZyIsInRpdGxlIiwibmFtZSIsInVybCIsImFuaW1hdGlvbiIsIkFuaW1hdGlvbiIsIkRST1AiLCJ3aW5kb3ciLCJpbml0TWFwIiwiZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCIsInNlbGYiLCJNYXAiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiem9vbSIsImNlbnRlciIsInNjcm9sbHdoZWVsIiwiZmlsbEJyZWFkY3J1bWIiLCJnZXRQYXJhbWV0ZXJCeU5hbWUiLCJmaWxsUmVzdGF1cmFudEhUTUwiLCJpbm5lckhUTUwiLCJhZGRyZXNzIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJzcmMiLCJzZXRBdHRyaWJ1dGUiLCJhbHQiLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsImZpbGxSZXZpZXdzSFRNTCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJyb3ciLCJjcmVhdGVFbGVtZW50IiwiZGF5IiwiYXBwZW5kQ2hpbGQiLCJ0aW1lIiwicmV2aWV3cyIsImNvbnRhaW5lciIsIm5vUmV2aWV3cyIsInVsIiwiZm9yRWFjaCIsInJldmlldyIsImNyZWF0ZVJldmlld0hUTUwiLCJsaSIsImRhdGUiLCJyYXRpbmciLCJjb21tZW50cyIsImJyZWFkY3J1bWIiLCJsb2NhdGlvbiIsImhyZWYiLCJyZXBsYWNlIiwicmVnZXgiLCJSZWdFeHAiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Iiwic2V0VGltZW91dCIsInJlbW92ZVRhYmZvY3VzRnJvbU1hcCIsIm9ubG9hZCIsImdtYXAiLCJxdWVyeVNlbGVjdG9yIiwiZ21hcERlc2MiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZGVzYyIsImlmcmFtZSIsInJlZ2lzdGVyU2VydmljZVdvcmtlciIsIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciIsImRiUHJvbWlzZSIsImlkYiIsIm9wZW4iLCJ1cGdyYWRlRGIiLCJjcmVhdGVPYmplY3RTdG9yZSIsImpzb25EYXRhIiwiZGIiLCJ0eCIsInRyYW5zYWN0aW9uIiwicmVzdGF1cmFudERhdGFTdG9yZSIsIm9iamVjdFN0b3JlIiwicHV0IiwiY29tcGxldGUiLCJnZXRSZXN0YXVyYW50RGF0YSIsImdldCJdLCJtYXBwaW5ncyI6IkFBQUE7OztBQUdBLE1BQU1BLFFBQU4sQ0FBZTs7QUFFYjs7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bUJBQVQsQ0FBNkJpSCxRQUE3QixFQUFzQztBQUNyQ0wsV0FBVWhILElBQVYsQ0FBZXNILE1BQUs7QUFDbkIsTUFBSUMsS0FBS0QsR0FBR0UsV0FBSCxDQUFlLGdCQUFmLEVBQWdDLFdBQWhDLENBQVQ7QUFDQSxNQUFJQyxzQkFBc0JGLEdBQUdHLFdBQUgsQ0FBZSxnQkFBZixDQUExQjtBQUNBRCxzQkFBb0JFLEdBQXBCLENBQXdCTixRQUF4QixFQUFrQyxhQUFsQztBQUNBLFNBQU9FLEdBQUdLLFFBQVY7QUFDQSxFQUxEO0FBTUE7O0FBRUQsU0FBU0MsaUJBQVQsR0FBNEI7QUFDM0JiLFdBQVVoSCxJQUFWLENBQWVzSCxNQUFLO0FBQ25CLE1BQUlDLEtBQUtELEdBQUdFLFdBQUgsQ0FBZSxnQkFBZixDQUFUO0FBQ0EsTUFBSUMsc0JBQXNCRixHQUFHRyxXQUFILENBQWUsZ0JBQWYsQ0FBMUI7QUFDQSxTQUFPRCxvQkFBb0JLLEdBQXBCLENBQXdCLGFBQXhCLENBQVA7QUFDQSxFQUpEO0FBS0EiLCJmaWxlIjoiYWxsX3Jlc3RhdXJhbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXHJcbiAqL1xyXG5jbGFzcyBEQkhlbHBlciB7XHJcblxyXG4gIC8qKlxyXG4gICAqIERhdGFiYXNlIFVSTC5cclxuICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXHJcbiAgICovXHJcbiAgc3RhdGljIGdldCBEQVRBQkFTRV9VUkwoKSB7XHJcbiAgICBjb25zdCBwb3J0ID0gMTMzNyAvLyBDaGFuZ2UgdGhpcyB0byB5b3VyIHNlcnZlciBwb3J0XHJcbiAgICByZXR1cm4gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9yZXN0YXVyYW50c2A7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgcmVzdGF1cmFudHMuXHJcbiAgICovXHJcbiAgLypzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cyhjYWxsYmFjaykge1xyXG4gICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgeGhyLm9wZW4oJ0dFVCcsIERCSGVscGVyLkRBVEFCQVNFX1VSTCk7XHJcbiAgICB4aHIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7IC8vIEdvdCBhIHN1Y2Nlc3MgcmVzcG9uc2UgZnJvbSBzZXJ2ZXIhXHJcbiAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coanNvbik7XHJcbiAgICAgICAgY29uc29sZS5sb2codHlwZW9mIGpzb24pO1xyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnRzID0ganNvbjtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XHJcbiAgICAgIH0gZWxzZSB7IC8vIE9vcHMhLiBHb3QgYW4gZXJyb3IgZnJvbSBzZXJ2ZXIuXHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHt4aHIuc3RhdHVzfWApO1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHhoci5zZW5kKCk7XHJcbiAgfSovXHJcblxyXG5cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cyhjYWxsYmFjaykge1xyXG4gICAgZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxyXG4gICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxyXG4gICAgLnRoZW4oanNvbiA9PntcclxuICAgICAgY29uc3QgcmVzdGF1cmFudHMgPSBqc29uO1xyXG4gICAgICBzdG9yZVJlc3RhdXJhbnREYXRhKHJlc3RhdXJhbnRzKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlID0+e1xyXG4gICAgICBjb25zdCBlcnJvciA9IChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke2V9YCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgfSk7XHJcbiBcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCBjYWxsYmFjaykge1xyXG4gICAgLy8gZmV0Y2ggYWxsIHJlc3RhdXJhbnRzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50ID0gcmVzdGF1cmFudHMuZmluZChyID0+IHIuaWQgPT0gaWQpO1xyXG4gICAgICAgIGlmIChyZXN0YXVyYW50KSB7IC8vIEdvdCB0aGUgcmVzdGF1cmFudFxyXG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcclxuICAgICAgICAgIGNhbGxiYWNrKCdSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0JywgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSB0eXBlIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSBhbmQgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSByZXN0YXVyYW50c1xyXG4gICAgICAgIGlmIChjdWlzaW5lICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBjdWlzaW5lXHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gR2V0IGFsbCBuZWlnaGJvcmhvb2RzIGZyb20gYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKVxyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlTmVpZ2hib3Job29kcyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgIGNvbnN0IGN1aXNpbmVzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5jdWlzaW5lX3R5cGUpXHJcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgLi9yZXN0YXVyYW50Lmh0bWw/aWQ9JHtyZXN0YXVyYW50LmlkfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGAvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxyXG4gICAqL1xyXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgIHBvc2l0aW9uOiByZXN0YXVyYW50LmxhdGxuZyxcclxuICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcclxuICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxyXG4gICAgICBtYXA6IG1hcCxcclxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cclxuICAgICk7XHJcbiAgICByZXR1cm4gbWFya2VyO1xyXG4gIH1cclxuXHJcbn1cclxuIiwibGV0IHJlc3RhdXJhbnQ7XHJcbnZhciBtYXA7XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCgoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcclxuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsZi5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKSwge1xyXG4gICAgICAgIHpvb206IDE2LFxyXG4gICAgICAgIGNlbnRlcjogcmVzdGF1cmFudC5sYXRsbmcsXHJcbiAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgICBmaWxsQnJlYWRjcnVtYigpO1xyXG4gICAgICBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHNlbGYucmVzdGF1cmFudCwgc2VsZi5tYXApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxyXG4gKi9cclxuZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCA9IChjYWxsYmFjaykgPT4ge1xyXG4gIGlmIChzZWxmLnJlc3RhdXJhbnQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXHJcbiAgICBjYWxsYmFjayhudWxsLCBzZWxmLnJlc3RhdXJhbnQpXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGlkID0gZ2V0UGFyYW1ldGVyQnlOYW1lKCdpZCcpO1xyXG4gIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXHJcbiAgICBlcnJvciA9ICdObyByZXN0YXVyYW50IGlkIGluIFVSTCdcclxuICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICB9IGVsc2Uge1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XHJcbiAgICAgIHNlbGYucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XHJcbiAgICAgIGlmICghcmVzdGF1cmFudCkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBmaWxsUmVzdGF1cmFudEhUTUwoKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudClcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxyXG4gKi9cclxuZmlsbFJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcclxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xyXG4gIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtYWRkcmVzcycpO1xyXG4gIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG5cclxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZycpO1xyXG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZydcclxuICBpbWFnZS5zcmMgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgaW1hZ2Uuc2V0QXR0cmlidXRlKFwic3Jjc2V0XCIsIGAvaW1nX3Jlc3AvJHtyZXN0YXVyYW50LmlkfS00MDAuanBnIDF4LCAvaW1nX3Jlc3AvJHtyZXN0YXVyYW50LmlkfS04MDAuanBnIDJ4YCk7XHJcbiAgaW1hZ2Uuc2V0QXR0cmlidXRlKFwiYWx0XCIsIHJlc3RhdXJhbnQuYWx0KTtcclxuXHJcbiAgY29uc3QgY3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWN1aXNpbmUnKTtcclxuICBjdWlzaW5lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuY3Vpc2luZV90eXBlO1xyXG5cclxuICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xyXG4gIGlmIChyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycykge1xyXG4gICAgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcclxuICB9XHJcbiAgLy8gZmlsbCByZXZpZXdzXHJcbiAgZmlsbFJldmlld3NIVE1MKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XHJcbiAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xyXG4gIGZvciAobGV0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xyXG4gICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcclxuXHJcbiAgICBjb25zdCBkYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgZGF5LmlubmVySFRNTCA9IGtleTtcclxuICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xyXG5cclxuICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xyXG4gICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xyXG5cclxuICAgIGhvdXJzLmFwcGVuZENoaWxkKHJvdyk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFsbCByZXZpZXdzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuZmlsbFJldmlld3NIVE1MID0gKHJldmlld3MgPSBzZWxmLnJlc3RhdXJhbnQucmV2aWV3cykgPT4ge1xyXG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWNvbnRhaW5lcicpO1xyXG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDInKTtcclxuICB0aXRsZS5pbm5lckhUTUwgPSAnUmV2aWV3cyc7XHJcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRpdGxlKTtcclxuXHJcbiAgaWYgKCFyZXZpZXdzKSB7XHJcbiAgICBjb25zdCBub1Jldmlld3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9SZXZpZXdzKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XHJcbiAgcmV2aWV3cy5mb3JFYWNoKHJldmlldyA9PiB7XHJcbiAgICB1bC5hcHBlbmRDaGlsZChjcmVhdGVSZXZpZXdIVE1MKHJldmlldykpO1xyXG4gIH0pO1xyXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh1bCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmV2aWV3IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3KSA9PiB7XHJcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgbmFtZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInJldi1uYW1lXCIpO1xyXG4gIG5hbWUuaW5uZXJIVE1MID0gcmV2aWV3Lm5hbWU7XHJcbiAgbGkuYXBwZW5kQ2hpbGQobmFtZSk7XHJcblxyXG4gIGNvbnN0IGRhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgZGF0ZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInJldi1kYXRlXCIpO1xyXG4gIGRhdGUuaW5uZXJIVE1MID0gcmV2aWV3LmRhdGU7XHJcbiAgbGkuYXBwZW5kQ2hpbGQoZGF0ZSk7XHJcblxyXG4gIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICByYXRpbmcuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJyZXYtcmF0aW5nXCIpO1xyXG4gIHJhdGluZy5pbm5lckhUTUwgPSBgUmF0aW5nOiAke3Jldmlldy5yYXRpbmd9YDtcclxuICBsaS5hcHBlbmRDaGlsZChyYXRpbmcpO1xyXG5cclxuICBjb25zdCBjb21tZW50cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBjb21tZW50cy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInJldi1jb21tZW50c1wiKTtcclxuICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XHJcbiAgbGkuYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xyXG5cclxuICByZXR1cm4gbGk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGQgcmVzdGF1cmFudCBuYW1lIHRvIHRoZSBicmVhZGNydW1iIG5hdmlnYXRpb24gbWVudVxyXG4gKi9cclxuZmlsbEJyZWFkY3J1bWIgPSAocmVzdGF1cmFudD1zZWxmLnJlc3RhdXJhbnQpID0+IHtcclxuICBjb25zdCBicmVhZGNydW1iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JyZWFkY3J1bWInKTtcclxuICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gIGJyZWFkY3J1bWIuYXBwZW5kQ2hpbGQobGkpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cclxuICovXHJcbmdldFBhcmFtZXRlckJ5TmFtZSA9IChuYW1lLCB1cmwpID0+IHtcclxuICBpZiAoIXVybClcclxuICAgIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG4gIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csICdcXFxcJCYnKTtcclxuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKSxcclxuICAgIHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XHJcbiAgaWYgKCFyZXN1bHRzKVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgaWYgKCFyZXN1bHRzWzJdKVxyXG4gICAgcmV0dXJuICcnO1xyXG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XHJcbn1cclxuIiwic2V0VGltZW91dCggKCkgPT4ge30sNTAwMCk7XHJcbiAgcmVtb3ZlVGFiZm9jdXNGcm9tTWFwID0gKCkgPT4ge1xyXG4gICAgd2luZG93Lm9ubG9hZCA9ICgpID0+e1xyXG4gICAgICBjb25zdCBnbWFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21hcCcpO1xyXG4gICAgICBnbWFwRGVzYyA9IGdtYXAucXVlcnlTZWxlY3RvckFsbCgnKicpO1xyXG4gICAgICBnbWFwRGVzYy5mb3JFYWNoKCAoZGVzYykgPT57XHJcbiAgICAgICAgZGVzYy5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIikub25sb2FkID0gcmVtb3ZlVGFiZm9jdXNGcm9tTWFwKCk7XHJcblxyXG4gIHdpbmRvdy5vbmxvYWQgPSAoKSA9PntcclxuICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZScpO1xyXG4gICAgaWZyYW1lLnRpdGxlID0gXCJHb29nbGUgTWFwc1wiO1xyXG4gIH1cclxuIiwiXHJcbi8qKlxyXG4gKiBSZWdpc3RlciBhIHNlcnZpY2VXb3JrZXJcclxuICovXHJcbnJlZ2lzdGVyU2VydmljZVdvcmtlciA9ICgpID0+IHtcclxuICAgIC8vY2hlY2sgaWYgc2VydmljZVdvcmtlciBpcyBzdXBwb3J0ZWQsIG90aGVyd2lzZSByZXR1cm5cclxuICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHJldHVybjtcclxuICBcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnKS5jYXRjaChmdW5jdGlvbigpe1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyB3ZW50IHdyb25nLiBTZXJ2aWNlV29ya2VyIG5vdCByZWdpc3RlcmVkXCIpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICBcclxuICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTsiLCIvL2ltcG9ydCAqIGFzICdpZGInIGZyb20gJy4vbGliL2lkYi9saWIvaWRiLmpzJztcclxuXHJcbnZhciBkYlByb21pc2UgPSBpZGIub3BlbignanNvblJlc3AnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcclxuICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudERhdGEnKTtcclxuICB9KTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gc3RvcmVSZXN0YXVyYW50RGF0YShqc29uRGF0YSl7XHJcblx0ZGJQcm9taXNlLnRoZW4oZGIgPT57XHJcblx0XHR2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERhdGEnLCdyZWFkd3JpdGUnKTtcclxuXHRcdHZhciByZXN0YXVyYW50RGF0YVN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHRyZXN0YXVyYW50RGF0YVN0b3JlLnB1dChqc29uRGF0YSwgJ3Jlc3RhdXJhbnRzJyk7XHJcblx0XHRyZXR1cm4gdHguY29tcGxldGU7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJlc3RhdXJhbnREYXRhKCl7XHJcblx0ZGJQcm9taXNlLnRoZW4oZGIgPT57XHJcblx0XHR2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERhdGEnKTtcclxuXHRcdHZhciByZXN0YXVyYW50RGF0YVN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnREYXRhJyk7XHJcblx0XHRyZXR1cm4gcmVzdGF1cmFudERhdGFTdG9yZS5nZXQoJ3Jlc3RhdXJhbnRzJyk7XHJcblx0fSk7XHJcbn0iXX0=
