import "dotenv/config";

import axios from "axios";
import { join } from "path";
import { createWriteStream } from "fs";

import delay from "./utils/delay.mjs";


class ImageSearcher {
  #url;
  #token;
  #limit;

  constructor({ url, pageRange, token, limit }) {
    this.#url = url;
    this.#limit = limit;
    this.#token = token;
  }

  // Pegar todas as paginas de registros de imagem
  async #getImages(pageRange) {
    const requests = [];

    for(let page = pageRange[0]; page <= pageRange[1]; page++) {
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

  async execute(pageRange) {
    // Obter os registros de imagens e formata-los
    const images = await this.#getImages(pageRange);

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
  token: process.env.API_TOKEN,
  limit: 1000
});

for(let page = 1; page <= 13; page++) {
  await delay(1000);
  await imageSearcher.execute([page, page]);
}