const fetch = require('node-fetch')
const { InstanceStatus } = require('@companion-module/base')

// IPX800 V5 API Documentation (format moderne):
// - URL: http://[IP]/api/core/io/[IO_NUMBER]?ApiKey=[API_KEY]
// - Method: PUT pour commandes
// - Content-Type: application/json
// - Body: {"on": true} pour ON, {"on": false} pour OFF, {"toggle": true} pour TOGGLE

module.exports = function (self) {
	// Vérification que self existe et a les méthodes nécessaires
	if (!self || typeof self.setActionDefinitions !== 'function') {
		console.error('Invalid self object passed to actions module')
		return
	}

	self.setActionDefinitions({
		relay_control: {
			name: 'Relay ON/OFF',
			options: [
				{
					type: 'number',
					label: 'Relay Number',
					id: 'relay',
					min: 1,
					max: 500000,
					default: 65536,
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
				// Vérification de la configuration
				if (!self.config || !self.config.host || !self.config.apiKey) {
					self.log('warn', 'Configuration manquante - impossible d\'envoyer la commande')
					return
				}

				const { relay, state } = event.options
				const url = `http://${self.config.host}/api/core/io/${relay}?ApiKey=${self.config.apiKey}`
				
				// Format IPX800 V5: {"on": true} pour ON, {"on": false} pour OFF
				const body = {
					on: state === 'on'
				}

				self.log('info', `Commande vers relais ${relay} → ${state.toUpperCase()}`)
				self.log('info', `URL: ${url}`)
				self.log('debug', `Body: ${JSON.stringify(body)}`)

				try {
					const res = await fetch(url, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(body)
					})
					self.log('debug', `Response status: ${res.status} ${res.statusText}`)
					
					if (!res.ok) {
						self.log('warn', `HTTP Error ${res.status}: ${res.statusText}`)
						const responseText = await res.text()
						self.log('debug', `Response body: ${responseText}`)
						throw new Error(`HTTP ${res.status}: ${res.statusText}`)
					}
					
					const data = await res.json()
					self.log('info', `Commande envoyée avec succès au relais ${relay}`)
					
					// Update variable if exists
					if (self.setVariableValues) {
						self.setVariableValues({
							[`relay_${relay}_state`]: state.toUpperCase(),
							last_command: `Relay ${relay} ${state.toUpperCase()}`
						})
					}
				} catch (err) {
					self.log('error', `Échec : ${err.message}`)
					self.updateStatus(InstanceStatus.ConnectionFailure, `Request failed: ${err.message}`)
					setTimeout(() => {
						self.updateStatus(InstanceStatus.Ok)
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
					max: 99999,
					default: 1,
				},
			],
			callback: async (event) => {
				// Vérification de la configuration
				if (!self.config || !self.config.host || !self.config.apiKey) {
					self.log('warn', 'Configuration manquante - impossible d\'envoyer la commande')
					return
				}

				const { relay } = event.options
				const url = `http://${self.config.host}/api/core/io/${relay}?ApiKey=${self.config.apiKey}`
				const body = {
					toggle: true
				}

				self.log('info', `Toggle relais ${relay}`)
				self.log('info', `URL: ${url}`)
				self.log('debug', `Body: ${JSON.stringify(body)}`)

				try {
					const res = await fetch(url, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(body)
					})
					self.log('debug', `Response status: ${res.status} ${res.statusText}`)
					
					if (!res.ok) {
						self.log('warn', `HTTP Error ${res.status}: ${res.statusText}`)
						const responseText = await res.text()
						self.log('debug', `Response body: ${responseText}`)
						throw new Error(`HTTP ${res.status}: ${res.statusText}`)
					}
					
					self.log('info', `Toggle envoyé avec succès au relais ${relay}`)
				} catch (err) {
					self.log('error', `Échec : ${err.message}`)
					self.updateStatus(InstanceStatus.ConnectionFailure, `Request failed: ${err.message}`)
					setTimeout(() => {
						self.updateStatus(InstanceStatus.Ok)
					}, 5000)
				}
			},
		},
		get_io_list: {
			name: 'Get IO List',
			options: [],
			callback: async (event) => {
				// Vérification de la configuration
				if (!self.config || !self.config.host || !self.config.apiKey) {
					self.log('warn', 'Configuration manquante - impossible de récupérer la liste des IO')
					return
				}

				// Test des endpoints IPX800 V5 modernes
				const testUrls = [
					`http://${self.config.host}/api/core/info?ApiKey=${self.config.apiKey}`,
					`http://${self.config.host}/api/core/io?ApiKey=${self.config.apiKey}`,
					`http://${self.config.host}/api/core/io/65536?ApiKey=${self.config.apiKey}`,
					`http://${self.config.host}/api/core/devices?ApiKey=${self.config.apiKey}`
				]

				for (const url of testUrls) {
					try {
						self.log('info', `Test: ${url}`)

						const res = await fetch(url, {
							method: 'GET'
						})
						
						self.log('info', `Status: ${res.status} ${res.statusText}`)
						
						if (res.ok) {
							const data = await res.text()
							self.log('info', `✅ SUCCÈS ! Endpoint fonctionnel`)
							self.log('info', `Response: ${data.substring(0, 500)}`)
							
							// Essayer de parser comme JSON
							try {
								const jsonData = JSON.parse(data)
								self.log('info', `Data parsed: ${JSON.stringify(jsonData, null, 2)}`)
							} catch (e) {
								self.log('debug', 'Response is not JSON')
							}
							return // Stop at first success
						} else {
							const responseText = await res.text()
							self.log('debug', `Failed: ${responseText.substring(0, 200)}`)
						}
						
					} catch (err) {
						self.log('error', `Error: ${err.message}`)
					}
				}
				
				self.log('error', 'Aucun endpoint n\'a fonctionné')
			},
		},
		test_relay_formats: {
			name: 'Test Relay ON/OFF Formats',
			options: [
				{
					type: 'number',
					label: 'Relay Number',
					id: 'relay',
					min: 1,
					max: 99999,
					default: 65536,
				},
			],
			callback: async (event) => {
				// Vérification de la configuration
				if (!self.config || !self.config.host || !self.config.apiKey) {
					self.log('warn', 'Configuration manquante - impossible de tester')
					return
				}

				const { relay } = event.options
				const url = `http://${self.config.host}/api/core/io/${relay}?ApiKey=${self.config.apiKey}`

				// Test de différents formats pour ON
				const testFormats = [
					{ name: 'Format 1: {"on": true}', body: { "on": true } },
					{ name: 'Format 2: {"state": "on"}', body: { "state": "on" } },
					{ name: 'Format 3: {"state": 1}', body: { "state": 1 } },
					{ name: 'Format 4: {"value": 1}', body: { "value": 1 } },
					{ name: 'Format 5: {"set": true}', body: { "set": true } },
					{ name: 'Format 6: {"enable": true}', body: { "enable": true } },
					{ name: 'Format 7: {"action": "on"}', body: { "action": "on" } },
					{ name: 'Format 8: true', body: true },
					{ name: 'Format 9: 1', body: 1 }
				]

				self.log('info', `=== Test des formats ON pour le relais ${relay} ===`)

				for (const format of testFormats) {
					try {
						self.log('info', `Test ${format.name}`)
						self.log('debug', `Body: ${JSON.stringify(format.body)}`)

						const res = await fetch(url, {
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify(format.body)
						})

						self.log('info', `${format.name}: ${res.status} ${res.statusText}`)

						if (res.ok) {
							const data = await res.text()
							self.log('info', `✅ ${format.name} - SUCCÈS ! Response: ${data}`)
						} else {
							const errorData = await res.text()
							self.log('debug', `❌ ${format.name} failed: ${errorData.substring(0, 100)}`)
						}

						// Petit délai entre les tests
						await new Promise(resolve => setTimeout(resolve, 500))

					} catch (err) {
						self.log('error', `${format.name} error: ${err.message}`)
					}
				}
			},
		},
		ping_test: {
			name: 'Ping Test (No Auth)',
			options: [],
			callback: async (event) => {
				// Vérification de la configuration
				if (!self.config || !self.config.host) {
					self.log('warn', 'IP manquante - impossible de tester la connectivité')
					return
				}

				// Test de connectivité de base (sans authentification)
				const basicUrls = [
					`http://${self.config.host}/`,
					`http://${self.config.host}/index.html`,
					`http://${self.config.host}/status`,
					`http://${self.config.host}/api`,
					`http://${self.config.host}/api/core`,
					`http://${self.config.host}/favicon.ico`
				]

				self.log('info', '=== Test de connectivité basique (sans auth) ===')
				
				for (const url of basicUrls) {
					try {
						self.log('info', `Testing: ${url}`)
						
						const res = await fetch(url, { 
							method: 'GET',
							timeout: 3000
						})
						
						self.log('info', `${url}: ${res.status} ${res.statusText}`)
						
						if (res.status === 200) {
							self.log('info', `✅ Device accessible`)
						} else if (res.status === 401 || res.status === 403) {
							self.log('info', `✅ Device accessible (mais auth requise)`)
						} else if (res.status === 404) {
							self.log('debug', `❌ Endpoint non trouvé`)
						}

					} catch (error) {
						self.log('debug', `❌ ${url}: ${error.message}`)
					}
				}
			},
		},
		api_test: {
			name: 'Test API Connection',
			options: [],
			callback: async (event) => {
				// Vérification de la configuration
				if (!self.config || !self.config.host || !self.config.apiKey) {
					self.log('warn', 'Configuration manquante - impossible de tester l\'API')
					return
				}

				// Test endpoints IPX800 V5 modernes avec ApiKey
				const modernEndpoints = [
					`http://${self.config.host}/api/core/info?ApiKey=${self.config.apiKey}`,
					`http://${self.config.host}/api/core/io?ApiKey=${self.config.apiKey}`,
					`http://${self.config.host}/api/core/devices?ApiKey=${self.config.apiKey}`,
					`http://${self.config.host}/api/core/io/65536?ApiKey=${self.config.apiKey}`
				]

				self.log('info', '=== Test des endpoints IPX800 V5 modernes ===')
				
				for (const url of modernEndpoints) {
					try {
						self.log('info', `Testing: ${url}`)
						
						const res = await fetch(url, { method: 'GET' })
						self.log('info', `Status: ${res.status} ${res.statusText}`)
						
						if (res.ok) {
							const data = await res.text()
							self.log('info', `✅ SUCCÈS ! Response: ${data.substring(0, 300)}`)
						} else if (res.status === 404) {
							self.log('debug', '❌ Endpoint non trouvé')
						} else if (res.status === 401) {
							self.log('warn', '❌ Authentification échouée (clé API incorrecte?)')
						} else if (res.status === 403) {
							self.log('warn', '❌ Accès interdit (permissions insuffisantes?)')
						} else {
							const errorText = await res.text()
							self.log('debug', `❌ Error: ${errorText.substring(0, 200)}`)
						}

					} catch (error) {
						self.log('debug', `❌ Network error: ${error.message}`)
					}
				}

				self.log('info', '=== Test de commande PUT ===')
				
				// Test d'une commande PUT avec JSON
				try {
					const testUrl = `http://${self.config.host}/api/core/io/65536?ApiKey=${self.config.apiKey}`
					const testBody = { toggle: true }
					
					self.log('info', `Test PUT: ${testUrl}`)
					self.log('info', `Body: ${JSON.stringify(testBody)}`)
					
					const res = await fetch(testUrl, { 
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(testBody)
					})
					
					self.log('info', `PUT Test: ${res.status} ${res.statusText}`)
					
					if (res.ok) {
						const data = await res.text()
						self.log('info', `✅ API PUT fonctionnelle ! Response: ${data}`)
					} else {
						const errorData = await res.text()
						self.log('info', `PUT failed: ${errorData}`)
					}
				} catch (error) {
					self.log('debug', `Test PUT failed: ${error.message}`)
				}
			},
		},
	})
}