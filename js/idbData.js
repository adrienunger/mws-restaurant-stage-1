var dbPromise = idb.open('jsonResp', 2, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
	    case 0:
	        upgradeDb.createObjectStore('restaurantData');
	    case 1:
	        upgradeDb.createObjectStore('reviewData');
	  }
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
	return dbPromise.then(db =>{
		var tx = db.transaction('restaurantData');
		var restaurantDataStore = tx.objectStore('restaurantData');
		return restaurantDataStore.get('restaurants');
	});
}

function storeReviewData(jsonData){
	dbPromise.then(db =>{
		var tx = db.transaction('reviewData','readwrite');
		var restaurantDataStore = tx.objectStore('reviewData');
		restaurantDataStore.put(jsonData, 'reviews');
		return tx.complete;
	});
}

function getReviewData(){
	return dbPromise.then(db =>{
		var tx = db.transaction('reviewData');
		var restaurantDataStore = tx.objectStore('reviewData');
		return restaurantDataStore.get('reviews');
	});
}