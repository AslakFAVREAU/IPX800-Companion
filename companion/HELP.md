# Companion Module – IPX800 V5

This Companion module allows you to **control relays** of a **GCE IPX800 V5** automation controller via its HTTP API.

---

## 🔧 Required Configuration

Before using the module, configure it in Companion:

- **IP Address**: Local IP of your IPX800 (e.g. `10.10.40.10`)
- **API Key**: Your API key (`ApiKey`) defined in the IPX web interface

---

## ⚙️ Available Actions

### 1. Relay Control (ON/OFF)
- Allows you to activate or deactivate a relay
- Automatically selects from available relays detected via API
- Options:
  - **Relay**: Choose from dropdown list (e.g. `[IPX]Relay cmd 1 (ID: 65536)`)
  - **State**: `ON` or `OFF`

### 2. Relay Toggle
- Toggles the current state of a relay (ON→OFF or OFF→ON)
- Automatically selects from available relays detected via API
- Options:
  - **Relay**: Choose from dropdown list

### 3. Diagnostic Actions
- **Ping Test**: Tests basic network connectivity
- **API Test**: Tests API authentication and endpoints
- **Get IO List**: Retrieves and displays all available I/O
- **Test Relay Formats**: Tests different API request formats

---

## 🎨 Visual Feedback

The module provides **real-time feedback** with three types:

### 1. Relay State
- **Red** when the state **does not match** expected value
- **Default color** when the state **matches** expected value
- Compare actual state with ON/OFF selection

### 2. Relay ON
- **Green** when relay is **active** (ON)
- Gray when relay is inactive

### 3. Relay OFF
- **Gray** when relay is **inactive** (OFF)
- Default when relay is active

All feedbacks automatically query the IPX800 to display real-time status.

---

## 🔄 Dynamic Features

### Automatic Relay Detection
- The module automatically fetches available relays from your IPX800
- Filters to show only command relays (excludes status/input relays)
- Updates dropdown lists dynamically at startup

### Real-time Status
- Feedbacks poll relay status every few seconds
- Actions update immediately when executed
- Connection status monitoring

---

## 💡 Variable Tips

The module creates **dynamic variables** for relay states:

```
$(ipx800v5:relay_65536_state)
$(ipx800v5:last_command)
$(ipx800v5:connection_status)
```

These are automatically updated when actions are executed.

---

## 🛠 Relay ID Examples

The module automatically detects available relays, typically:

- 65536 → Relay cmd 1
- 65537 → Relay cmd 2
- 65538 → Relay cmd 3
- etc...

Use the dropdown selections instead of manual ID entry.

---

## 🚀 Getting Started

1. **Install** the module in Companion
2. **Configure** your IPX800 IP address and API key
3. **Wait** for automatic relay detection (check logs)
4. **Create actions** using the dropdown relay selections
5. **Add feedbacks** for visual status indication

---

## 🔍 Troubleshooting

### Connection Issues
- Verify IP address and API key are correct
- Check that IPX800 is accessible on your network
- Use the **Ping Test** action to verify connectivity

### No Relays in Dropdown
- Check API key permissions in IPX800 settings
- Use **Get IO List** action to see what's detected
- Verify relays are configured in IPX800

### API Errors
- Use **API Test** action for diagnostic information
- Check IPX800 firmware version (V5 required)
- Verify API is enabled in IPX800 settings

---

## 📬 Support

- Module developed by **Aslak Favreau**
- Contact: `aslak@evenement-soe.com`
- Version: Compatible with Companion 3.0+ and IPX800 V5
