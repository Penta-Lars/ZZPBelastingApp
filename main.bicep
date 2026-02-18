targetScope = 'subscription'

param appName string = 'musici-belasting-app'
param location string = 'westeurope'

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: 'rg-${appName}'
  location: location
}

// De Static Web App (Frontend + API)
module swa 'br/public:avm/res/web/static-site:0.3.0' = {
  scope: rg
  name: 'swa-deployment'
  params: {
    name: 'stapp-${appName}'
    location: location
    sku: 'Free'
  }
}

// Azure AI Document Intelligence (voor bonnetjes scannen)
resource aiService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  scope: rg
  name: 'ais-${appName}'
  location: location
  kind: 'FormRecognizer'
  sku: { name: 'F0' }
  properties: {
    customSubDomainName: 'ais-${appName}'
  }
}

// Storage voor de bonnetjes (PDF/JPG)
resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  scope: rg
  name: 'st${uniqueString(rg.id)}'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}
