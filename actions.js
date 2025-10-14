const fetch = require('node-fetch')

module.exports = function (self) {
	self.setActionDefinitions({
		relay_control: {
			name: 'Relay ON/OFF',
			options: [
				{
					type: 'number',
					label: 'Relay Number',
					id: 'relay',
					min: 1,
					max: 32,
					default: 1,
				},
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'on',
					choices: [
						{ id: 'on', label: 'ON' },
						{ id: 'off', label: 'OFF' },
					],
				},
			],
			callback: async (event) => {
				const { relay, state } = event.options
				const value = state === 'on' ? 1 : 0
				const url = `http://${self.config.host}/api/xdevices.json?key=${self.config.apiKey}&SetR${relay}=${value}`

				self.log('info', `Commande vers relais ${relay} → ${state.toUpperCase()}`)
				self.log('debug', `URL : ${url}`)

				try {
					const res = await fetch(url)
					if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
					
					const data = await res.json()
					self.log('info', `Commande envoyée avec succès au relais ${relay}`)
					
					// Update variable if exists
					self.setVariableValues({
						[`relay_${relay}_state`]: state.toUpperCase(),
					})
				} catch (err) {
					self.log('error', `Échec : ${err.message}`)
					self.updateStatus(self.InstanceStatus.ConnectionFailure, `Request failed: ${err.message}`)
					setTimeout(() => {
						self.updateStatus(self.InstanceStatus.Ok)
					}, 5000)
				}
			},
		},
		relay_toggle: {
			name: 'Relay Toggle',
			options: [
				{
					type: 'number',
					label: 'Relay Number',
					id: 'relay',
					min: 1,
					max: 32,
					default: 1,
				},
			],
			callback: async (event) => {
				const { relay } = event.options
				const url = `http://${self.config.host}/api/xdevices.json?key=${self.config.apiKey}&ToggleR${relay}=1`

				self.log('info', `Toggle relais ${relay}`)
				self.log('debug', `URL : ${url}`)

				try {
					const res = await fetch(url)
					if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
					
					self.log('info', `Toggle envoyé avec succès au relais ${relay}`)
				} catch (err) {
					self.log('error', `Échec : ${err.message}`)
					self.updateStatus(self.InstanceStatus.ConnectionFailure, `Request failed: ${err.message}`)
					setTimeout(() => {
						self.updateStatus(self.InstanceStatus.Ok)
					}, 5000)
				}
			},
		},
	})
}