#!/bin/bash
# Tower Scout - Master Control System
# Usage: ./tower-scout.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXEC_DIR="$SCRIPT_DIR/execution"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOG_DIR="$SCRIPT_DIR/logs"

# Create log directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TOWER SCOUT]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓ SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗ ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠ WARNING]${NC} $1"
}

# Function to check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    print_success "Python 3 is installed"
}

# Function to check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    source "$SCRIPT_DIR/.env"
    
    local missing=()
    
    [ -z "$FIRECRAWL_API_KEY" ] && missing+=("FIRECRAWL_API_KEY")
    [ -z "$GROQ_API_KEY" ] && missing+=("GROQ_API_KEY")
    [ -z "$SERPAPI_KEY" ] && missing+=("SERPAPI_KEY")
    [ -z "$GOOGLE_API_KEY" ] && missing+=("GOOGLE_API_KEY")
    
    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing environment variables: ${missing[*]}"
        exit 1
    fi
    
    print_success "All API keys configured"
}

# Function to install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    cd "$SCRIPT_DIR"
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Created Python virtual environment"
    fi
    
    source venv/bin/activate
    
    pip install -q firecrawl-py serpapi google-genai python-dotenv geopy requests 2>&1 | tail -5
    
    print_success "Python dependencies installed"
}

# Function to install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    cd "$FRONTEND_DIR"
    npm install --silent 2>&1 | tail -3
    print_success "Node.js dependencies installed"
}

# Function to start the Scout (Loop 1)
start_scout() {
    print_status "Starting THE SCOUT (Loop 1: Discovery)..."
    cd "$SCRIPT_DIR"
    source venv/bin/activate
    nohup python3 "$EXEC_DIR/scout.py" > "$LOG_DIR/scout.log" 2>&1 &
    echo $! > "$LOG_DIR/scout.pid"
    print_success "Scout started (PID: $(cat "$LOG_DIR/scout.pid"))"
}

# Function to start the Harvester (Loop 2)
start_harvester() {
    print_status "Starting THE HARVESTER (Loop 2: Scraping)..."
    cd "$SCRIPT_DIR"
    source venv/bin/activate
    nohup python3 "$EXEC_DIR/harvester.py" > "$LOG_DIR/harvester.log" 2>&1 &
    echo $! > "$LOG_DIR/harvester.pid"
    print_success "Harvester started (PID: $(cat "$LOG_DIR/harvester.pid"))"
}

# Function to start the Enricher (Loop 3)
start_enricher() {
    print_status "Starting THE ENRICHER (Loop 3: AI Processing)..."
    cd "$SCRIPT_DIR"
    source venv/bin/activate
    nohup python3 "$EXEC_DIR/enricher.py" > "$LOG_DIR/enricher.log" 2>&1 &
    echo $! > "$LOG_DIR/enricher.pid"
    print_success "Enricher started (PID: $(cat "$LOG_DIR/enricher.pid"))"
}

# Function to start the Geocoder
start_geocoder() {
    print_status "Starting THE GEOCODER (Map Coordinates)..."
    cd "$SCRIPT_DIR"
    source venv/bin/activate
    nohup python3 "$EXEC_DIR/geocoder.py" > "$LOG_DIR/geocoder.log" 2>&1 &
    echo $! > "$LOG_DIR/geocoder.pid"
    print_success "Geocoder started (PID: $(cat "$LOG_DIR/geocoder.pid"))"
}

# Function to start the Live Monitor
start_monitor() {
    print_status "Starting LIVE MONITOR..."
    cd "$SCRIPT_DIR"
    source venv/bin/activate
    nohup python3 "$EXEC_DIR/live_monitor.py" > "$LOG_DIR/monitor.log" 2>&1 &
    echo $! > "$LOG_DIR/monitor.pid"
    print_success "Monitor started (PID: $(cat "$LOG_DIR/monitor.pid"))"
}

# Function to stop all processes
stop_all() {
    print_status "Stopping all Tower Scout processes..."
    
    for pid_file in "$LOG_DIR"/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            name=$(basename "$pid_file" .pid)
            if kill "$pid" 2>/dev/null; then
                print_success "Stopped $name (PID: $pid)"
            else
                print_warning "$name was not running"
            fi
            rm -f "$pid_file"
        fi
    done
}

