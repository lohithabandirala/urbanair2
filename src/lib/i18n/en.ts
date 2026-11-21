/**
 * English dictionary. This file is the single source of truth for the
 * dictionary shape: `hi.ts` must satisfy `typeof en`, and a unit test
 * verifies that both languages have the same keys and array lengths.
 */
export const en = {
  meta: {
    languageName: "English",
    htmlLang: "en",
  },
  app: {
    name: "Saaf Hawa",
    tagline: "Clear air guidance for your family",
    description:
      "Live air quality, a personalised day plan, indoor-air actions and a grounded assistant — built for winter smog.",
    skipToContent: "Skip to main content",
    liveData: "Live data",
    demoData: "Sample data",
  },
  nav: {
    label: "Sections",
    dashboard: "Air quality",
    plan: "Day plan",
    indoor: "Indoor air",
    impact: "Your impact",
    assistant: "Ask Aura",
    profile: "Profile",
  },
  common: {
    loading: "Loading…",
    refreshing: "Refreshing…",
    retry: "Try again",
    error: "Something went wrong",
    close: "Close",
    refresh: "Refresh",
    updated: "Updated",
    viewSources: "View sources",
    learnMore: "Learn more",
    optional: "optional",
    of: "of",
    yes: "Yes",
    no: "No",
    reset: "Reset",
    save: "Save",
    estimate: "Estimate",
    today: "Today",
    now: "Now",
    best: "Best",
    language: "Language",
    opensInNewTab: "opens in a new tab",
  },
  weather: {
    title: "Conditions",
    temperature: "Temperature",
    humidity: "Humidity",
    wind: "Wind",
  },
  location: {
    title: "Your location",
    label: "City or area",
    placeholder: "e.g. Delhi, Mumbai, Bengaluru",
    search: "Search",
    searching: "Searching…",
    useMyLocation: "Use my location",
    geolocating: "Finding your location…",
    results: "Matching places",
    noResults: "No matching place found. Try a nearby city.",
    error: "Could not look up that place. Check the spelling and try again.",
    permissionDenied:
      "Location permission was denied. Search for your city instead.",
    unavailable:
      "Your browser could not provide a location. Search for your city instead.",
    current: "Current location",
    defaultNote:
      "Showing Delhi by default. Choose your own city for local guidance.",
    selected: "Selected location",
    coordinates: "Coordinates",
    change: "Change location",
    close: "Close location search",
  },
  source: {
    live: "Live",
    cached: "Cached",
    sample: "Sample data",
    label: "Source",
    observed: "Observed",
    fetched: "Fetched",
    cpcb: "CPCB station network",
    waqi: "WAQI station network",
    openMeteo: "Open-Meteo / CAMS model",
    openWeather: "OpenWeatherMap",
    demo: "Built-in sample",
    modelledNote:
      "Modelled estimate for this area, not a single physical monitor.",
    cachedNote: "Showing the most recent cached reading while we refresh.",
    sampleNote:
      "Live providers were unreachable, so these are sample values. Do not use them for health decisions.",
    notes: {
      modelled:
        "Modelled estimate for this area, not a single physical monitor.",
      coConverted:
        "Carbon monoxide was converted from µg/m³ to mg/m³ to match CPCB breakpoints.",
      cpcbOfficial: "Official CPCB station data.",
      waqiUnvalidated:
        "WAQI data is unvalidated at publication time; the AQI is recalculated from concentrations.",
      cached: "Showing the most recent cached reading while we refresh.",
      sample:
        "Live providers were unreachable, so these are sample values. Do not use them for health decisions.",
      noHourly:
        "This provider does not supply an hourly forecast, so the day plan uses the current reading.",
    },
  },
  dashboard: {
    title: "Current air quality",
    subtitle:
      "CPCB National Air Quality Index, calculated from pollutant concentrations.",
    aqiLabel: "Air Quality Index",
    dominant: "Main pollutant",
    noData: "No usable reading",
    noDataDetail:
      "The provider did not return PM2.5 or PM10, which CPCB requires to calculate the index.",
    scale: "AQI scale",
    lastUpdated: "Last updated",
    readings: "Pollutant readings",
    tableCaption:
      "Current pollutant concentrations compared with CPCB and WHO reference levels",
    pollutant: "Pollutant",
    value: "Value",
    unit: "Unit",
    subIndex: "Sub-index",
    standard: "CPCB standard",
    who: "WHO guideline",
    status: "Status",
    aboveStandard: "Above CPCB standard",
    belowStandard: "Within CPCB standard",
    averaging: "Averaging",
    note: "Sub-indices are calculated in code from CPCB breakpoints; the highest sub-index becomes the AQI.",
    unavailable: "—",
    gaugeLabel: "Air quality index {aqi}, category {category}",
    gaugeUnknown: "Air quality index unavailable",
  },
  pollutants: {
    pm25: "PM2.5",
    pm10: "PM10",
    no2: "NO₂",
    so2: "SO₂",
    co: "CO",
    o3: "O₃",
    nh3: "NH₃",
    pm25Name: "Fine particles",
    pm10Name: "Coarse particles",
  },
  categories: {
    good: "Good",
    satisfactory: "Satisfactory",
    moderate: "Moderate",
    poor: "Poor",
    "very-poor": "Very Poor",
    severe: "Severe",
    unknown: "Unknown",
  },
  advice: {
    good: {
      headline: "Air quality is good today",
      detail:
        "Fine particles are low. It is a good day for normal outdoor activity and for airing out your home.",
      sensitive:
        "No special precautions are needed for sensitive groups, but anyone with severe symptoms should follow their doctor’s plan.",
      mask: "No mask needed outdoors.",
      actions: [
        "Open windows briefly to refresh indoor air.",
        "Walk, cycle or use public transport for short trips.",
        "Avoid burning leaves, waste or wood.",
      ],
    },
    satisfactory: {
      headline: "Air quality is acceptable today",
      detail:
        "Most people can enjoy usual outdoor activity. A few unusually sensitive people may notice mild irritation.",
      sensitive:
        "If you have asthma or a heart condition, keep your reliever inhaler nearby and reduce hard exertion outdoors.",
      mask: "A mask is not needed for most people.",
      actions: [
        "Keep outdoor exercise moderate if you feel any irritation.",
        "Air the home during the cleanest part of the day.",
        "Choose walking, cycling or public transport where practical.",
      ],
    },
    moderate: {
      headline: "Air quality is moderate — sensitive groups should take care",
      detail:
        "Prolonged exposure may cause mild breathing discomfort. Children, older adults and people with heart or lung conditions are more likely to feel it.",
      sensitive:
        "Sensitive groups should shorten outdoor exertion, avoid busy roads and keep windows closed during peak traffic.",
      mask: "Sensitive groups may wear an N95 outdoors.",
      actions: [
        "Move long or intense exercise indoors.",
        "Close windows facing busy roads and run a purifier if you have one.",
        "Avoid incense, candles and indoor burning today.",
      ],
    },
    poor: {
      headline: "Air quality is poor — breathing discomfort is likely",
      detail:
        "Most people may feel discomfort after prolonged exposure. This is a day to reduce time outdoors, especially near traffic.",
      sensitive:
        "Children, older adults, pregnant people and anyone with heart or lung disease should stay indoors where possible.",
      mask: "Wear a well-fitted N95 mask if you must go outdoors.",
      actions: [
        "Wear a fitted N95 outdoors and keep trips short.",
        "Keep windows closed and run a HEPA purifier in the room you use most.",
        "Skip outdoor exercise and move it indoors.",
        "Avoid candles, incense and mosquito coils.",
      ],
    },
    "very-poor": {
      headline: "Air quality is very poor — avoid outdoor activity",
      detail:
        "Prolonged exposure can cause respiratory illness. Everyone should avoid outdoor activity; sensitive groups are at serious risk.",
      sensitive:
        "Keep children, older adults, pregnant people and anyone with heart or lung disease indoors. Seek medical help for chest pain or breathlessness.",
      mask: "Wear an N95 for any unavoidable outdoor trip.",
      actions: [
        "Stay indoors with windows and doors closed.",
        "Run a purifier on a high setting in your main room.",
        "Postpone errands, school runs and outdoor work where possible.",
        "Seek medical advice if breathing becomes difficult.",
      ],
    },
    severe: {
      headline: "Severe smog — emergency-level air pollution",
      detail:
        "This is the most hazardous CPCB category. Everyone is at risk from prolonged exposure, and sensitive groups face serious health effects.",
      sensitive:
        "Keep everyone indoors. People with heart or lung conditions should have their medication nearby and seek urgent care for chest pain or severe breathlessness.",
      mask: "If you must go outside, wear a fitted N95 and keep the trip as short as possible.",
      actions: [
        "Do not exercise or work outdoors.",
        "Seal gaps around windows and doors; run purifiers continuously.",
        "Follow local government advisories and school/work closures.",
        "Check on neighbours who live alone or have young children.",
      ],
    },
    unknown: {
      headline: "Air quality reading unavailable",
      detail:
        "We could not calculate a CPCB index from the available pollutants. Treat the air as uncertain and check a local official advisory.",
      sensitive:
        "Sensitive groups should take the same precautions they would on a moderate day until a reading is available.",
      mask: "Keep an N95 handy if you are sensitive to pollution.",
      actions: [
        "Check an official CPCB or local authority reading.",
        "Prefer indoor activity until data returns.",
        "Keep windows closed if you can see or smell smoke.",
      ],
    },
  },
  adviceLabels: {
    sensitive: "Sensitive groups",
  },
  smogAlert: {
    title: "Severe smog alert",
    body: "Air quality has reached {category}. Keep children, older adults and anyone with heart or lung conditions indoors.",
  },
  plan: {
    title: "Your day’s plan",
    subtitle:
      "Built from the hourly forecast and your household profile. Times are local to your city.",
    bestWindow: "Best outdoor window",
    noBest: "No clearly cleaner window today",
    windows: {
      morning: "Morning",
      midday: "Midday",
      evening: "Evening",
    },
    timeRange: "{start}:00–{end}:00",
    verdicts: {
      recommended: "Good for outdoors",
      caution: "Shorten outdoor time",
      avoid: "Avoid outdoors",
    },
    headline: {
      good: "A good outdoor window is available today.",
      caution: "Outdoor time is possible, but keep it short.",
      avoid: "Best plan today: stay indoors where air is filtered.",
      noForecast: "No hourly forecast — plan around the current reading.",
    },
    notes: {
      goodOutdoor:
        "Forecast AQI around {aqi} — a reasonable window to be outside.",
      cautionOutdoor:
        "Forecast AQI around {aqi} — shorten outdoor time and take it easy.",
      avoidOutdoor:
        "Forecast AQI around {aqi} — keep outdoor activity to a minimum.",
      currentOnly:
        "No hourly forecast for this window; using the current reading.",
      carCommute:
        "Car commute: keep windows up, use recirculation and a cabin filter, and avoid the most congested route.",
      twoWheeler:
        "Two-wheeler: wear a well-fitted N95 and prefer routes away from heavy traffic.",
      publicTransport:
        "Public transport: wait away from the roadside and wear an N95 on polluted days.",
      walkCycle:
        "Walking or cycling: use quieter side streets and go during the cleanest window.",
      workFromHome:
        "Working from home removes a commute — the simplest exposure cut today.",
      biomassCooking:
        "Cooking with wood or biomass: switch to LPG or electric if you can, and never cook without ventilation.",
      keroseneCooking:
        "Kerosene cooking: ventilate the kitchen and consider a cleaner fuel; kerosene smoke is harmful indoors.",
      vulnerable:
        "Sensitive groups: children, older adults, pregnant people and anyone with heart or lung disease should stay indoors as much as possible.",
      vulnerableGood:
        "Sensitive groups can go outside, but keep an eye on symptoms.",
      exerciseGood:
        "Your outdoor exercise fits this window. Keep it moderate if you feel any irritation.",
      exerciseAvoid:
        "Move your workout indoors today; outdoor exercise raises your dose of particles.",
      noForecast:
        "Hourly forecast is unavailable. Use the current AQI and check again before going out.",
    },
    profileHint:
      "Change your travel, cooking and health details in the household profile to tailor this plan.",
    editProfile: "Edit household profile",
  },
  profile: {
    title: "Your household",
    subtitle:
      "Used to tailor the day plan and the assistant. Stored only in your browser.",
    commute: "How do you usually travel?",
    commuteOptions: {
      car: "Car",
      "two-wheeler": "Two-wheeler",
      "public-transport": "Bus or metro",
      "walk-cycle": "Walk or cycle",
      "work-from-home": "Work from home",
    },
    cooking: "What do you cook with?",
    cookingOptions: {
      lpg: "LPG or piped gas",
      electric: "Electric or induction",
      biomass: "Wood, coal or biomass",
      kerosene: "Kerosene",
    },
    vulnerable: "Who is in your household?",
    vulnerableOptions: {
      children: "Children under 5",
      elderly: "Adults over 65",
      pregnant: "Pregnancy",
      respiratory: "Heart or lung condition",
    },
    exercise: "Do you exercise outdoors?",
    exerciseYes: "Yes, regularly",
    exerciseNo: "No, rarely",
    saved: "Saved on this device.",
    privacy:
      "Your profile stays in this browser. Only anonymous settings needed for the plan are sent to the server.",
    reset: "Reset profile",
  },
  indoor: {
    title: "Indoor air checklist",
    subtitle: "Actions that reduce your exposure at home today.",
    progress: "{done} of {total} done",
    done: "Done",
    reset: "Reset checklist",
    priority: {
      essential: "Do this now",
      recommended: "Recommended",
      optional: "Optional",
    },
    items: {
      "no-smoking": {
        title: "Keep the home smoke-free",
        detail:
          "Tobacco smoke adds fine particles and is especially harmful to children. Smoke outside, never indoors.",
      },
      "clean-cooking": {
        title: "Cook with clean fuel",
        detail:
          "LPG, piped gas or electricity produce far less indoor smoke than wood, coal, dung or kerosene. Switch where possible.",
      },
      exhaust: {
        title: "Turn on the kitchen exhaust",
        detail:
          "Use a chimney or exhaust fan every time you cook, and keep a window slightly open while it runs.",
      },
      purifier: {
        title: "Run a HEPA air purifier",
        detail:
          "Place it in the room you use most, keep doors closed, and clean or replace filters as the manual says.",
      },
      "close-windows": {
        title: "Keep windows closed",
        detail:
          "Outdoor particles are high. Seal the room you use most and rely on filtered or recirculated air.",
      },
      ventilate: {
        title: "Air the home briefly",
        detail:
          "Outdoor air is relatively clean. Open opposite windows for 10–15 minutes to clear stale indoor air.",
      },
      "no-candles": {
        title: "Skip candles and incense",
        detail:
          "Candles, incense and mosquito coils produce fine particles indoors. Prefer electric alternatives today.",
      },
      "wet-dust": {
        title: "Dust with a damp cloth",
        detail:
          "Wet-mopping and damp dusting trap particles instead of stirring them back into the air.",
      },
      humidity: {
        title: "Keep humidity in check",
        detail:
          "Aim for roughly 30–50% relative humidity. Very damp air encourages mould; very dry air irritates airways.",
      },
      monitor: {
        title: "Use an indoor monitor if you have one",
        detail:
          "A low-cost PM2.5 monitor helps you check whether a room is actually clean. Treat readings as indicative.",
      },
    },
    sources: "Indoor guidance sources",
  },
  impact: {
    title: "Your impact",
    subtitle:
      "Compare an everyday trip with a cleaner alternative. These are indicative estimates, not a measurement of local AQI.",
    distance: "Distance per day (km)",
    days: "Days per week",
    currentMode: "Current mode",
    alternative: "Alternative",
    occupants: "People sharing the car",
    calculate: "Calculate impact",
    results: "Estimated impact",
    baseline: "Current choice",
    alternativeLabel: "Alternative",
    savings: "You save",
    increase: "This alternative emits more",
    co2Day: "CO₂ per day",
    co2Month: "CO₂ per month",
    pmDay: "PM2.5 per day",
    pmMonth: "PM2.5 per month",
    noxDay: "NOx per day",
    assumptionsTitle: "Assumptions and limits",
    assumptions: {
      indicative:
        "Emission factors are rounded, indicative values based on published fleet averages (see DEFRA conversion factors). Real emissions vary with fuel, age, speed and maintenance.",
      carpool:
        "For cars, emissions are divided by the number of occupants. Bus and metro factors are already per passenger.",
      grid:
        "Electric vehicles are assumed to charge on an average grid; the benefit grows as the grid gets cleaner.",
      notLocalAqi:
        "Avoided emissions do not instantly lower today’s local AQI. They reduce the pollution that builds up over time.",
    },
    modes: {
      petrolCar: "Petrol car",
      dieselCar: "Diesel car",
      cngCar: "CNG car",
      electricCar: "Electric car",
      twoWheeler: "Two-wheeler",
      bus: "Bus",
      metro: "Metro",
      walkCycle: "Walk or cycle",
    },
    disclaimer: "Estimates only — not a substitute for an emissions inventory.",
    zero: "0",
  },
  assistant: {
    title: "Ask Aura",
    subtitle:
      "A grounded assistant for air quality, health protection and cleaner routines.",
    placeholder:
      "Ask about today’s air, masks, windows, exercise or cleaner travel…",
    send: "Send question",
    sending: "Thinking…",
    clear: "Clear conversation",
    you: "You",
    aura: "Aura",
    error: "The assistant could not answer. Please try again.",
    retry: "Try again",
    disclaimer:
      "Aura uses the live reading above and published guidance. It does not diagnose illness or replace a doctor.",
    suggestions: [
      "Should I open the windows today?",
      "Is it safe to run outside?",
      "How do I protect my child from smog?",
      "What is the cleanest way to commute?",
    ],
    offlineNotice:
      "Gemini is not configured, so Aura is using a deterministic responder grounded in today’s reading and published guidance.",
    fallbackNotice:
      "Gemini could not be reached, so Aura answered with the deterministic responder grounded in today’s reading.",
    groundedIntro:
      "In {city}, the latest reading is AQI {aqi} ({category}), observed at {time}.",
    groundedNoReading:
      "I don’t have a usable AQI reading for {city} right now, so treat the air as uncertain and check a local official advisory.",
    grounded: {
      windowsOpen:
        "Outdoor air is relatively clean right now. Open opposite windows for 10–15 minutes to clear indoor air, then close them if you see or smell smoke.",
      windowsClosed:
        "Keep windows closed while the outdoor AQI is {category}. Run a purifier in the room you use most and seal gaps around doors.",
      maskNone:
        "A mask is not needed for most people at this level. If you are sensitive to pollution, keep an N95 handy.",
      maskSensitive:
        "Sensitive groups should wear a well-fitted N95 outdoors. Children under 5 should not wear one without supervision.",
      maskEveryone:
        "Wear a well-fitted N95 for any outdoor trip. It must seal around the nose and mouth to help.",
      exerciseOk:
        "Outdoor exercise is reasonable in the cleanest window today. Keep it moderate and stop if your chest tightens or you cough.",
      exerciseCaution:
        "Shorten outdoor exercise and avoid busy roads. An indoor workout gives you the same fitness benefit with a much lower particle dose.",
      exerciseAvoid:
        "Move exercise indoors today. At AQI {aqi}, hard breathing outdoors sharply raises the particles that reach your lungs.",
      sensitive:
        "Children, older adults, pregnant people and anyone with heart or lung disease should stay indoors as much as possible. Keep medication nearby and seek care for chest pain or breathlessness.",
      purifier:
        "Use a HEPA purifier in the room you use most, with doors and windows closed. Clean the pre-filter and replace the HEPA filter as the manual says.",
      cooking:
        "Avoid burning wood, coal, kerosene, candles or incense indoors. Use LPG or electricity where possible and run the kitchen exhaust every time you cook.",
      commute:
        "For your usual {mode} commute, follow the travel note in today’s plan. The cleanest option is to avoid the most congested route and the worst hour.",
      aqiExplain:
        "The AQI is calculated from pollutant concentrations using CPCB breakpoints. {dominant} is the main pollutant right now. The reading comes from {source} and was observed at {time}.",
      trees:
        "Trees and green cover help over years by cooling streets and intercepting some particles, but they do not clean today’s air quickly. Protect yourself now with the actions above.",
      scope:
        "I can help with air quality, masks, indoor air, exercise, travel and household exposure. I can’t help with unrelated requests.",
    },
    providerGemini: "Gemini",
    providerGrounded: "Grounded responder",
    providerGuard: "Safety guard",
    groundedOn: "Grounded on",
    charCount: "{count}/500",
    injectionBlocked:
      "I can only help with air quality, health protection and cleaner routines. I can’t follow instructions that try to change my rules.",
    empty: "Ask a question to get started.",
    thinking: "Aura is preparing an answer.",
    answerLabel: "Answer from Aura",
    errorFocus: "Assistant error",
  },
  share: {
    button: "Copy today’s plan",
    copied: "Plan copied to the clipboard.",
    failed: "Could not copy. Select the text below instead.",
    title: "Today’s plan",
    empty: "Wait for the air quality reading before sharing.",
  },
  footer: {
    about:
      "Saaf Hawa is an open, evidence-backed air quality assistant for families.",
    sources: "Data and guidance sources",
    privacy: "Privacy",
    privacyBody:
      "No accounts, no server-side profiles. Location and preferences stay in your browser; only coordinates are sent to fetch air quality.",
    disclaimer:
      "Not medical advice. Follow local health advisories and consult a clinician for symptoms.",
    builtWith:
      "Built with Next.js, TypeScript and deterministic CPCB calculations.",
    dataNote:
      "AQI is calculated from reported concentrations and may differ from an official station’s published index.",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    network: "Could not reach the server. Check your connection.",
    invalidInput: "That request was not valid.",
    upstream:
      "The air quality provider did not respond. Showing the best available data.",
    rateLimited: "Too many questions. Please wait a minute and try again.",
    notFound: "Not found.",
  },
};

/**
 * The dictionary shape. Deliberately not `as const`: translations are plain
 * strings, so `hi` can satisfy the same structure without literal-type
 * conflicts. Key parity is enforced by a unit test instead.
 */
export type Dictionary = typeof en;
