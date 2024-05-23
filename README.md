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
4. Create `shopper_approved_feed` table:
```
CREATE TABLE shopper_approved_feed(
	id INT AUTO_INCREMENT,
	merchant_id INT,
	name VARCHAR(100),
	merchant_url VARCHAR(200),
	rating_url VARCHAR(200),
	merchant_rating FLOAT(2),
	review_count INT,
	create_timestamp TIMESTAMP,
	last_update_timestamp TIMESTAMP,
	PRIMARY KEY(id)
);
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

```
node index.js
```
