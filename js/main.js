let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

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
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

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
}

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
}

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
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  //favourite section
  const favourite = document.createElement('button');
  favourite.innerHTML = '★';
  favourite.classList.add('fav-button');
    //the following line is for boolean conversion
    let isFavourite = (restaurant.is_favorite == "true");
  if (isFavourite){
    favourite.classList.add('fav-yes');
    favourite.setAttribute('aria-label', 'Remove as favourite')
  }else{
    favourite.classList.add('fav-no');
    favourite.setAttribute('aria-label', 'Mark as favourite')
  }

  favourite.onclick = function(){
    //the following line is for boolean conversion
    let isFavourite = (restaurant.is_favorite == "true");
    DBHelper.toggleFavouriteRestaurant(restaurant.id, !isFavourite);
     //string conversion here is necessary due to the bug, that the server doesn't save the values properly as boolean.
     //without the string conversion here the code for favourite toggling breaks
    restaurant.is_favorite = String(!isFavourite);
    //updates the idb entry for the restaurant
    updateFavourite(restaurant.id, !isFavourite);
    //toggles the local change in the ui + the aria attributes 
    toggleFavouriteLocally(favourite, !isFavourite);
  };

  li.append(favourite);
  //favourite section end


  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  //check if image data is available in the restaurant data
  if (DBHelper.imageUrlForRestaurant(restaurant) !== '/img/undefined'){
    image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}.webp`;
  }else{
    image.src = `/img/${restaurant.id}.webp`;
  }

  image.setAttribute("srcset", `/img_resp/${restaurant.id}-300.webp 1x, /img_resp/${restaurant.id}-600.webp 2x`);
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
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}


/**
*
**/
function toggleFavouriteLocally(htmlElement, isFavourite){
  if(isFavourite){
    htmlElement.classList.remove('fav-no');
    htmlElement.classList.add('fav-yes');
    htmlElement.setAttribute('aria-label', 'Remove as favourite');
  }else{
    htmlElement.classList.remove('fav-yes');
    htmlElement.classList.add('fav-no');
    htmlElement.setAttribute('aria-label', 'Mark as favourite');
  }
}

function show_map(){    
    document.getElementById('map').style.display = 'block';
    document.getElementById('skip-link').style.display = 'block';  
    document.getElementById('map-button').style.display = 'none';   
}