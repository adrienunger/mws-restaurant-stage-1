class DBHelper{static get DATABASE_URL(){return"http://localhost:1337"}static fetchRestaurants(e){getRestaurantData().then(t=>{void 0!==t?(e(null,t),fetch(`${DBHelper.DATABASE_URL}/restaurants`).then(e=>e.json()).then(e=>{storeRestaurantData(e)}).catch(t=>{const a=`Request failed. Returned status of ${t}`;console.log(a),e(a,null)})):fetch(`${DBHelper.DATABASE_URL}/restaurants`).then(e=>e.json()).then(t=>{const a=t;storeRestaurantData(a),e(null,a)}).catch(t=>{const a=`Request failed. Returned status of ${t}`;console.log(a),e(a,null)})}).catch(e=>{console.log(`Error while trying to get restaurant data via indexedDB: ${e}`)})}static fetchReviews(e){getReviewData().then(t=>{void 0!==t?(e(null,t),fetch(`${DBHelper.DATABASE_URL}/reviews`).then(e=>e.json()).then(e=>{storeReviewData(e)}).catch(t=>{const a=`Request failed. Returned status of ${t}`;console.log(a),e(a,null)})):fetch(`${DBHelper.DATABASE_URL}/reviews`).then(e=>e.json()).then(t=>{const a=t;storeReviewData(a),e(null,a)}).catch(t=>{console.log(t);const a=`Request failed. Returned status of ${t}`;console.log(a),e(a,null)})}).catch(e=>{console.log(`Error while trying to get review data via indexedDB: ${e}`)})}static fetchRestaurantById(e,t){DBHelper.fetchRestaurants((a,r)=>{if(a)t(a,null);else{const a=r.find(t=>t.id==e);a?t(null,a):t("Restaurant does not exist",null)}})}static fetchReviewsByRestaurantId(e,t){DBHelper.fetchReviews((a,r)=>{if(a)t(a,null);else{const a=r.filter(t=>t.restaurant_id==e);a?t(null,a):t("Reviews do not exist",null)}})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((a,r)=>{if(a)t(a,null);else{const a=r.filter(t=>t.cuisine_type==e);t(null,a)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((a,r)=>{if(a)t(a,null);else{const a=r.filter(t=>t.neighborhood==e);t(null,a)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,a){DBHelper.fetchRestaurants((r,s)=>{if(r)a(r,null);else{let r=s;"all"!=e&&(r=r.filter(t=>t.cuisine_type==e)),"all"!=t&&(r=r.filter(e=>e.neighborhood==t)),a(null,r)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,a)=>{if(t)e(t,null);else{const t=a.map((e,t)=>a[t].neighborhood),r=t.filter((e,a)=>t.indexOf(e)==a);e(null,r)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,a)=>{if(t)e(t,null);else{const t=a.map((e,t)=>a[t].cuisine_type),r=t.filter((e,a)=>t.indexOf(e)==a);e(null,r)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`/img/${e.photograph}`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}static toggleFavouriteRestaurant(e,t){const a=`http://localhost:1337/restaurants/${e}/?is_favorite=${t}`;fetch(a,{method:"PUT"}).then(e=>{console.log("Changed restaurant status to "+t+" on the server.")}).catch(e=>{const t=`Request failed. Returned status of ${e}`;console.log(t)})}static addReview(e){const t=`${DBHelper.DATABASE_URL}/reviews`;fetch(t,{method:"POST",body:JSON.stringify(e),headers:{"Content-Type":"application/json; charset=utf-8"}}).then(e=>(console.log(e),e.json())).catch(e=>console.error("Fetch Error =\n",e))}}let restaurants,neighborhoods,cuisines;var map,markers=[];function toggleFavouriteLocally(e,t){t?(e.classList.remove("fav-no"),e.classList.add("fav-yes"),e.setAttribute("aria-label","Remove as favourite")):(e.classList.remove("fav-yes"),e.classList.add("fav-no"),e.setAttribute("aria-label","Mark as favourite"))}document.addEventListener("DOMContentLoaded",e=>{fetchNeighborhoods(),fetchCuisines()}),fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const a=document.createElement("option");a.innerHTML=e,a.value=e,t.append(a)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");e.forEach(e=>{const a=document.createElement("option");a.innerHTML=e,a.value=e,t.append(a)})}),window.initMap=(()=>{self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),updateRestaurants()}),updateRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),a=e.selectedIndex,r=t.selectedIndex,s=e[a].value,n=t[r].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(s,n,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(e=>e.setMap(null)),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e))}),addMarkersToMap()}),createRestaurantHTML=(e=>{const t=document.createElement("li"),a=document.createElement("button");a.innerHTML="★",a.classList.add("fav-button"),"true"==e.is_favorite?(a.classList.add("fav-yes"),a.setAttribute("aria-label","Remove as favourite")):(a.classList.add("fav-no"),a.setAttribute("aria-label","Mark as favourite")),a.onclick=function(){let t="true"==e.is_favorite;DBHelper.toggleFavouriteRestaurant(e.id,!t),e.is_favorite=String(!t),updateFavourite(e.id,!t),toggleFavouriteLocally(a,!t)},t.append(a);const r=document.createElement("h3");r.innerHTML=e.name,t.append(r);const s=document.createElement("img");s.className="restaurant-img responsively-lazy","/img/undefined"!==DBHelper.imageUrlForRestaurant(e)?s.src=`${DBHelper.imageUrlForRestaurant(e)}.jpg`:s.src=`/img/${e.id}.jpg`,s.setAttribute("srcset","data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="),s.setAttribute("data-srcset",`/img_resp/${e.id}-300.jpg 1x, /img_resp/${e.id}-600.jpg 2x`),s.setAttribute("alt",`An image of the restaurant ${e.name} in ${e.neighborhood}.`),t.append(s);const n=document.createElement("p");n.innerHTML=e.neighborhood,n.setAttribute("class","rest-neighborhood"),t.append(n);const o=document.createElement("p");o.innerHTML=e.address,o.setAttribute("class","rest-address"),t.append(o);const i=document.createElement("a");return i.innerHTML="View Details",i.href=DBHelper.urlForRestaurant(e),i.setAttribute("aria-label",`View details for the restaurant ${e.name}`),t.append(i),t}),addMarkersToMap=((e=self.restaurants)=>{e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.map);google.maps.event.addListener(t,"click",()=>{window.location.href=t.url}),self.markers.push(t)})});var menu=document.querySelector("#menu"),main=document.querySelector("main"),filterOp=document.querySelector(".filter-options");menu.addEventListener("click",e=>{"true"==menu.getAttribute("aria-expanded")?menu.setAttribute("aria-expanded","false"):menu.setAttribute("aria-expanded","true"),filterOp.classList.toggle("open"),e.stopPropagation()}),main.addEventListener("click",()=>{menu.setAttribute("aria-expanded","false"),filterOp.classList.remove("open")});var _this=this;setTimeout(()=>{},5e3),removeTabfocusFromMap=(()=>{window.onload=(()=>{const e=document.querySelector("#map");gmapDesc=e.querySelectorAll("*"),gmapDesc.forEach(e=>{e.setAttribute("tabindex","-1")},_this)})}),document.getElementById("map").onload=removeTabfocusFromMap(),window.onload=(()=>{document.querySelector("iframe").title="Google Maps"}),registerServiceWorker=(()=>{navigator.serviceWorker&&navigator.serviceWorker.register("/sw.js").catch(function(){console.log("Something went wrong. ServiceWorker not registered")})}),registerServiceWorker();var dbPromise=idb.open("jsonResp",2,function(e){switch(e.oldVersion){case 0:e.createObjectStore("restaurantData");case 1:e.createObjectStore("reviewData")}});function storeRestaurantData(e){dbPromise.then(t=>{var a=t.transaction("restaurantData","readwrite");return a.objectStore("restaurantData").put(e,"restaurants"),a.complete})}function getRestaurantData(){return dbPromise.then(e=>{return e.transaction("restaurantData").objectStore("restaurantData").get("restaurants")})}function storeReviewData(e){dbPromise.then(t=>{var a=t.transaction("reviewData","readwrite");return a.objectStore("reviewData").put(e,"reviews"),a.complete}).then(()=>console.log("stored successfully"))}function getReviewData(){return dbPromise.then(e=>{return e.transaction("reviewData").objectStore("reviewData").get("reviews")})}function updateFavourite(e,t){return dbPromise.then(a=>{var r=a.transaction("restaurantData","readwrite"),s=r.objectStore("restaurantData");s.get("restaurants").then(a=>{for(let r=0;r<a.length;r++)a[r].id==e&&(console.log(a[r].name),a[r].is_favorite=String(t));return s.put(a,"restaurants"),r.complete})})}