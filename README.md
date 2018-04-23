# Progressive Restaurant Review Web App
---

## Project Overview

This project is a web app for reviewing restaurants and browsing through restaurant information as well as other peoples reviews.

I've converted a very simple static webpage with only the basic functionalities in place into a feature-rich, fully-fledged progressive web-app. The original project was barely usable on a desktop browser, much less so on a mobile device. It featured no offline / caching capabilities, was neither accessible nor responsive and the data was stored locally in the project. 

### Features 

- **Fully responsive, mobile-ready design:**
    - Responsive images and art direction
    - Design adapts to every viewport size
    - Off-Canvas Pattern usage for small mobile Devices
- **Accesibility:**
    - Fulfills latest accessibility standards
    - Screen-reader support
    - Aria attributes
- **Progressive Web App / Offline Capabilities:**
    - ServiceWorker
    - Offline capability of visited sites through:
	    - Caching of application shell and requests via *Cache API*
	    - Local data caching using *indexedDB* (with the indexedDB Promises Library)
    - Web App Manifest defining app behaviour when installed on a smartphones homescreen
- **Future-proof code:**
    - the code is written to conform with the latest JavaScript features and standards (ES6)
    - maintains full compatibility with older browser via transpiling (work in progress; currently disabled)
    - Asynchronous data retrieval using the Fetch API
- **Sophisticated Build Process:**
	- Project Structure separating development and distribution/production code
	- Gulp build process featuring:
		- *CSS processing* with sass and autoprefixer
		- *JS processing* with concatenation, minification, tanspiling with babel
		- CSS and JS *source maps*
		- *Image minification* through lossless compression
		- *Live-editing* with browsersync
		- Seperate tasks for development and distribution
- **Site Performance + Quality:**
	- optimized to satisfy Google Chrome Lighthouse audits
		- Scoring:
			- Progressive Web Apps: >90 
			- Performance: >70 
			- Accessibility: >90
	- Advanced performance optimising techniques:
		- lazyloading images (with responsively-lazy library)



### How to test it?

**Start the Server:**
Follow the "Getting Started" instructions in this repo:
https://github.com/adrienunger/mws-restaurant-stage-2
This will start the Server delivering the restaurant data over network.

**Start the Web App:**
Start a simple HTTP server in the "/dist" folder to serve the files on your local computer over the network.

- Python 2:
        `python -m SimpleHTTPServer 8000`

- Python 3:
        `python3 -m http.server 8000`

Visit the Site on `http://localhost:8000`



### Credits/Attribution
Burger Icons used in this project by: https://creativemarket.com/BomSymbols
https://www.iconfinder.com/icons/2427852/burger_cheeseburger_fast_food_food_junk_food_icon#size=256


