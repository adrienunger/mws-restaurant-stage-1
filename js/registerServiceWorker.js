
/**
 * Register a serviceWorker
 */
registerServiceWorker = () => {
    //check if serviceWorker is supported, otherwise return
    if (!navigator.serviceWorker) return;
  
    navigator.serviceWorker.register('/sw.js').catch(function(){
      console.log("Something went wrong. ServiceWorker not registered");
    });
  };
  
  registerServiceWorker();