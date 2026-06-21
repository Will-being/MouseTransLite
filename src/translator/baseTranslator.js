class BaseTranslator {
  static async translate(text, sourceLang, targetLang, settings) {
    try {
      const res = await this.requestTranslate(text, sourceLang, targetLang, settings);
      return await this.wrapResponse(res, text, sourceLang, targetLang);
    } catch (error) {
      return null;
    }
  }

  static async requestTranslate(text, sourceLang, targetLang, settings) {
    throw new Error("requestTranslate must be implemented");
  }

  static async wrapResponse(res, text, sourceLang, targetLang) {
    throw new Error("wrapResponse must be implemented");
  }
}

export default BaseTranslator;
