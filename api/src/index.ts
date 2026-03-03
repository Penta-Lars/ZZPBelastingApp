/**
 * Entry-point voor Azure Functions v4.
 * Door te importeren worden alle app.http()-registraties uitgevoerd.
 */
import './functions/saveGageEntry';
import './functions/getGageEntries';
import './functions/getQuarterlyReport';
import './functions/saveExpenseEntry';
import './functions/getExpenseEntries';
import './functions/getBTWAangifte';
import './functions/getIBAangifte';
