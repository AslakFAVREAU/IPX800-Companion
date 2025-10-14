module.exports = function (self) {
	// Generate variables for each relay (1-32)
	const variables = []
	
	for (let i = 1; i <= 32; i++) {
		variables.push({
			variableId: `relay_${i}_state`,
			name: `Relay ${i} State`,
		})
	}
	
	// Add general variables
	variables.push(
		{ variableId: 'connection_status', name: 'Connection Status' },
		{ variableId: 'last_command', name: 'Last Command Sent' },
		{ variableId: 'ipx800_host', name: 'IPX800 Host IP' }
	)

	self.setVariableDefinitions(variables)
	
	// Set initial values
	self.setVariableValues({
		connection_status: 'Connected',
		ipx800_host: self.config.host || 'Not configured',
	})
}