# test-asg-server

A simple Express.js server with health check endpoint and logging capabilities.

## Features

- Health check endpoint at `/health`
- Request logging with timestamps
- File-based logging to `app.log`

## Running with Docker

### Build the Docker image

```bash
docker build -t test-asg-server .
```

### Run the container

```bash
docker run -p 8080:8080 test-asg-server
```

### Run in detached mode

```bash
docker run -d -p 8080:8080 --name test-asg-server test-asg-server
```

## Running with Docker Compose

### Development

```bash
# Start the service
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Production

```bash
# Start production service
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production service
docker-compose -f docker-compose.prod.yml down
```

### Useful Docker Compose Commands

```bash
# Rebuild and start
docker-compose up --build

# Scale the service (if needed)
docker-compose up --scale test-asg-server=3

# View service status
docker-compose ps

# Execute commands in running container
docker-compose exec test-asg-server sh
```

## API Endpoints

- `GET /health` - Returns health status with timestamp and version

## Local Development

```bash
npm install
npm start
```

The server will start on port 8080.
