let restaurant;
let reviews;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
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
  //fetch the reviews
  fetchReviewsFromURL();
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get current reviews from page URL.
 */
fetchReviewsFromURL = () => {
  if (self.reviews) { // reviews already fetched!
    callback(null, self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
    });
  }
}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("srcset", `/img_resp/${restaurant.id}-400.webp 1x, /img_resp/${restaurant.id}-800.webp 2x`);
  image.setAttribute("alt", restaurant.alt);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();
}

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
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
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

  //for every review in the reviews of this restaurant set the html
  for (let i in reviews){
    //console.log(reviews[i]);
    ul.appendChild(createReviewHTML(reviews[i]));
  }

  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  //console.log(review);
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.setAttribute("class", "rev-name");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.setAttribute("class", "rev-date");
  date.innerHTML = new Date(review.updatedAt).toLocaleString('en-GB', { timeZone: 'UTC' });
  if (date.innerHTML == "Invalid Date") {
    date.innerHTML = review.updatedAt;
  } 
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
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


/*
** Adds a review to the database
*/
addReview = () => {
  let author = document.getElementById('form-author').value;
  let rating = document.getElementById('form-rating').value;
  let comment = document.getElementById('form-comment').value;
  let review = {
    restaurant_id: self.restaurant.id,
    name: author,
    rating: rating,
    comments: comment
  }

  let currentTimestamp = Date.now();

  let reviewLocalDB =  {
    id: 0,
    restaurant_id: self.restaurant.id,
    name: author,
    rating: rating,
    comments: comment,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp
  }

  //add to local idb db
  addReviewToDB(reviewLocalDB);
  //show local changes in the ui (add the new review to the reviews list)
  const revList = document.getElementById('reviews-list');
  revList.appendChild(createReviewHTML(reviewLocalDB));
  //send request to the server
  DBHelper.addReview(review);
}