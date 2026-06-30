#!/bin/bash
cat << 'EOF' > /etc/udev/rules.d/99-ottoblockly.rules
# CH340 / CH341
SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", MODE="0666"
# FTDI
SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", MODE="0666"
# CP210x
SUBSYSTEM=="tty", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", MODE="0666"
# Arduino Uno / Mega / Leonardo
SUBSYSTEM=="tty", ATTRS{idVendor}=="2341", MODE="0666"
SUBSYSTEM=="tty", ATTRS{idVendor}=="2a03", MODE="0666"
EOF
udevadm control --reload-rules || true
udevadm trigger || true
