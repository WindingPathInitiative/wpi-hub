FROM node

RUN apt-get update

RUN npm install -g nodemon knex

EXPOSE 3000

WORKDIR /usr/src

CMD ["./init.sh"]
