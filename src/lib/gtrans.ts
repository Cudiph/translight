import { stringify } from "query-string";

// taken from https://cloud.google.com/translate/docs/languages
export const langId: { [key: string]: string; } = {
  "af": "Afrikaans",
  "sq": "Albanian",
  "am": "Amharic",
  "ar": "Arabic",
  "hy": "Armenian",
  "az": "Azerbaijani",
  "eu": "Basque",
  "be": "Belarusian",
  "bn": "Bengali",
  "bs": "Bosnian",
  "bg": "Bulgarian",
  "ca": "Catalan",
  "ceb": "Cebuano",
  "zh": "Chinese (Simplified)",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  "co": "Corsican",
  "hr": "Croatian",
  "cs": "Czech",
  "da": "Danish",
  "nl": "Dutch",
  "en": "English",
  "eo": "Esperanto",
  "et": "Estonian",
  "fi": "Finnish",
  "fr": "French",
  "fy": "Frisian",
  "gl": "Galician",
  "ka": "Georgian",
  "de": "German",
  "el": "Greek",
  "gu": "Gujarati",
  "ht": "CreoleHaitian",
  "ha": "Hausa",
  "haw": "Hawaiian",
  "iw": "Hebrew",
  "he": "Hebrew",
  "hi": "Hindi",
  "hmn": "Hmong",
  "hu": "Hungarian",
  "is": "Icelandic",
  "ig": "Igbo",
  "id": "Indonesian",
  "ga": "Irish",
  "it": "Italian",
  "ja": "Japanese",
  "jv": "Javanese",
  "kn": "Kannada",
  "kk": "Kazakh",
  "km": "Khmer",
  "rw": "Kinyarwanda",
  "ko": "Korean",
  "ku": "Kurdish",
  "ky": "Kyrgyz",
  "lo": "Lao",
  "la": "Latin",
  "lv": "Latvian",
  "lt": "Lithuanian",
  "lb": "Luxembourgish",
  "mk": "Macedonian",
  "mg": "Malagasy",
  "ms": "Malay",
  "ml": "Malayalam",
  "mt": "Maltese",
  "mi": "Maori",
  "mr": "Marathi",
  "mn": "Mongolian",
  "my": "Myanmar (Burmese)",
  "ne": "Nepali",
  "no": "Norwegian",
  "ny": "Nyanja (Chichewa)",
  "or": "Odia (Oriya)",
  "ps": "Pashto",
  "fa": "Persian",
  "pl": "Polish",
  "pt": "Portuguese (Portugal,Brazil)",
  "pa": "Punjabi",
  "ro": "Romanian",
  "ru": "Russian",
  "sm": "Samoan",
  "gd": "GaelicScots",
  "sr": "Serbian",
  "st": "Sesotho",
  "sn": "Shona",
  "sd": "Sindhi",
  "si": "Sinhala (Sinhalese)",
  "sk": "Slovak",
  "sl": "Slovenian",
  "so": "Somali",
  "es": "Spanish",
  "su": "Sundanese",
  "sw": "Swahili",
  "sv": "Swedish",
  "tl": "Tagalog (Filipino)",
  "tg": "Tajik",
  "ta": "Tamil",
  "tt": "Tatar",
  "te": "Telugu",
  "th": "Thai",
  "tr": "Turkish",
  "tk": "Turkmen",
  "uk": "Ukrainian",
  "ur": "Urdu",
  "ug": "Uyghur",
  "uz": "Uzbek",
  "vi": "Vietnamese",
  "cy": "Welsh",
  "xh": "Xhosa",
  "yi": "Yiddish",
  "yo": "Yoruba",
  "zu": "Zulu",
};

export type TransOptions = {
  from?: string;
  to: string;
  interfaceLang?: string;
  htmlTag?: boolean;
  resolve?: boolean;
  contents?: Array<'t' | 'at' | 'bd' | 'ex' | 'ld' | 'md' | 'qca' | 'rw' | 'rm' | 'ss'>,
};

type PartOfSpeechDefinition = {
  [key: string]: [{
    definition: string;
    example: string;
    synonyms: string[];
  }];
};

type PartOfSpeechTranslation = {
  [key: string]: [{
    word: string;
    translations: string[];
    frequency: string;
  }];
};

export interface ReadableFormat {
  translated?: string;
  sourceText?: string;
  from: string;
  altFrom: string;
  to: string;
  isCorrected?: boolean;
  corrected?: string;
  pronunciation?: string;
  destPronunciation?: string;
  definitions?: PartOfSpeechDefinition;
  translations?: PartOfSpeechTranslation;
  synonyms?: {
    [key: string]: string[][];
  };
  examples?: string[];
  related?: string[];
}

