//import * as 'idb' from './lib/idb/lib/idb.js';

var dbPromise = idb.open('jsonResp', 1, function(upgradeDb) {
    upgradeDb.createObjectStore('restaurantData');
  });



function storeRestaurantData(jsonData){
	dbPromise.then(db =>{
		var tx = db.transaction('restaurantData','readwrite');
		var restaurantDataStore = tx.objectStore('restaurantData');
		restaurantDataStore.put(jsonData, 'restaurants');
		return tx.complete;
	});
}

function getRestaurantData(){
	dbPromise.then(db =>{
		var tx = db.transaction('restaurantData');
		var restaurantDataStore = tx.objectStore('restaurantData');
		return restaurantDataStore.get('restaurants');
	});
}