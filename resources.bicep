/**
 * resources.bicep – alle resources binnen de resource group.
 * Wordt aangeroepen vanuit main.bicep als module.
 */
param appName string
param location string

// ── Storage (Blob voor gage-entries en expense-entries) ───────────────────────
resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: 'st${uniqueString(resourceGroup().id)}'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// ── Azure AI Document Intelligence (voor bonnetjes scannen) ───────────────────
resource aiService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: 'ais-${appName}'
  location: location
  kind: 'FormRecognizer'
  sku: { name: 'F0' }
  properties: {
    customSubDomainName: 'ais-${appName}'
    publicNetworkAccess: 'Enabled'
  }
}

// ── Static Web App ────────────────────────────────────────────────────────────
resource swa 'Microsoft.Web/staticSites@2022-09-01' = {
  name: 'stapp-${appName}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

// ── Outputs (geen secrets – haal sleutels op via 'az' commands) ─────────────
output storageAccountName string = storage.name
output swaName string = swa.name
output swaUrl string = 'https://${swa.properties.defaultHostname}'
output aiServiceEndpoint string = aiService.properties.endpoint
