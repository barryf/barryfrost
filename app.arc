@app
barryfrost

@aws
region eu-west-2
runtime nodejs18.x

@http
post /notify
get /barryfrost.jpg
get /feed.json
get /map/*
get /rss
get /posts/:id
get /articles/:slug
get /robots.txt
get /.well-known/host-meta/:slug
get /.well-known/webfinger
get /*

@static
fingerprint true
folder public
ignore
  styles-dev.css
