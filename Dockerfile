FROM node

RUN apt-get update

RUN npm install -g nodemon knex

EXPOSE 3000

WORKDIR /usr/src

CMD knex migrate:latest
CMD knex seed:run

CMD nodemon bin/www