# Function to check process status
check_status() {
    print_status "Checking Tower Scout process status..."
    
    local running=0
    local stopped=0
    
    for pid_file in "$LOG_DIR"/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            name=$(basename "$pid_file" .pid)
            if kill -0 "$pid" 2>/dev/null; then
                print_success "$name is running (PID: $pid)"
                ((running++))
            else
                print_error "$name is NOT running (stale PID file)"
                rm -f "$pid_file"
                ((stopped++))
            fi
        fi
    done
    
    if [ $running -eq 0 ]; then
        print_warning "No Tower Scout processes are running"
    else
        print_success "$running processes running, $stopped stopped"
    fi
}

# Function to view logs
view_logs() {
    local component=$1
    if [ -f "$LOG_DIR/$component.log" ]; then
        tail -f "$LOG_DIR/$component.log"
    else
        print_error "Log file not found: $component.log"
    fi
}

# Function to build frontend
build_frontend() {
    print_status "Building Tower Scout frontend..."
    cd "$FRONTEND_DIR"
    npm run build 2>&1 | tail -20
    print_success "Frontend built to $FRONTEND_DIR/dist"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    cd "$FRONTEND_DIR"
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Install with: npm i -g vercel"
        exit 1
    fi
    
    vercel --prod
    print_success "Deployment complete"
}

# Function to show help
show_help() {
    cat << EOF
Tower Scout - Preconstruction Intelligence Platform

USAGE: ./tower-scout.sh [command]

COMMANDS:
  setup          Install all dependencies (Python + Node)
  start          Start all 3 loops + geocoder + monitor
  start-scout    Start only The Scout (Loop 1)
  start-harvester Start only The Harvester (Loop 2)
  start-enricher Start only The Enricher (Loop 3)
  start-geocoder Start only The Geocoder
  start-monitor  Start only The Monitor
  stop           Stop all running processes
  status         Check status of all processes
  logs [name]    View logs for component (scout, harvester, enricher, geocoder, monitor)
  build          Build the Next.js frontend
  deploy         Deploy frontend to Vercel
  test           Run system health check
  help           Show this help message

EXAMPLES:
  ./tower-scout.sh setup          # First-time setup
  ./tower-scout.sh start          # Start the entire system
  ./tower-scout.sh logs scout     # Watch Scout logs
  ./tower-scout.sh status         # Check what's running

EOF
}

# Function to run system health check
run_test() {
    print_status "Running Tower Scout system health check..."
    
    check_python
    check_env
    
    print_status "Testing database connectivity..."
    cd "$SCRIPT_DIR"
    source venv/bin/activate
    python3 -c "import db_client; print('Database module loaded')" 2>/dev/null || print_warning "DB client import failed"
    
    print_status "Testing API keys..."
    
    # Test Firecrawl
    source "$SCRIPT_DIR/.env"
    if [ -n "$FIRECRAWL_API_KEY" ]; then
        print_success "Firecrawl API key configured"
    fi
    
    # Test SerpAPI
    if [ -n "$SERPAPI_KEY" ]; then
        print_success "SerpAPI key configured"
    fi
    
    # Test Google
    if [ -n "$GOOGLE_API_KEY" ]; then
        print_success "Google AI key configured"
    fi
    
    print_success "System health check complete"
}

# Main command handler
case "${1:-help}" in
    setup)
        check_python
        check_env
        install_python_deps
        install_node_deps
        build_frontend
        print_success "Setup complete! Run './tower-scout.sh start' to begin."
        ;;
    start)
        check_env
        start_scout
        start_harvester
        start_enricher
        start_geocoder
        start_monitor
        print_success "All systems started!"
        print_status "View logs with: ./tower-scout.sh logs [scout|harvester|enricher|geocoder|monitor]"
        ;;
    start-scout)
        start_scout
        ;;
    start-harvester)
        start_harvester
        ;;
    start-enricher)
        start_enricher
        ;;
    start-geocoder)
        start_geocoder
        ;;
    start-monitor)
        start_monitor
        ;;
    stop)
        stop_all
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs "${2:-scout}"
        ;;
    build)
        install_node_deps
        build_frontend
        ;;
    deploy)
        build_frontend
        deploy_vercel
        ;;
    test)
        run_test
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
