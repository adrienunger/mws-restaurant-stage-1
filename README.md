# Restaurant Review Web-App
---

## Project Overview

This project is a web-app for reviewing restaurants and browsing through restaurant information as well as other peoples reviews.

I've converted a very simple static webpage with only the basic functionalities in place into a feature-rich, fully-fledged progressive web-app. The original project was barely usable on a desktop browser, much less so on a mobile device. It featured no offline / caching capabilities, was neither accessible nor responsive and the data was stored locally in the project. 

### Features 

- Fully responsive, mobile-ready design:
    - Responsive images and art direction
    - Design adapts to every viewport size
    - Off-Canvas Pattern usage for small mobile Devices
- Accesibility:
    - Fulfills latest accessibility standards
    - Screen-reader support
    - Aria attributes
- Progressive Web App / Offline Capabilities:
    - ServiceWorker
    - Caching of visited sites via Cache API
- future-proof code:
    - the code is written to conform with the latest JavaScript features and standards (ES6)
    - maintains full compatibility with older browser via transpiling


### How to test it?

Start a simple HTTP server in the "/dist" folder to serve the files on your local computer over the network.

- Python 2:
        `python -m SimpleHTTPServer 8000`

- Python 3:
        `python3 -m http.server 8000`

Visit the Site on `http://localhost:8000`



### Credits/Attribution
Burger Icons used in this project by: https://creativemarket.com/BomSymbols
https://www.iconfinder.com/icons/2427852/burger_cheeseburger_fast_food_food_junk_food_icon#size=256


