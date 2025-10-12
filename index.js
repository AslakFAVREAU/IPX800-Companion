const { InstanceBase, runEntrypoint } = require('@companion-module/base')
const fetch = require('node-fetch')

class IPX800Instance extends InstanceBase {
  async init(config) {
    try {
      this.config = config
      this.log('info', 'Initialisation du module IPX800...')
      this.updateStatus(this.STATUS_OK)

      this.setActionDefinitions({
        relay_control: {
          name: 'Relay ON/OFF',
          options: [
            {
              type: 'number',
              label: 'Relay Number',
              id: 'relay',
              min: 1,
              max: 32,
              default: 1
            },
            {
              type: 'dropdown',
              label: 'State',
              id: 'state',
              default: 'on',
              choices: [
                { id: 'on', label: 'ON' },
                { id: 'off', label: 'OFF' }
              ]
            }
          ],
          callback: async (event) => {
            const { relay, state } = event.options
            const value = state === 'on' ? 1 : 0
            const url = `http://${this.config.host}/api/xdevices.json?key=${this.config.apiKey}&SetR${relay}=${value}`

            this.log('info', `Commande vers relais ${relay} → ${state.toUpperCase()}`)
            this.log('debug', `URL : ${url}`)

            try {
              const res = await fetch(url)
              if (!res.ok) throw new Error('HTTP error')
              this.log('info', `Commande envoyée avec succès au relais ${relay}`)
            } catch (err) {
              this.log('error', `Échec : ${err.message}`)
              this.updateStatus(this.STATUS_ERROR, 'Request failed')
            }
          }
        }
      })

      this.log('info', 'Actions définies avec succès')
    } catch (err) {
      this.log('error', `Erreur dans init(): ${err.message}`)
      this.updateStatus(this.STATUS_ERROR, 'Init failed')
    }
  }

  getConfigFields() {
    this.log('info', 'Chargement des champs de configuration')
    return [
      {
        type: 'textinput',
        id: 'host',
        label: 'IP address of IPX800',
        default: '192.168.1.100',
        width: 6
      },
      {
        type: 'textinput',
        id: 'apiKey',
        label: 'API Key',
        default: '',
        width: 6
      }
    ]
  }

  async configUpdated(config) {
    this.config = config
    this.log('info', 'Configuration mise à jour')
  }
}

runEntrypoint(IPX800Instance)