@app
barryfrost

@aws
region eu-west-2

@http
get /barryfrost.jpg
get /feed.json
get /map/*
get /rss
get /posts/:id
get /articles/:slug
get /*

@static
fingerprint true
folder public
