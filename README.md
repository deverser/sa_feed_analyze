use Node v20.11.1+

## Prerequisites
At first you need to install MySQL 8.0+ database, i used bitnami/mysql docker container for this project [https://hub.docker.com/r/bitnami/mysql](https://hub.docker.com/r/bitnami/mysql).

1. After running the docker container via `docker-compose up` command, you need to login into container using `docker exec`: 
```
docker exec -it mysql-mysql-1 bash
```
2. And then activate mysql-cli:
```
mysql -u root
```
3. Next, create your database and select it:
```
CREATE DATABASE sa_analyze;
USE sa_analyze;
```
4. In project's directory run the next command to quick setup all the necessary tables in db:
```
node init.js
```

## Install

```
npm install
```
1. After installation of required packages, place 'shopper approved' feed `.xml` files in `feeds/` directory.
2. In the code add the filenames of the feed files located in `feeds/` folder in `xmlFile = []` variable.
3. Create a `.env` using the `.env.example` template and complete with the correct DB configuration.

Credentials on the example are useful for local testing.

## Usage

Everytime before using this app you should run your mysql docker container.

After that to store the data from file to tables, run the next command:
```
node index.js
```
To reset the data from tables, run the next command:
```
node reset.js
```
