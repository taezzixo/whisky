// Wikidata (CC0): 위스키를 만드는 증류소와 좌표.
// "위스키 증류소(Q10373548)의 인스턴스" 또는 "생산품(P1056)이 위스키(Q281) 계열"인 항목.
import { getJson } from './http.mjs';
import { parseWikidata } from '../lib/normalize.mjs';

export const QUERY = `
SELECT ?d ?dLabel ?dLabelKo ?coord ?countryLabel WHERE {
  { ?d wdt:P31/wdt:P279* wd:Q10373548 . } UNION { ?d wdt:P1056/wdt:P279* wd:Q281 . }
  OPTIONAL { ?d wdt:P625 ?coord . }
  OPTIONAL { ?d wdt:P17 ?country . }
  OPTIONAL { ?d rdfs:label ?dLabelKo . FILTER(LANG(?dLabelKo) = "ko") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 5000`;

export async function fetchWikidata() {
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(QUERY)}`;
  const json = await getJson(url, { headers: { Accept: 'application/sparql-results+json' }, timeoutMs: 90000 });
  return parseWikidata(json);
}
