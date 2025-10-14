#!/bin/bash
###############################################################################
# Image Security Scanner
#
# Scans Docker images for vulnerabilities using Trivy before deployment.
# This script should be run in CI/CD before pushing images to registry.
#
# Usage:
#   ./scan-image.sh <image-name>
#
# Example:
#   ./scan-image.sh agentnexus-python-echo:v1
#
# Exit Codes:
#   0 - No vulnerabilities or only LOW/MEDIUM
#   1 - HIGH or CRITICAL vulnerabilities found
#   2 - Trivy not installed or error occurred
###############################################################################

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SEVERITY_THRESHOLD="HIGH,CRITICAL"
TRIVY_CACHE_DIR="${HOME}/.cache/trivy"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo "ℹ $1"
}

# Check if Trivy is installed
check_trivy() {
    if ! command -v trivy &> /dev/null; then
        print_error "Trivy is not installed"
        echo ""
        echo "Install Trivy:"
        echo "  macOS:  brew install trivy"
        echo "  Linux:  wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -"
        echo "          echo 'deb https://aquasecurity.github.io/trivy-repo/deb \$(lsb_release -sc) main' | sudo tee -a /etc/apt/sources.list.d/trivy.list"
        echo "          sudo apt-get update && sudo apt-get install trivy"
        return 1
    fi
    return 0
}

# Update Trivy vulnerability database
update_trivy_db() {
    print_info "Updating Trivy vulnerability database..."
    trivy image --download-db-only --cache-dir "${TRIVY_CACHE_DIR}" 2>&1 | grep -v "Downloading" || true
    print_success "Database updated"
}

# Scan image for vulnerabilities
scan_image() {
    local image=$1
    
    print_info "Scanning image: ${image}"
    echo ""
    
    # Run Trivy scan
    local temp_file=$(mktemp)
    
    if trivy image \
        --severity "${SEVERITY_THRESHOLD}" \
        --no-progress \
        --cache-dir "${TRIVY_CACHE_DIR}" \
        --format json \
        --output "${temp_file}" \
        "${image}"; then
        
        # Parse results
        local critical_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "${temp_file}" 2>/dev/null || echo "0")
        local high_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "${temp_file}" 2>/dev/null || echo "0")
        
        # Display summary
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "  SCAN RESULTS"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        
        if [ "${critical_count}" -eq 0 ] && [ "${high_count}" -eq 0 ]; then
            print_success "No HIGH or CRITICAL vulnerabilities found!"
            echo ""
            print_info "Severity breakdown:"
            
            # Show all severity levels
            trivy image \
                --severity "LOW,MEDIUM,HIGH,CRITICAL" \
                --no-progress \
                --cache-dir "${TRIVY_CACHE_DIR}" \
                "${image}" | grep -E "Total:|LOW:|MEDIUM:|HIGH:|CRITICAL:" || echo "  No vulnerabilities found"
            
            echo ""
            print_success "Image is safe to deploy"
            rm -f "${temp_file}"
            return 0
        else
            print_error "${critical_count} CRITICAL and ${high_count} HIGH vulnerabilities found!"
            echo ""
            
            # Show detailed report
            trivy image \
                --severity "${SEVERITY_THRESHOLD}" \
                --no-progress \
                --cache-dir "${TRIVY_CACHE_DIR}" \
                "${image}"
            
            echo ""
            echo "════════════════════════════════════════════════════════════"
            print_error "DEPLOYMENT BLOCKED - Fix vulnerabilities before deploying"
            echo "════════════════════════════════════════════════════════════"
            
            rm -f "${temp_file}"
            return 1
        fi
    else
        print_error "Trivy scan failed"
        rm -f "${temp_file}"
        return 2
    fi
}

# Generate HTML report
generate_report() {
    local image=$1
    local output_file="security-report-$(echo ${image} | tr ':/' '--').html"
    
    print_info "Generating HTML report..."
    
    if trivy image \
        --format template \
        --template '@contrib/html.tpl' \
        --cache-dir "${TRIVY_CACHE_DIR}" \
        --output "${output_file}" \
        "${image}"; then
        
        print_success "Report saved: ${output_file}"
    else
        print_warning "Failed to generate HTML report"
    fi
}

# Main execution
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  AgentNexus Image Security Scanner (Trivy)                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Check arguments
    if [ $# -eq 0 ]; then
        print_error "No image specified"
        echo ""
        echo "Usage: $0 <image-name>"
        echo ""
        echo "Examples:"
        echo "  $0 agentnexus-python-echo:v1"
        echo "  $0 agentnexus-nodejs-echo:v1"
        echo "  $0 ghcr.io/username/agentnexus-python-echo:v1"
        exit 2
    fi
    
    local image=$1
    
    # Verify Trivy is installed
    if ! check_trivy; then
        exit 2
    fi
    
    # Update vulnerability database
    update_trivy_db
    echo ""
    
    # Scan image
    if scan_image "${image}"; then
        # Generate optional HTML report
        if [ "${GENERATE_HTML_REPORT:-false}" = "true" ]; then
            echo ""
            generate_report "${image}"
        fi
        
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"

