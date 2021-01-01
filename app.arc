@app
barryfrost

@aws
region eu-west-2

@http
get /rss
get /*

@static
fingerprint true
folder public

@env
testing
  ROOT_URL http://localhost:4444/
  MICROPUB_URL http://localhost:3333/micropub
production
  MICROPUB_URL https://api.barryfrost.com/micropub
  ROOT_URL https://barryf.co.uk/
