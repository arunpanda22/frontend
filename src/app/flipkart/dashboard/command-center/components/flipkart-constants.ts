/**
 * flipkart-constants.ts: values shared by the Flipkart Campaign Summary components.
 *
 * CURRENCY_SYMBOL: Flipkart money is always rupees. The Flipkart components use this constant
 * instead of useCurrency().getCurrencySymbol(), which is tied to the Amazon marketplace currencies
 * (and falls back to "$"). The NUMBERS are still formatted with the shared useCurrency() formatters.
 */
export const CURRENCY_SYMBOL = "₹";

/**
 * Sentinel the backend sends for campaign_type / status when a campaign has report rows but no
 * CampaignName row yet. The UI hides it (shows "-" or a note) instead of printing it as data.
 */
export const UNKNOWN_VALUE = "UNKNOWN";