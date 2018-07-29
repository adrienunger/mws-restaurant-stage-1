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
		var reviewDataStore = tx.objectStore('reviewData');
		reviewDataStore.put(jsonData, 'reviews');
		return tx.complete;
	}).then(()=>console.log("stored successfully"));
}

function getReviewData(){
	return dbPromise.then(db =>{
		var tx = db.transaction('reviewData');
		var reviewDataStore = tx.objectStore('reviewData');
		return reviewDataStore.get('reviews');
	});
}


function updateFavourite(restaurantId, isFavourite){
	return dbPromise.then(db =>{
		var tx = db.transaction('restaurantData','readwrite');
		var restaurantDataStore = tx.objectStore('restaurantData');
		restaurantDataStore.get('restaurants')
		.then(restaurants =>{
			for (let i = 0 ; i<restaurants.length; i++){
				//console.log(restaurants[i]);
				if (restaurants[i].id == restaurantId){
					console.log(restaurants[i].name);
					restaurants[i].is_favorite = String(isFavourite);
				}
			}
			//restaurants[restaurantId-1].is_favorite = isFavourite;
			restaurantDataStore.put(restaurants,'restaurants'); //put possibly takes both, key and value 
			return tx.complete;
		})
	});
}