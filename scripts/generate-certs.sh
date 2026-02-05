#!/bin/bash
# Generate self-signed TLS certificates for development
# For production, use Let's Encrypt (see docs/SECURITY.md)

set -e

CERT_DIR="./certs"
DAYS_VALID=365

echo "🔐 Generating self-signed TLS certificates for development..."

# Create certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key
openssl genrsa -out "$CERT_DIR/server.key" 2048

# Generate certificate signing request
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" \
  -subj "/C=US/ST=State/L=City/O=MissionControl/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days $DAYS_VALID \
  -in "$CERT_DIR/server.csr" \
  -signkey "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.crt" \
  -extfile <(printf "subjectAltName=DNS:localhost,IP:127.0.0.1")

# Set permissions
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"

# Clean up CSR
rm "$CERT_DIR/server.csr"

echo "✅ Certificates generated successfully:"
echo "   - Private key: $CERT_DIR/server.key"
echo "   - Certificate: $CERT_DIR/server.crt"
echo "   - Valid for: $DAYS_VALID days"
echo ""
echo "⚠️  Note: These are DEVELOPMENT certificates only!"
echo "    For production, use Let's Encrypt (see docs/SECURITY.md)"
