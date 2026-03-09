# Tuyensinh Docker Deployment

This repository is configured to be deployed using Docker. It includes three services:
1. **Frontend**: React (Vite) compiled to static files and served via Nginx on port 81.
2. **Backend**: Strapi application running on port 1338.
3. **Database**: PostgreSQL version 18 running on port 5433.

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Running the Application
To build the images and start the fullstack application, run the following command in the root directory (`d:\Github\tuyensinh`):
```bash
docker compose up -d --build
```
*(You can also use `docker-compose` if you are using an older version).*

This will build the Docker images for the frontend and backend, and start all containers in detached mode.

### Accessing the Services
Once the containers are up and running, you can access the applications in your browser:
- **Frontend App**: [http://localhost:81](http://localhost:81)
- **Strapi Admin Panel**: [http://localhost:1338/admin](http://localhost:1338/admin)

## Stopping the Application
To stop the application and remove the containers, run:
```bash
docker compose down
```

## Environment Variables
The `docker-compose.yml` file contains default environment variables, keys, and secrets that allow the application to start immediately. For a production deployment, it is strongly recommended to extract sensitive variables (like `DATABASE_PASSWORD`, `JWT_SECRET`, etc.) into a `.env` file.
