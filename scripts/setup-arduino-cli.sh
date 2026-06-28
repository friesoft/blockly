#!/bin/bash
set -e

# Pinned version and sha256 checksum for supply-chain security
ARDUINO_CLI_VERSION="1.5.1"
EXPECTED_SHA256="28a8e119c498a25607821c36cb2dc49e8463941b261a0d99091baa7bc692dd2b"
TARBALL="arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz"
DOWNLOAD_URL="https://github.com/arduino/arduino-cli/releases/download/v${ARDUINO_CLI_VERSION}/${TARBALL}"

echo "Downloading arduino-cli v${ARDUINO_CLI_VERSION}..."
mkdir -p compilation/arduino
cd compilation/arduino

# Download the tarball
curl -fsSLO "$DOWNLOAD_URL"

# Verify the checksum
echo "Verifying SHA256 checksum..."
ACTUAL_SHA256=$(sha256sum "$TARBALL" | awk '{print $1}')
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
    echo "ERROR: Checksum mismatch!"
    echo "Expected: $EXPECTED_SHA256"
    echo "Got:      $ACTUAL_SHA256"
    exit 1
fi
echo "Checksum verified successfully."

# Extract the binary and remove tarball
tar -xzf "$TARBALL" arduino-cli
rm "$TARBALL"

echo "Updating arduino-cli core index..."
./arduino-cli core update-index

echo "Installing required Arduino cores..."
./arduino-cli core install arduino:avr@1.8.3
./arduino-cli core install arduino:samd@1.8.9
./arduino-cli core install arduino:megaavr@1.8.6
./arduino-cli core install esp8266:esp8266@2.7.4
./arduino-cli core install esp32:esp32@1.0.4

echo "Re-updating index..."
./arduino-cli core update-index

echo "arduino-cli setup complete!"
