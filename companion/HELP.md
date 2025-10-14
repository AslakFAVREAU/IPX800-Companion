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

The module provides **real-time feedback** with two types:

### 1. Relay Status (Recommended)
- **Red background** when relay is **ON** (active)
- **Default button color** (usually black/dark) when relay is **OFF** (inactive)
- **Simple and intuitive**: Just select the relay from dropdown
- **Perfect for status indication**: Clearly shows active relays

### 2. Relay State Comparison
- **Green background** when actual state **matches** expected state
- **Default button color** when actual state **does not match** expected state
- **Advanced usage**: Compare actual state with ON/OFF selection
- **Useful for validation**: Verify commands were executed correctly

### How Feedbacks Work in Companion

**Important**: In Companion, feedbacks work as follows:
- When callback returns `true` → Apply the colored style
- When callback returns `false` → Keep default button appearance

**Example Setup**:
1. Create a button with black background (default style)
2. Add "Relay Status" feedback
3. **Result**: Button turns red when relay is ON, stays black when OFF

All feedbacks automatically query the IPX800 every few seconds to display real-time status.

---

## ⚡️ How Feedbacks Work (Technical)

- The module keeps a local copy of all relay states (`relayStates`) in memory.
- Every 500ms, it polls the IPX800 API to update these states.
- When you use a feedback on a button, the callback instantly checks the local state (no HTTP request).
- After each polling, Companion automatically refreshes all feedbacks for instant display.
- This structure is inspired by the ATEM module for maximum reliability and performance.

**Advantages:**
- Instant button color change when relay state changes
- No network lag or overload
- Always synchronized with hardware, even if relays change outside Companion

---

## 🧑‍💻 User Guide: Setting Up Reliable Feedbacks

1. **Add a button in Companion**
2. **Add a feedback (Relay Status or Relay State Comparison)**
3. **Select the relay from the dropdown**
4. **Result:**
   - Button color changes instantly when the relay state changes (red for ON, black for OFF)
   - No need to configure polling or refresh: everything is automatic

**Tip:** You can use multiple feedbacks on different buttons, all will update in real time as the hardware changes.

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

## 🟢 Automatic Relay State Tracking

After every relay command (ON, OFF, or TOGGLE), the module automatically queries the IPX800 for the real relay state and updates the variable:

- `$(ipx800v5:relay_65536_state)` will be set to `ON` or `OFF` based on the actual hardware status
- This ensures feedbacks and variables always reflect the true state

**On module startup:**
- The module queries all detected relays and initializes their state variables
- You always start with the real status of each relay

**Example:**
- You send a command to turn Relay 1 ON
- The module sends the command, then immediately checks the relay status
- Variable `relay_65536_state` is updated to `ON` if the hardware confirms

This guarantees that Companion always displays the real status, even if the hardware state changes outside Companion.

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

### Quick Setup Example

**Creating a Relay Control Button**:
1. Create a new button in Companion
2. Set button style: Black background, white text
3. Add Action: "Relay Control" → Select relay → Set to "ON" 
4. Add Feedback: "Relay Status" → Select same relay
5. **Result**: Button turns red when relay is ON, black when OFF

**Creating a Toggle Button**:
1. Create a new button
2. Add Action: "Relay Toggle" → Select relay
3. Add Feedback: "Relay Status" → Select same relay
4. **Result**: One button to toggle AND see current status

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
