#!/bin/bash

# ReBin Pro Deployment Script
# This script handles the complete deployment of ReBin Pro to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="rebin-pro"
BACKEND_IMAGE="rebin-pro/backend"
FRONTEND_IMAGE="rebin-pro/frontend"
REGISTRY="your-registry.com"
ENVIRONMENT=${1:-production}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if kubectl is installed (for Kubernetes deployment)
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl is not installed. Kubernetes deployment will be skipped."
    fi
    
    log_success "Dependencies check completed"
}

validate_environment() {
    log_info "Validating environment configuration..."
    
    # Check if environment file exists
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_error "Environment file .env.${ENVIRONMENT} not found"
        exit 1
    fi
    
    # Check required environment variables
    source ".env.${ENVIRONMENT}"
    
    required_vars=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "OPENROUTER_API_KEY"
        "ELEVENLABS_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment validation completed"
}

run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    cd backend
    if ! python -m pytest tests/ -v --cov=. --cov-report=html; then
        log_error "Backend tests failed"
        exit 1
    fi
    cd ..
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd frontend
    if ! npm test -- --coverage --watchAll=false; then
        log_error "Frontend tests failed"
        exit 1
    fi
    cd ..
    
    log_success "All tests passed"
}

build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t ${BACKEND_IMAGE}:latest -t ${BACKEND_IMAGE}:${ENVIRONMENT} ./backend
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t ${FRONTEND_IMAGE}:latest -t ${FRONTEND_IMAGE}:${ENVIRONMENT} ./frontend
    
    log_success "Docker images built successfully"
}

push_images() {
    log_info "Pushing images to registry..."
    
    # Tag images for registry
    docker tag ${BACKEND_IMAGE}:latest ${REGISTRY}/${BACKEND_IMAGE}:latest
    docker tag ${BACKEND_IMAGE}:${ENVIRONMENT} ${REGISTRY}/${BACKEND_IMAGE}:${ENVIRONMENT}
    docker tag ${FRONTEND_IMAGE}:latest ${REGISTRY}/${FRONTEND_IMAGE}:latest
    docker tag ${FRONTEND_IMAGE}:${ENVIRONMENT} ${REGISTRY}/${FRONTEND_IMAGE}:${ENVIRONMENT}
    
    # Push images
    docker push ${REGISTRY}/${BACKEND_IMAGE}:latest
    docker push ${REGISTRY}/${BACKEND_IMAGE}:${ENVIRONMENT}
    docker push ${REGISTRY}/${FRONTEND_IMAGE}:latest
    docker push ${REGISTRY}/${FRONTEND_IMAGE}:${ENVIRONMENT}
    
    log_success "Images pushed to registry"
}

deploy_database() {
    log_info "Deploying database migrations..."
    
    # Run database migrations
    cd database
    if ! python migrate.py; then
        log_error "Database migration failed"
        exit 1
    fi
    cd ..
    
    log_success "Database migrations completed"
}

deploy_cloudflare_worker() {
    log_info "Deploying Cloudflare Worker..."
    
    cd cloudflare-worker
    
    # Install dependencies
    npm install
    
    # Deploy worker
    if ! npx wrangler deploy; then
        log_error "Cloudflare Worker deployment failed"
        exit 1
    fi
    
    cd ..
    
    log_success "Cloudflare Worker deployed"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Deploy using Docker Compose
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        docker-compose -f docker-compose.yml up -d
    fi
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if ! docker-compose ps | grep -q "Up (healthy)"; then
        log_error "Some services are not healthy"
        docker-compose logs
        exit 1
    fi
    
    log_success "Application deployed successfully"
}

deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Deploy monitoring services
    docker-compose -f docker-compose.monitoring.yml up -d
    
    log_success "Monitoring stack deployed"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Get the application URL
    if [ "$ENVIRONMENT" = "production" ]; then
        APP_URL="https://your-production-domain.com"
    else
        APP_URL="http://localhost:3000"
    fi
    
    # Check backend health
    if ! curl -f "${APP_URL}/api/health" > /dev/null 2>&1; then
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend
    if ! curl -f "${APP_URL}" > /dev/null 2>&1; then
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_success "Health checks passed"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove old images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

send_notification() {
    log_info "Sending deployment notification..."
    
    # Send notification to Slack/Teams/etc.
    # This is a placeholder - implement your notification system
    echo "Deployment to ${ENVIRONMENT} completed successfully at $(date)" > deployment.log
    
    log_success "Notification sent"
}

# Main deployment flow
main() {
    log_info "Starting ReBin Pro deployment to ${ENVIRONMENT}..."
    
    check_dependencies
    validate_environment
    run_tests
    build_images
    push_images
    deploy_database
    deploy_cloudflare_worker
    deploy_application
    deploy_monitoring
    run_health_checks
    cleanup
    send_notification
    
    log_success "ReBin Pro deployment completed successfully!"
    log_info "Application is available at: https://your-domain.com"
    log_info "API Documentation: https://your-domain.com/docs"
    log_info "Monitoring Dashboard: https://your-domain.com/grafana"
}

# Handle script arguments
case "${1:-}" in
    "test")
        log_info "Running tests only..."
        check_dependencies
        run_tests
        ;;
    "build")
        log_info "Building images only..."
        check_dependencies
        build_images
        ;;
    "deploy")
        log_info "Deploying application only..."
        check_dependencies
        validate_environment
        deploy_application
        ;;
    "full")
        main
        ;;
    *)
        echo "Usage: $0 {test|build|deploy|full} [environment]"
        echo "  test     - Run tests only"
        echo "  build    - Build Docker images only"
        echo "  deploy   - Deploy application only"
        echo "  full     - Full deployment (default)"
        echo "  environment - production|staging|development (default: production)"
        exit 1
        ;;
esac