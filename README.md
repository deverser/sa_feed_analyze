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
2. In the code add the path to feed file in `xmlFile` variable.
3. Add configuration for MySQL connection in `dbConfig`:
```
 const dbConfig = {
	host: 'your_host',
	user: 'user_login',
	password: 'user_password',
	database: 'sa_analyze'
};
```
You also can use credentials for `root` user for development and tests.

## Usage

To store the data from file to table, run the next command:
```
node index.js
```
To reset the data from table, run the next command:
```
node reset.js
```
