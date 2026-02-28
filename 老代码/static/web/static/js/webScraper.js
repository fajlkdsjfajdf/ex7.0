class WebScraper {
  constructor() {
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "text/html",
    };
  }

  async fetchUrl(url, options = {}) {
    const { method = "GET", headers: customHeaders = {}, body } = options;
    const fetchOptions = {
      headers: { ...this.headers, ...customHeaders },
      method,
      body,
    };

    try {
      const response = await fetch(url, fetchOptions);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType.includes("json")) {
          const json = await response.json();
          return json;
        } else if (contentType.includes("xml")) {
          // You can use an XML parser library to parse the XML response
          const xml = await response.text();
          return xml;
        } else {
          const html = await response.text();
          return html;
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  }
}