targetScope = 'subscription'

param appName string = 'musici-belasting-app'
param location string = 'westeurope'

// ── Resource Group ────────────────────────────────────────────────────────────
resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: 'rg-${appName}'
  location: location
}

// ── Alle resources via module (vereist door Bicep: subscription-scope ≠ rg-scope) ──
module resources './resources.bicep' = {
  scope: rg
  name: 'resources-deployment'
  params: {
    appName: appName
    location: location
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────
output swaUrl string = resources.outputs.swaUrl
output storageAccountName string = resources.outputs.storageAccountName
output swaName string = resources.outputs.swaName
output aiServiceEndpoint string = resources.outputs.aiServiceEndpoint

