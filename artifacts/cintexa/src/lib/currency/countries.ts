/**
 * ISO 3166-1 alpha-2 country → ISO 4217 currency (as of 2026: Bulgaria and Croatia use the euro,
 * Sierra Leone the new leone SLE, Zimbabwe ZiG). Used to pick a user's display currency.
 */
const PAIRS = `
AD EUR,AE AED,AF AFN,AG XCD,AI XCD,AL ALL,AM AMD,AO AOA,AR ARS,AS USD,AT EUR,AU AUD,AW AWG,AX EUR,AZ AZN,
BA BAM,BB BBD,BD BDT,BE EUR,BF XOF,BG EUR,BH BHD,BI BIF,BJ XOF,BL EUR,BM BMD,BN BND,BO BOB,BQ USD,BR BRL,
BS BSD,BT BTN,BV NOK,BW BWP,BY BYN,BZ BZD,CA CAD,CC AUD,CD CDF,CF XAF,CG XAF,CH CHF,CI XOF,CK NZD,CL CLP,
CM XAF,CN CNY,CO COP,CR CRC,CU CUP,CV CVE,CW ANG,CX AUD,CY EUR,CZ CZK,DE EUR,DJ DJF,DK DKK,DM XCD,DO DOP,
DZ DZD,EC USD,EE EUR,EG EGP,EH MAD,ER ERN,ES EUR,ET ETB,FI EUR,FJ FJD,FK FKP,FM USD,FO DKK,FR EUR,GA XAF,
GB GBP,GD XCD,GE GEL,GF EUR,GG GBP,GH GHS,GI GIP,GL DKK,GM GMD,GN GNF,GP EUR,GQ XAF,GR EUR,GS GBP,GT GTQ,
GU USD,GW XOF,GY GYD,HK HKD,HM AUD,HN HNL,HR EUR,HT HTG,HU HUF,ID IDR,IE EUR,IL ILS,IM GBP,IN INR,IO USD,
IQ IQD,IR IRR,IS ISK,IT EUR,JE GBP,JM JMD,JO JOD,JP JPY,KE KES,KG KGS,KH KHR,KI AUD,KM KMF,KN XCD,KP KPW,
KR KRW,KW KWD,KY KYD,KZ KZT,LA LAK,LB LBP,LC XCD,LI CHF,LK LKR,LR LRD,LS LSL,LT EUR,LU EUR,LV EUR,LY LYD,
MA MAD,MC EUR,MD MDL,ME EUR,MF EUR,MG MGA,MH USD,MK MKD,ML XOF,MM MMK,MN MNT,MO MOP,MP USD,MQ EUR,MR MRU,
MS XCD,MT EUR,MU MUR,MV MVR,MW MWK,MX MXN,MY MYR,MZ MZN,NA NAD,NC XPF,NE XOF,NF AUD,NG NGN,NI NIO,NL EUR,
NO NOK,NP NPR,NR AUD,NU NZD,NZ NZD,OM OMR,PA PAB,PE PEN,PF XPF,PG PGK,PH PHP,PK PKR,PL PLN,PM EUR,PN NZD,
PR USD,PS ILS,PT EUR,PW USD,PY PYG,QA QAR,RE EUR,RO RON,RS RSD,RU RUB,RW RWF,SA SAR,SB SBD,SC SCR,SD SDG,
SE SEK,SG SGD,SH SHP,SI EUR,SJ NOK,SK EUR,SL SLE,SM EUR,SN XOF,SO SOS,SR SRD,SS SSP,ST STN,SV USD,SX ANG,
SY SYP,SZ SZL,TC USD,TD XAF,TF EUR,TG XOF,TH THB,TJ TJS,TK NZD,TL USD,TM TMT,TN TND,TO TOP,TR TRY,TT TTD,
TV AUD,TW TWD,TZ TZS,UA UAH,UG UGX,UM USD,US USD,UY UYU,UZ UZS,VA EUR,VC XCD,VE VES,VG USD,VI USD,VN VND,
VU VUV,WF XPF,WS WST,XK EUR,YE YER,YT EUR,ZA ZAR,ZM ZMW,ZW ZWG
`;

export const COUNTRY_CURRENCY: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    PAIRS.split(",")
      .map((p) => p.trim().split(/\s+/))
      .filter((p): p is [string, string] => p.length === 2 && p[0]!.length === 2 && p[1]!.length === 3),
  ),
);

/** Last-resort country guess from an IANA time zone (only used when the network lookup fails). */
export const TIMEZONE_COUNTRY: Readonly<Record<string, string>> = Object.freeze({
  "Africa/Accra": "GH", "Africa/Lagos": "NG", "Africa/Nairobi": "KE", "Africa/Johannesburg": "ZA",
  "Africa/Abidjan": "CI", "Africa/Cairo": "EG", "Africa/Addis_Ababa": "ET", "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala": "UG", "Africa/Casablanca": "MA", "Africa/Dakar": "SN", "Africa/Kigali": "RW",
  "Africa/Lusaka": "ZM", "Africa/Harare": "ZW", "Africa/Maputo": "MZ", "Africa/Luanda": "AO",
  "Africa/Tunis": "TN", "Africa/Algiers": "DZ", "Africa/Douala": "CM", "Africa/Lome": "TG",
  "Europe/London": "GB", "Europe/Dublin": "IE", "Europe/Paris": "FR", "Europe/Berlin": "DE",
  "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL", "Europe/Lisbon": "PT",
  "Europe/Zurich": "CH", "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Warsaw": "PL",
  "Europe/Istanbul": "TR", "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Toronto": "CA", "America/Vancouver": "CA",
  "America/Mexico_City": "MX", "America/Sao_Paulo": "BR", "America/Argentina/Buenos_Aires": "AR",
  "America/Bogota": "CO", "America/Lima": "PE", "America/Santiago": "CL", "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA", "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD", "Asia/Singapore": "SG", "Asia/Kuala_Lumpur": "MY", "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID", "Asia/Manila": "PH", "Asia/Ho_Chi_Minh": "VN", "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK", "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU", "Australia/Perth": "AU", "Pacific/Auckland": "NZ",
});

/** Currencies offered in the Settings picker (the rest are still auto-detected correctly). */
export const COMMON_CURRENCIES = [
  "GHS", "NGN", "KES", "ZAR", "XOF", "XAF", "EGP", "TZS", "UGX", "RWF", "ZMW", "MAD",
  "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "AED", "SAR", "INR", "PKR", "BDT",
  "CNY", "JPY", "KRW", "SGD", "MYR", "THB", "IDR", "PHP", "VND", "TRY", "BRL", "MXN",
  "ARS", "COP", "CLP", "PEN",
] as const;
