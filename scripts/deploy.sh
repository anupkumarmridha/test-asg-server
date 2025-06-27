#!/bin/bash

# Deployment script for test-asg-server (dev or prod)

set -e

ENV_ARG=${1:-""}

if [ "$ENV_ARG" = "prod" ]; then
  echo "Deploying to PRODUCTION..."
  export ENV_FILE=".env.production"
  export COMPOSE_FILE="docker-compose.prod.yml"
  
  echo "Using $ENV_FILE and $COMPOSE_FILE"
  docker-compose --env-file $ENV_FILE -f $COMPOSE_FILE build
  docker-compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d
  echo "Production deployment complete. Showing logs:"
  docker-compose --env-file $ENV_FILE -f $COMPOSE_FILE logs -f
elif [ "$ENV_ARG" = "dev" ]; then
  echo "Deploying to DEVELOPMENT..."
  export ENV_FILE=".env"
  export COMPOSE_FILE="docker-compose.yml"
  
  echo "Using $ENV_FILE and $COMPOSE_FILE"
  docker-compose --env-file $ENV_FILE -f $COMPOSE_FILE build
  docker-compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d
  echo "Development deployment complete. Showing logs:"
  docker-compose --env-file $ENV_FILE -f $COMPOSE_FILE logs -f
else
  echo "Usage: $0 [dev|prod]"
  echo "  dev  - Deploy using docker-compose.yml and .env (default)"
  echo "  prod - Deploy using docker-compose.prod.yml and .env.production"
  exit 1
fi