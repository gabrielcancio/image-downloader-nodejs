import axios from "axios";
import { join } from "path";
import { createWriteStream } from "fs";

// import responses from "./cache/data.mjs";


class ImageSearcher {
  #url;
  #pageRange;
  #token;
  #limit;

  constructor({ url, pageRange, token, limit }) {
    this.#pageRange = pageRange;
    this.#url = url;
    this.#limit = limit;
    this.#token = token;
  }

  // Pegar todas as paginas de registros de imagem
  async #getImages() {
    const requests = [];

    for(let page = this.#pageRange[0]; page <= this.#pageRange[1]; page++) {
      const request = axios.get(`${this.#url}&page=${page}`, {
        headers: {
          Authorization: this.#token
        }
      });

      requests.push(request);
    }
    
    // ORIGINAL
    const responses = await Promise.all(requests);

    const images = responses
        .map(response => response.data.photos)
        .reduce((acc, cur) => [...acc, ...cur], [])

    return images;
  }


  async #performDowloadRequest(url) {
    const response = axios({
      url,
      method: "GET",
      responseType: "stream"
    });
    
    return response;
  }

  #performWritingImage(response) {
    const imageName = response.config.url.split("/")[5];

    response.data.pipe(createWriteStream(join(process.cwd(), "images", imageName)));
  }

  async execute() {
    // Obter os registros de imagens e formata-los
    const images = await this.#getImages();

    // Pegar cada um dos registros e realizar o download
    const downloadRequests = images
      .slice(0, (this.#limit - 1))
      .map(image => this.#performDowloadRequest(image.src.original));

    const responses = await Promise.all(downloadRequests);

    // Salvar imagem na pasta indicada
    responses.forEach(this.#performWritingImage);
  }
}

const imageSearcher = new ImageSearcher({
  url: "https://api.pexels.com/v1/search?query=nature&size=medium&large&per_page=80",
  token: "563492ad6f91700001000001a0517b136ff645c6b87dc4bc443578ac", // 563492ad6f9170000100000102b808ae930c425a9fa3f1d86ef52531
  pageRange: [1, 13],
  limit: 1000
});

imageSearcher.execute();