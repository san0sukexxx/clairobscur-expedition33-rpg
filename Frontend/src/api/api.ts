import { APIService } from "./APIService";

const u = new URL(window.location.href);
const apiBaseUrl = `${u.protocol}//${u.hostname}:8080/api/`;

export const api = new APIService(apiBaseUrl);