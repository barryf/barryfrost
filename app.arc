@app
barryfrost

@aws
region eu-west-2

@http
post /notify
get /barryfrost.jpg
get /feed.json
get /map/*
get /rss
get /posts/:id
get /articles/:slug
get /robots.txt
get /*

@static
fingerprint true
folder public
ignore
  styles-dev.css
