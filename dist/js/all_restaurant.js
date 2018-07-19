class DBHelper{static get DATABASE_URL(){return"http://localhost:1337"}static fetchRestaurants(e){getRestaurantData().then(t=>{void 0!==t?(e(null,t),fetch(`${DBHelper.DATABASE_URL}/restaurants`).then(e=>e.json()).then(e=>{storeRestaurantData(e)}).catch(t=>{const r=`Request failed. Returned status of ${t}`;console.log(r),e(r,null)})):fetch(`${DBHelper.DATABASE_URL}/restaurants`).then(e=>e.json()).then(t=>{const r=t;storeRestaurantData(r),e(null,r)}).catch(t=>{const r=`Request failed. Returned status of ${t}`;console.log(r),e(r,null)})}).catch(e=>{console.log(`Error while trying to get restaurant data via indexedDB: ${e}`)})}static fetchReviews(e){getReviewData().then(t=>{void 0!==t?(e(null,t),fetch(`${DBHelper.DATABASE_URL}/reviews`).then(e=>e.json()).then(e=>{storeReviewData(e)}).catch(t=>{const r=`Request failed. Returned status of ${t}`;console.log(r),e(r,null)})):fetch(`${DBHelper.DATABASE_URL}/reviews`).then(e=>e.json()).then(t=>{const r=t;storeReviewData(r),e(null,r)}).catch(t=>{const r=`Request failed. Returned status of ${t}`;console.log(r),e(r,null)})}).catch(e=>{console.log(`Error while trying to get review data via indexedDB: ${e}`)})}static fetchRestaurantById(e,t){DBHelper.fetchRestaurants((r,n)=>{if(r)t(r,null);else{const r=n.find(t=>t.id==e);r?t(null,r):t("Restaurant does not exist",null)}})}static fetchReviewsByRestaurantId(e,t){DBHelper.fetchReviews((r,n)=>{if(r)t(r,null);else{const r=n.filter(t=>t.restaurant_id==e);r?t(null,r):t("Reviews do not exist",null)}})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((r,n)=>{if(r)t(r,null);else{const r=n.filter(t=>t.cuisine_type==e);t(null,r)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((r,n)=>{if(r)t(r,null);else{const r=n.filter(t=>t.neighborhood==e);t(null,r)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,r){DBHelper.fetchRestaurants((n,a)=>{if(n)r(n,null);else{let n=a;"all"!=e&&(n=n.filter(t=>t.cuisine_type==e)),"all"!=t&&(n=n.filter(e=>e.neighborhood==t)),r(null,n)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,r)=>{if(t)e(t,null);else{const t=r.map((e,t)=>r[t].neighborhood),n=t.filter((e,r)=>t.indexOf(e)==r);e(null,n)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,r)=>{if(t)e(t,null);else{const t=r.map((e,t)=>r[t].cuisine_type),n=t.filter((e,r)=>t.indexOf(e)==r);e(null,n)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`/img/${e.photograph}`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}}let restaurant,reviews;var map;window.initMap=(()=>{fetchRestaurantFromURL((e,t)=>{e?console.error(e):(self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:t.latlng,scrollwheel:!1}),fillBreadcrumb(),DBHelper.mapMarkerForRestaurant(self.restaurant,self.map))}),fetchReviewsFromURL()}),fetchRestaurantFromURL=(e=>{if(self.restaurant)return void e(null,self.restaurant);const t=getParameterByName("id");t?DBHelper.fetchRestaurantById(t,(t,r)=>{self.restaurant=r,r?(fillRestaurantHTML(),e(null,r)):console.error(t)}):(error="No restaurant id in URL",e(error,null))}),fetchReviewsFromURL=(e=>{if(self.reviews)return void e(null,self.reviews);const t=getParameterByName("id");t?DBHelper.fetchReviewsByRestaurantId(t,(t,r)=>{self.reviews=r,r?(fillReviewsHTML(),e(null,r)):console.error(t)}):(error="No restaurant id in URL",e(error,null))}),fillRestaurantHTML=((e=self.restaurant)=>{document.getElementById("restaurant-name").innerHTML=e.name,document.getElementById("restaurant-address").innerHTML=e.address;const t=document.getElementById("restaurant-img");t.className="restaurant-img",t.src=DBHelper.imageUrlForRestaurant(e),t.setAttribute("srcset",`/img_resp/${e.id}-400.jpg 1x, /img_resp/${e.id}-800.jpg 2x`),t.setAttribute("alt",e.alt),document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,e.operating_hours&&fillRestaurantHoursHTML()}),fillRestaurantHoursHTML=((e=self.restaurant.operating_hours)=>{const t=document.getElementById("restaurant-hours");for(let r in e){const n=document.createElement("tr"),a=document.createElement("td");a.innerHTML=r,n.appendChild(a);const s=document.createElement("td");s.innerHTML=e[r],n.appendChild(s),t.appendChild(n)}}),fillReviewsHTML=((e=self.reviews)=>{const t=document.getElementById("reviews-container"),r=document.createElement("h2");if(r.innerHTML="Reviews",t.appendChild(r),!e){const e=document.createElement("p");return e.innerHTML="No reviews yet!",void t.appendChild(e)}const n=document.getElementById("reviews-list");for(let t in e)n.appendChild(createReviewHTML(e[t]));t.appendChild(n)}),createReviewHTML=(e=>{const t=document.createElement("li"),r=document.createElement("p");r.setAttribute("class","rev-name"),r.innerHTML=e.name,t.appendChild(r);const n=document.createElement("p");n.setAttribute("class","rev-date"),n.innerHTML=new Date(e.updatedAt).toLocaleString("en-GB",{timeZone:"UTC"}),t.appendChild(n);const a=document.createElement("p");a.setAttribute("class","rev-rating"),a.innerHTML=`Rating: ${e.rating}`,t.appendChild(a);const s=document.createElement("p");return s.setAttribute("class","rev-comments"),s.innerHTML=e.comments,t.appendChild(s),t}),fillBreadcrumb=((e=self.restaurant)=>{const t=document.getElementById("breadcrumb"),r=document.createElement("li");r.innerHTML=e.name,t.appendChild(r)}),getParameterByName=((e,t)=>{t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");const r=new RegExp(`[?&]${e}(=([^&#]*)|&|#|$)`).exec(t);return r?r[2]?decodeURIComponent(r[2].replace(/\+/g," ")):"":null});var _this=this;setTimeout(()=>{},5e3),removeTabfocusFromMap=(()=>{window.onload=(()=>{const e=document.querySelector("#map");gmapDesc=e.querySelectorAll("*"),gmapDesc.forEach(e=>{e.setAttribute("tabindex","-1")},_this)})}),document.getElementById("map").onload=removeTabfocusFromMap(),window.onload=(()=>{document.querySelector("iframe").title="Google Maps"}),registerServiceWorker=(()=>{navigator.serviceWorker&&navigator.serviceWorker.register("/sw.js").catch(function(){console.log("Something went wrong. ServiceWorker not registered")})}),registerServiceWorker();var dbPromise=idb.open("jsonResp",2,function(e){switch(e.oldVersion){case 0:e.createObjectStore("restaurantData");case 1:e.createObjectStore("reviewData")}});function storeRestaurantData(e){dbPromise.then(t=>{var r=t.transaction("restaurantData","readwrite");return r.objectStore("restaurantData").put(e,"restaurants"),r.complete})}function getRestaurantData(){return dbPromise.then(e=>{return e.transaction("restaurantData").objectStore("restaurantData").get("restaurants")})}function storeReviewData(e){dbPromise.then(t=>{var r=t.transaction("reviewData","readwrite");return r.objectStore("reviewData").put(e,"reviews"),r.complete})}function getReviewData(){return dbPromise.then(e=>{return e.transaction("reviewData").objectStore("reviewData").get("reviews")})}