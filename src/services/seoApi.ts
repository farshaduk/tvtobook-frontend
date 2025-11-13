import axios, { AxiosResponse } from 'axios';

const BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
  : 'http://dev.tvtobook.com/api';

const seoApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SeoMetaTagsDto {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  twitterCard?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  structuredData?: string;
  additionalMetaTags?: { [key: string]: string };
}

export interface GetSeoSettingRequest {
  pageType: string;
  pagePath?: string;
  entityId?: string;
}

export const seoApi = {
  getMetaTags: async (request: GetSeoSettingRequest): Promise<AxiosResponse<{ data: SeoMetaTagsDto; isSucceeded: boolean; message: string }>> => {
    return seoApiClient.post('/Seo/public/meta', request);
  },
};

export default seoApi;



