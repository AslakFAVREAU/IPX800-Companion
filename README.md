# companion-module-ipx800

Companion module for GCE IPX800 V5 relay control.

## Description

This module allows you to control relays on the GCE IPX800 V5 device via HTTP API through Bitfocus Companion.

## Features

- **Relay Control**: Turn relays ON/OFF (relays 1-32)
- **Toggle Function**: Toggle relay states
- **Variables**: Track relay states and connection status
- **Feedbacks**: Visual feedback for relay states (future enhancement)

## Configuration

1. **IP Address**: Enter the IP address of your IPX800 V5 device
2. **API Key**: Enter your IPX800 API key for authentication

## Actions

### Relay ON/OFF
Control individual relays with explicit ON/OFF commands.

**Options:**
- Relay Number (1-32)
- State (ON/OFF)

### Relay Toggle
Toggle the current state of a relay.

**Options:**
- Relay Number (1-32)

## Variables

The module provides the following variables:

- `relay_1_state` to `relay_32_state`: Current state of each relay
- `connection_status`: Connection status to the IPX800
- `last_command`: Last command sent to the device
- `ipx800_host`: Currently configured host IP

## Requirements

- GCE IPX800 V5 device
- Network connectivity between Companion and IPX800
- Valid API key configured on the IPX800

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/AslakFAVREAU/IPX800-Companion).

## License

MIT License - see [LICENSE](./LICENSE) file for details.