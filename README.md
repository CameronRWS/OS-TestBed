# OSTestBed

Website that lets users upload simple kernel images, and network boot them in the browser.

## First Time Setup

#### sql setup

1. Install mysql and log in as root: 
```sh
sudo msyql -u root -p
```

1. Initialize the database: 
```sql
CREATE DATABASE ostestbed;
``` 

1. Create a new user and give access to ostestbed
```sql
GRANT ALL PRIVILEGES ON ostestbed.* TO '<insert your user here>'@'localhost' IDENTIFIED BY '<insert your password here>';
````

#### `.env`

Put in two `.env` files in `backend/` and `frontend/`

Example `.env` for hosting on local machine

---

backend `.env`:

```
# ostestbed/backend/.env
DB_USER="<insert your sql user here>"
DB_PASSWORD="<insert your sql password here>"
DB_SCHEMA="ostestbed"
DB_HOST="localhost"
IP="localhost"
PORT=8080
OS="<insert your OS here>"
```

---

frontend `.env`:

```
# ostestbed/frontend/.env
REACT_APP_IP="localhost"
```

## Running

run inside of `backend/` to start the backend server
```sh
npm install
npm start
```

run inside of `frontend/` to start the frontend server
```sh
npm install
npm start
```

now you can type `localhost:3000` in your browser to view the website!

