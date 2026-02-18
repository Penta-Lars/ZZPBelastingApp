# Musici Belasting App - Azure Functions API

Backend API voor de ZZP Musici Belasting App gebouwd met Azure Functions.

## 📁 Bestandstructuur

```
api/
├── src/
│   ├── functions/
│   │   ├── saveGageEntry.ts       # POST /api/saveGageEntry
│   │   └── getQuarterlyReport.ts  # GET /api/getQuarterlyReport
│   ├── repositories/
│   │   ├── IGageRepository.ts     # Interface (Repository Pattern)
│   │   └── AzureStorageGageRepository.ts  # Azure Blob Storage implementatie
│   ├── utils/
│   │   └── quarterlyCalculator.ts # BTW-groepering & berekeningen
│   └── types/
│       └── index.ts               # Type exports
├── host.json                       # Azure Functions configuratie
├── package.json
└── tsconfig.json
```

## 🚀 Aan de slag

### Installatie

```bash
cd api
npm install
```

### Lokaal draaien

```bash
npm run watch  # TypeScript compile in watch mode
npm start      # Start Azure Functions emulator
```

De API draait op `http://localhost:7071/api/`

## 📡 API Endpoints

### POST `/api/saveGageEntry`

Slaagt een nieuwe gage/inkomsten-entry op.

**Headers:**
- `x-ms-client-principal-id`: User ID (van Entra ID via Static Web Apps)

**Body:**
```json
{
  "date": "2024-02-18",
  "description": "Optreden Concertgebouw",
  "category": "Optreden",
  "amountIncludingVAT": 500,
  "vatRate": "performance"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-id",
    "date": "2024-02-18",
    "description": "Optreden Concertgebouw",
    "category": "Optreden",
    "amount": {
      "amountIncludingVAT": 500,
      "amountExcludingVAT": 458.72,
      "vatAmount": 41.28,
      "vatRate": "performance"
    },
    "createdAt": "2024-02-18T10:00:00Z",
    "updatedAt": "2024-02-18T10:00:00Z"
  }
}
```

### GET `/api/getQuarterlyReport`

Haalt BTW-overzicht op per kwartaal.

**Query Parameters:**
- `quarter`: Q1, Q2, Q3, of Q4 (default: Q1)
- `year`: Jaar (default: huidig jaar)

**Headers:**
- `x-ms-client-principal-id`: User ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "quarter": "Q1",
    "year": 2024,
    "performanceTotal": {
      "amountIncludingVAT": 1500,
      "amountExcludingVAT": 1376.16,
      "vatAmount": 123.84,
      "vatRate": "performance"
    },
    "standardTotal": {
      "amountIncludingVAT": 1000,
      "amountExcludingVAT": 826.45,
      "vatAmount": 173.55,
      "vatRate": "standard"
    },
    "grandTotal": {
      "amountExcludingVAT": 2202.61,
      "totalVAT": 297.39,
      "amountIncludingVAT": 2500
    }
  }
}
```

## 🏗️ Architectuur

### Repository Pattern
De API abstraheert storage-implementatie d.m.v. `IGageRepository`:
- Huidige implementatie: **Azure Blob Storage**
- Toekomstige migratie naar SQL/Nextcloud zonder code-changes

### BTW Berekeningen
- **9%** BTW voor optredens/gages (`vatRate: 'performance'`)
- **21%** BTW voor overige diensten (`vatRate: 'standard'`)
- Backend berekent altijd: `amountExcludingVAT = amountIncludingVAT / (1 + vatRate)`

### Kwartaal-groepering
Entries worden per kwartaal gegroepeerd voor BTW-aangiftes:
- Q1: januari t/m maart
- Q2: april t/m juni
- Q3: juli t/m september
- Q4: oktober t/m december

## 🔐 Authenticatie

Alle endpoints vereisen authenticatie via **Entra ID** headers (Static Web Apps).
De user ID wordt automatisch uit de header `x-ms-client-principal-id` gehaald.

## 📦 Deployment

### Naar Azure

```bash
func azure functionapp publish <function-app-name>
```

Zorg dat volgende environment variables zijn ingesteld:
- `AzureWebJobsStorage`: Azure Storage connection string

## 🧪 Testing

```bash
npm test
```

## 📄 Licentie

MIT
