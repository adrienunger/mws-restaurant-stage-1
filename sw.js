var shellCache = 'restaurants-shell-v1';
var dynamicCache = "restaurants-dyn-v1";
var imgsCache = 'restaurants-imgs';
var allCaches = [shellCache, dynamicCache, imgsCache];



//start Workbox stuff here
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

const bgSyncPlugin = new workbox.backgroundSync.Plugin('requestQueue', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
});

workbox.routing.registerRoute(
  /http:\/\/localhost:1337\/reviews/,
  workbox.strategies.networkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

workbox.routing.registerRoute(
  new RegExp('http://localhost:1337/restaurants/.*/\?is_favorite=.*'),
  workbox.strategies.networkOnly({
    plugins: [bgSyncPlugin]
  }),
  'PUT'
);

//end Workbox stuff here

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(shellCache).then( (cache) => {
      return cache.addAll(['/',
        'js/all_index.js',
        'js/all_restaurant.js',
        'lib/idb/lib/idb.js',
        'manifest.json',
        'css/styles.css',
        'css/styles_detail.css',
        'css/styles_main.css',
        'css/styles_big_screen_detail.css',
        'css/styles_big_screen_main.css',
        'restaurant.html',
        'index.html'
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

    //check if its a request for json data from the database. If so return without caching
    if ((requestUrl == 'http://localhost:1337/reviews') || (requestUrl == 'http://localhost:1337/restaurants')){
            return fetch(event.request).then( (networkResponse) => {
                    return networkResponse;
                });
        }

    //check if the request was already cached and return it, 
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