async function translate(text: string, options: TransOptions): Promise<ReadableFormat> {
  const {
    from = 'auto',
    to,
    interfaceLang = browser.i18n.getUILanguage() || 'en',
    htmlTag = true,
    resolve = true,
    contents = ['t', 'at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss'],
  } = options;

  const property = stringify({
    client: 'gtx',
    sl: from,
    tl: to,
    hl: interfaceLang,
    dt: contents,
    ie: 'UTF-8',
    oe: 'UTF-8',
    otf: 1,
    ssel: 0,
    tsel: 0,
    kc: 7,
    q: text,
  });

  const url = `https://translate.googleapis.com/translate_a/single?${property}`;

  const result = await fetch(url);

  const jsonRes = await result.json();

  // create return object
  let readable: ReadableFormat = {
    from: jsonRes[8] && jsonRes[8][3] || jsonRes[8][0] ? jsonRes[8][0][0] || jsonRes[8][3][0] || 'auto' : 'auto',
    altFrom: jsonRes[2],
    to: to,
  };

  // push translated and sourceText
  if (jsonRes[0]) {
    readable.translated = '';
    readable.sourceText = '';
    for (const iter of jsonRes[0]) {
      if (iter[0]) readable.translated += iter[0];
      if (iter[1]) readable.sourceText += iter[1];
      if (jsonRes[0][1] && jsonRes[0][1][3])
        readable.pronunciation = jsonRes[0][1][3] || '';
      if (jsonRes[0][1] && jsonRes[0][1][2])
        readable.destPronunciation = jsonRes[0][1][2];
    }
  }

  // change lang id to full lang name
  if (resolve) {
    if (readable.from in langId) readable.from = langId[readable.from];
    if (readable.altFrom in langId) readable.altFrom = langId[readable.altFrom];
    if (readable.to in langId) readable.to = langId[readable.to];
    else readable.to = langId['en'];
    // if user give lang id incorrectly, google will always translate to english

  } else if (!(readable.to in langId)) {
    readable.to = 'en';
  }

  // auto correct feature
  if (jsonRes[7] && jsonRes[7].length) {
    readable.isCorrected = true;
    readable.corrected = jsonRes[7][0] || jsonRes[7][1];
    if (!htmlTag) {
      // replace html tag with markdown format
      readable.corrected = readable.corrected?.replace(/(?:<b>|<\/b>)/g, '**').replace(/(?:<i>|<\/i>)/g, '*');
    }
  } else {
    readable.isCorrected = false;
  }

  const speechList = jsonRes[1];
  if (speechList) {
    for (let i = 0; i < speechList.length; i++) {
      speechList[i][2].forEach((elem: any[]) => {
        // A hypothesis according to a number in the json file not 100% accurate maybe 80% :)
        let freq: string;
        if (elem[3] > 0.05) {
          freq = 'common';
        } else if (elem[3] >= 0.0025) {
          freq = 'uncommon';
        } else {
          freq = 'rare';
        }

        // push to the readable object where synonymsList[i][0] is oneof :
        // "adjective" | "noun" | "verb"
        if (!readable.translations) readable.translations = {};

        if (!readable.translations[speechList[i][0]])
          readable.translations[speechList[i][0]] = [] as any;

        readable.translations[speechList[i][0]].push({
          word: elem[0],
          translations: elem[1],
          frequency: freq
        });

      });
    }
  }

  const synonyms = jsonRes[11];
  if (synonyms) {
    if (!readable.synonyms) readable.synonyms = {};

    synonyms.forEach((elem: any[]) => {
      const speechName = elem[0]; // "noun" etc.

      if (!readable.synonyms![speechName]) readable.synonyms![speechName] = [] as any;
      elem[1].forEach((el: any[]) => {
        readable.synonyms![speechName].push(el[0]);
      });
    });

  }


  // definitions & the examples
  if (jsonRes[12]) {
    if (!readable.definitions) readable.definitions = {};
    jsonRes[12].forEach((elem: any[]) => {
      let speechName = elem[0]; // "noun" etc.

      // in case if google give an empty string just add to others property
      if (!speechName) speechName = 'others';

      // create an empty list if doesn't exist
      if (!readable.definitions![speechName]) readable.definitions![speechName] = [] as any;

      // elem[1] is list of all synonyms which divided by metaId
      // let's just say "m_en_gbus0888500.013" is metaId
      elem[1].forEach((defList: string[]) => {
        const metaId = defList[1]; // "m_en_gbus0888500.013"
        let synonymsList: string[] = [];

        if (synonyms) synonyms.forEach((e: any[]) => {
          // e[0] is "verb" etc.
          if (speechName === e[0]) {
            let matching = 0;
            // e[1] is list of synonyms at iter[0] and metaId at iter[1]
            for (const iter of e[1]) {

              if (metaId === iter[1]) {
                synonymsList.push(...iter[0]);
                matching++;
              } else if (matching > 0) {
                // for efficiency when the metaId were the same and nothing more it'll break the loop
                break;
              }
            }

          }
        });

        readable.definitions![speechName].push({
          definition: defList[0],
          example: defList[2] || '',
          synonyms: synonymsList,
        });
      });
    });

  }

  // example sentences
  if (jsonRes[13]) readable.examples = jsonRes[13][0].map((elem: any) => {
    if (htmlTag) return elem[0];
    // replace html tag to markdown
    return elem[0].replace(/(?:<b>|<\/b>)/g, '**');
  });


  if (jsonRes[14] && jsonRes[14][0])
    readable.related = jsonRes[14][0];
  // appear when you translate v2/v3 word e.g. drunk

  return readable;
}

export default translate;

translate.validateLangId = (langCode: string): string | boolean => {
  if (typeof langCode !== 'string') return false;
  if (langCode in langId) return langId[langCode]; else return false;
};

translate.getTTSLink = (query: string, languageId: string): string => {
  const props = stringify({
    ie: 'UTF-8',
    tl: languageId,
    client: 'tw-ob',
    q: query
  });
  // limited to 200 character
  const url = `https://translate.google.com/translate_tts?${props}`;
  return url;
};

translate.getLangId = (langName: string): string => {
  for (const key in langId) {
    if (langName.toLowerCase() === langId[key].toLowerCase()) {
      return key;
    }
  }
};
