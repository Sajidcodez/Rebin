#!/bin/bash

# ReBin Pro Setup Script
# This script sets up the development environment for ReBin Pro

set -e  # Exit on any error

echo "🚀 Setting up ReBin Pro..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.11+ from https://python.org/"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$(echo "$PYTHON_VERSION < 3.11" | bc -l)" -eq 1 ]; then
        print_warning "Python 3.11+ is recommended. Current version: $(python3 --version)"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. You'll need Docker for containerized deployment."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. You'll need it for containerized deployment."
    fi
    
    print_success "Requirements check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Install cloudflare worker dependencies
    print_status "Installing Cloudflare Worker dependencies..."
    cd cloudflare-worker
    npm install
    cd ..
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    if [ -f "requirements.txt" ]; then
        python3 -m pip install -r requirements.txt
    fi
    cd ..
    
    # Install CV mock service dependencies
    print_status "Installing CV mock service dependencies..."
    cd services/cv-mock
    if [ -f "requirements.txt" ]; then
        python3 -m pip install -r requirements.txt
    fi
    cd ../..
    
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy environment files if they don't exist
    if [ ! -f ".env" ]; then
        cp env.example .env
        print_success "Created .env file from env.example"
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    if [ ! -f "frontend/.env" ]; then
        cp frontend/env.example frontend/.env
        print_success "Created frontend/.env file from frontend/env.example"
    else
        print_warning "frontend/.env file already exists, skipping..."
    fi
    
    if [ ! -f "backend/.env" ]; then
        cp backend/env.example backend/.env
        print_success "Created backend/.env file from backend/env.example"
    else
        print_warning "backend/.env file already exists, skipping..."
    fi
    
    print_warning "Please update the .env files with your actual API keys and configuration"
}

# Main setup function
main() {
    echo "🎯 ReBin Pro - AI-Powered Waste Sorting Setup"
    echo "=============================================="
    
    check_requirements
    install_dependencies
    setup_environment
    
    echo ""
    print_success "Setup completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env files with actual API keys"
    echo "2. Run 'npm run dev' to start development servers"
    echo "3. Or run 'npm run start' to start with Docker"
    echo ""
    echo "Available commands:"
    echo "  npm run dev          - Start all services in development mode"
    echo "  npm run start        - Start with Docker Compose"
    echo "  npm run build        - Build for production"
    echo "  npm run test         - Run tests"
    echo "  npm run lint         - Run linting"
    echo ""
    echo "For more information, see README.md"
}

# Run main function
main "$@"
