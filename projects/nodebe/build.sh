#!/bin/bash

cd /srv/www/fofweb/fofweb/projects/nodebe

#CONTAINER ID   IMAGE                         COMMAND                  CREATED        STATUS        PORTS                                                                            NAMES
#707980cd3836   andrei/nodejs-fofbe           "docker-entrypoint.s…"   5 weeks ago    Up 42 hours                                                                                    gifted_herschel

docker stop gifted_herschel
docker rm gifted_herschel

docker rmi andrei/nodejs-fofbe

docker build -t andrei/nodejs-fofbe .

docker run -d -p 3080:3080 --network="host" --restart=unless-stopped --name gifted_herschel andrei/nodejs-fofbe
