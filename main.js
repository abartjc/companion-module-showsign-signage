const {
  InstanceBase,
  InstanceStatus,
  Regex,
  runEntrypoint,
  combineRgb,
} = require('@companion-module/base')

/**
 * ShowSign Companion module.
 *
 * Talks to the ShowSign automation API with an event-scoped automation key (Portal →
 * Event → Announcements → Automation keys). It polls /automation/context to keep the group
 * and cue dropdowns and the live-state feedback in sync, and fires cues via
 * /automation/announce and /automation/clear.
 */
class ShowSignInstance extends InstanceBase {
  async init(config) {
    this.config = config
    this.context = { event: null, groups: [], cues: [], active: [] }

    this.updateStatus(InstanceStatus.Connecting)
    this.defineAll()
    await this.poll()
    // Keep dropdowns + feedback fresh (groups/cues change in the portal; state changes live).
    this.pollTimer = setInterval(() => this.poll(), 4000)
  }

  async destroy() {
    if (this.pollTimer) clearInterval(this.pollTimer)
  }

  async configUpdated(config) {
    this.config = config
    await this.poll()
  }

  getConfigFields() {
    return [
      {
        type: 'static-text',
        id: 'info',
        width: 12,
        label: 'ShowSign',
        value:
          'Fire announcement cues to screen groups. Create an automation key in the ShowSign portal (Event → Announcements → Automation keys) and paste it below.',
      },
      {
        type: 'textinput',
        id: 'url',
        label: 'ShowSign API base URL',
        width: 12,
        default: 'https://portal.showsign.io/api',
        regex: Regex.SOMETHING,
      },
      {
        type: 'textinput',
        id: 'apikey',
        label: 'Automation key',
        width: 12,
        default: '',
        regex: Regex.SOMETHING,
      },
    ]
  }

  base() {
    return (this.config?.url || '').replace(/\/$/, '')
  }

  async api(path, options = {}) {
    const res = await fetch(`${this.base()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config?.apikey || ''}`,
        ...(options.headers || {}),
      },
    })
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  async poll() {
    if (!this.config?.url || !this.config?.apikey) {
      this.updateStatus(InstanceStatus.BadConfig, 'Set the URL and automation key')
      return
    }
    try {
      const ctx = await this.api('/automation/context')
      this.context = {
        event: ctx.event || null,
        groups: Array.isArray(ctx.groups) ? ctx.groups : [],
        cues: Array.isArray(ctx.cues) ? ctx.cues : [],
        active: Array.isArray(ctx.active) ? ctx.active : [],
      }
      this.updateStatus(InstanceStatus.Ok, this.context.event ? this.context.event.name : undefined)
      this.defineAll()
      this.updateVariableValues()
      this.checkFeedbacks('group_showing')
    } catch (e) {
      this.updateStatus(InstanceStatus.ConnectionFailure, String(e.message || e))
    }
  }

  groupChoices() {
    return this.context.groups.map((g) => ({ id: g.id, label: g.name }))
  }
  cueChoices() {
    return this.context.cues.map((c) => ({ id: c.id, label: c.label }))
  }

  defineAll() {
    this.setActionDefinitions({
      fire: {
        name: 'Fire cue on group',
        options: [
          { type: 'dropdown', id: 'group', label: 'Group', choices: this.groupChoices(), default: this.groupChoices()[0]?.id },
          { type: 'dropdown', id: 'cue', label: 'Cue', choices: this.cueChoices(), default: this.cueChoices()[0]?.id },
          { type: 'number', id: 'ttl', label: 'Auto-clear after (seconds, 0 = stay)', default: 0, min: 0, max: 86400 },
        ],
        callback: async (action) => {
          const body = { groupId: action.options.group, cueId: action.options.cue }
          const ttl = Number(action.options.ttl)
          if (ttl > 0) body.ttlSeconds = ttl
          try {
            await this.api('/automation/announce', { method: 'POST', body: JSON.stringify(body) })
            await this.poll()
          } catch (e) {
            this.log('error', `Fire failed: ${e.message || e}`)
          }
        },
      },
      clear: {
        name: 'Clear group',
        options: [
          { type: 'dropdown', id: 'group', label: 'Group', choices: this.groupChoices(), default: this.groupChoices()[0]?.id },
        ],
        callback: async (action) => {
          try {
            await this.api('/automation/clear', {
              method: 'POST',
              body: JSON.stringify({ groupId: action.options.group }),
            })
            await this.poll()
          } catch (e) {
            this.log('error', `Clear failed: ${e.message || e}`)
          }
        },
      },
    })

    this.setFeedbackDefinitions({
      group_showing: {
        type: 'boolean',
        name: 'Group is showing cue',
        description: 'Lights the button when the chosen group is currently showing the chosen cue.',
        defaultStyle: { bgcolor: combineRgb(253, 199, 25), color: combineRgb(0, 0, 0) },
        options: [
          { type: 'dropdown', id: 'group', label: 'Group', choices: this.groupChoices(), default: this.groupChoices()[0]?.id },
          { type: 'dropdown', id: 'cue', label: 'Cue', choices: this.cueChoices(), default: this.cueChoices()[0]?.id },
        ],
        callback: (feedback) => {
          const a = this.context.active.find((x) => x.groupId === feedback.options.group)
          return Boolean(a && a.cueId === feedback.options.cue)
        },
      },
    })

    this.setVariableDefinitions([
      { variableId: 'event_name', name: 'Event name' },
      ...this.context.groups.map((g) => ({
        variableId: `group_${g.id}_cue`,
        name: `Live cue — ${g.name}`,
      })),
    ])
  }

  updateVariableValues() {
    const values = { event_name: this.context.event?.name || '' }
    for (const g of this.context.groups) {
      const a = this.context.active.find((x) => x.groupId === g.id)
      values[`group_${g.id}_cue`] = a ? a.label || 'live' : ''
    }
    this.setVariableValues(values)
  }
}

runEntrypoint(ShowSignInstance, [])
