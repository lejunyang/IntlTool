import Baidu from '@opentranslate/baidu';
import Caiyun from '@opentranslate/caiyun';
import Google from '@opentranslate/google';
import Tencent from '@opentranslate/tencent';
import Youdao from '@opentranslate/youdao';
import { Language } from '@opentranslate/languages';
import { translate as BingTranslate } from 'bing-translate-api';
import { Translator } from '@opentranslate/translator';
import axios from 'axios';

axios.interceptors.request.use(
  config => {
    console.log('axios config', config);
  },
  error => {
    console.error('请求失败', error);
  }
);

const bingLangMap = {
  zh_CN: 'zh-Hans',
  en: 'en',
};

class Bing extends Translator {
  name = 'bing';

  getSupportLanguages(): Language[] {
    return ['zh-CN', 'en'];
  }

  async query(text: string, from: Language, to: Language) {
    const { translation } = await BingTranslate(text, bingLangMap[from], bingLangMap[to]);
    return {
      text,
      from,
      to,
      origin: {
        paragraphs: [text],
        tts: '',
      },
      trans: {
        paragraphs: [translation],
        tts: '',
      },
    };
  }
}

export { Language };

const translatorMap = {
  baidu: new Baidu(),
  caiyun: new Caiyun(),
  google: new Google(),
  tecent: new Tencent(),
  youdao: new Youdao(),
  bing: new Bing(),
};
export type TranslatorType = keyof typeof translatorMap;

export type TranslatorConfig<T extends TranslatorType> = typeof translatorMap[T]['config'];
export type TranslatorConfigMap = {
  [k in TranslatorType]: typeof translatorMap[k]['config'];
};

export async function translate<T extends TranslatorType>(param: {
  name: T;
  text: string;
  from: Language;
  to: Language;
  config?: TranslatorConfig<T>;
}) {
  const { name, text, from, to, config } = param;
  const translator = translatorMap[name];
  if (!translator) {
    console.error(`未知翻译源${name}`);
    return;
  }
  return translator.translate(text, from, to, config as any);
}

export type TranslateParam = Parameters<typeof translate>[0];

export const defaultTranslatorConfigMap = {
  bing: {},
  baidu: {
    appid: '',
    key: '',
  },
  caiyun: {
    token: '3975l6lr5pcbvidl6jl2 ',
  },
  google: {
    order: [],
    concurrent: false,
    apiAsFallback: true,
  },
  tecent: {
    secretId: '',
    secretKey: '',
  },
  youdao: {
    key: '',
    appKey: '',
  },
} as TranslatorConfigMap;
