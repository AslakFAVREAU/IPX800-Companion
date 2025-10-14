module.exports = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */
	function (context, props) {
		const result = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		// Migration pour s'assurer que les champs requis existent
		if (props.config) {
			let needsUpdate = false
			const config = { ...props.config }

			// Définir des valeurs par défaut si elles n'existent pas
			if (!config.host) {
				config.host = '192.168.1.100'
				needsUpdate = true
			}

			if (!config.apiKey) {
				config.apiKey = ''
				needsUpdate = true
			}

			if (needsUpdate) {
				result.updatedConfig = config
			}
		}

		return result
	},
]