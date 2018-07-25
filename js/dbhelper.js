/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }


  static fetchRestaurants(callback) {
    getRestaurantData().then(restaurants => {
      //check if there is restaurant data stored in the db
      if (restaurants !== undefined){
        //restaurant data is stored. execute the callback => pass the data to the application
        callback(null, restaurants)
        //console.log('successfully served from idb');
        //after executing the callback fetch data from the network for a possibly newer version and save it to db
        fetch(`${DBHelper.DATABASE_URL}/restaurants`)
        .then(response => response.json())
        .then(json =>{
          const restaurants = json;
          storeRestaurantData(restaurants);
        })
        .catch(e =>{
          const error = (`Request failed. Returned status of ${e}`);
          console.log(error);
          callback(error, null);
        });

      }else{
        //no data saved in the db => fetch it from the network, pass it to the application and save it in db
        fetch(`${DBHelper.DATABASE_URL}/restaurants`)
        .then(response => response.json())
        .then(json =>{
          const restaurants = json;
          storeRestaurantData(restaurants);
          callback(null, restaurants);
        })
        .catch(e =>{
          const error = (`Request failed. Returned status of ${e}`);
          console.log(error);
          callback(error, null);
        });
      }
    }).catch(e =>{
      console.log(`Error while trying to get restaurant data via indexedDB: ${e}`);
    });
  }


  static fetchReviews(callback) {
    getReviewData().then(reviews => {
      //check if there is review data stored in the db
      if (reviews !== undefined){
        //review data is stored. execute the callback => pass the data to the application
        callback(null, reviews)
        //console.log('successfully served from idb');
        //after executing the callback fetch data from the network for a possibly newer version and save it to db
        fetch(`${DBHelper.DATABASE_URL}/reviews`)
        .then(response => response.json())
        .then(json =>{
          const reviews = json;
          storeReviewData(reviews);
        })
        .catch(e =>{
          const error = (`Request failed. Returned status of ${e}`);
          console.log(error);
          callback(error, null);
        });

      }else{
        //no data saved in the db => fetch it from the network, pass it to the application and save it in db
        fetch(`${DBHelper.DATABASE_URL}/reviews`)
        .then(response => response.json())
        .then(json =>{
          const reviews = json;
          storeReviewData(reviews);
          callback(null, reviews);
        })
        .catch(e =>{
          const error = (`Request failed. Returned status of ${e}`);
          console.log(error);
          callback(error, null);
        });
      }
    }).catch(e =>{
      console.log(`Error while trying to get review data via indexedDB: ${e}`);
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
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

    /**
   * Fetch a reviews by restaurant ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    // fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, all_reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const reviews = all_reviews.filter(r => r.restaurant_id == id);
        if (reviews) { // Got the review
          callback(null, reviews);
        } else { // Reviews do not exist in the database
          callback('Reviews do not exist', null);
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
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
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
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
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
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
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
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }


  /**
   * Toggle the favourite state of a restaurant
   */
  static toggleFavouriteRestaurant(restaurantId, shouldBeFavourite) {
    const putURL = `http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${shouldBeFavourite}`;
    fetch(putURL,{
      method: 'PUT'
    })
    .then(response => {
      console.log('Changed restaurant status to ' + shouldBeFavourite + ' on the server.');

      //updateFavourite(restaurantId,shouldBeFavourite);
      //return response.json()
    })
    .catch(e =>{
      const error = (`Request failed. Returned status of ${e}`);
      console.log(error);
    });
  }

}
