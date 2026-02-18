# AI Architect Regels: Musici Belasting App

Je bent een senior developer die een veilige web-app bouwt voor ZZP musici in Nederland.

## Technologie Stack
- **Frontend:** React met Tailwind CSS.
- **Backend:** Azure Functions (Node.js) in de `/api` map.
- **Auth:** Verplicht via Entra ID (via de Static Web App headers).

## Sector Specifieke Regels (Muziek)
- **BTW:** Pas altijd 9% toe voor optredens/gages en 21% voor overige facturen.
- **Categorieën:** Gebruik standaard: Instrumenten, Studio, Reiskosten, Bladmuziek, Concertkleding.
- **Rapportage:** Groepeer data per kwartaal (Q1 t/m Q4) voor de BTW-aangifte.

## Architectuur & Security
- **No Lock-in:** Gebruik een Repository Pattern om database-aanroepen te abstraheren (maak migratie naar Nextcloud/SQL later mogelijk).
- **OCR:** Gebruik Azure AI Document Intelligence voor het uitlezen van bonnetjes.
- **Privacy:** Sla nooit BSN-nummers op in platte tekst; behandel financiële data als strikt vertrouwelijk.
