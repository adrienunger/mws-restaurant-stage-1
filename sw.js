var shellCache = 'restaurants-shell-v1';
var dynamicCache = "restaurants-dyn-v1";
var imgsCache = 'restaurants-imgs';
var allCaches = [shellCache, dynamicCache, imgsCache];


self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(shellCache).then( (cache) => {
      return cache.addAll(['/',
        'js/main.js',
        'js/off_canvas.js',
        'js/dbhelper.js',
        'js/googleMapsFocus.js',
        'js/restaurant_info.js',
        'css/styles.css',
        'data/restaurants.json'
        ]);
    }));
  });


//use the activate event as a trigger to delete outdated caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then( (cacheNames) => {
        return Promise.all(
            cacheNames.filter( (cacheName) => {
                //return true if the cache should be deleted, false otherwise
                return (cacheName.startsWith('restaurants-shell-') || cacheName.startsWith('restaurants-dyn-')) && !allCaches.includes(cacheName);
            }).map( (cacheName) => {
            return caches.delete(cacheName);
            })
        );
        })
    );
});



self.addEventListener('fetch', (event) => {
    var requestUrl = new URL(event.request.url);

    //check if its an image request. If so, try to serve it from the cache
    if (requestUrl.origin === location.origin) {
        if ((requestUrl.pathname.startsWith('/img/')) || (requestUrl.pathname.startsWith('/img_resp/'))){
            event.respondWith(serveImage(event.request));
            return;
        }
    }

    //check if the request was already chached and return it, 
    //otherwise fetch from the network, cache it in the dynamicCache and return it
    event.respondWith(caches.match(event.request).then( (response) =>{
        if(response){
            return response;
        }else{
            return caches.open(dynamicCache).then( (cache) => {
                return fetch(event.request).then( (networkResponse) => {
                    cache.put(requestUrl, networkResponse.clone());
                    return networkResponse;
                });
            });
        }
      }));
});


/*
* Serve image for a request from the cache if it is already cache, 
* otherwise fetch from network, cache it and serve it
*/
serveImage = (request) => {
    
    return caches.open(imgsCache).then( (cache) => {
        return cache.match(request.url).then( (response) => {
            if (response) return response;

            return fetch(request).then( (networkResponse) => {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            });
        });
    });

}