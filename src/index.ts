import * as core from '@actions/core';

const IPV4_ENDPOINTS = [
  { url: 'https://ipv4.icanhazip.com', json: false },
  { url: 'https://api.ipify.org', json: false },
  { url: 'https://api4.my-ip.io/v2/ip.json', json: true },
];

const IPV6_ENDPOINTS = [
  { url: 'https://ipv6.icanhazip.com', json: false },
  { url: 'https://api6.ipify.org', json: false },
  { url: 'https://api6.my-ip.io/v2/ip.json', json: true },
];

interface Endpoint {
  url: string;
  json: boolean;
}

async function fetchIP(endpoint: Endpoint): Promise<string> {
  const res = await fetch(endpoint.url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (endpoint.json) {
    const data = JSON.parse(text) as { ip?: string };
    if (!data.ip) throw new Error('No ip field in response');
    return data.ip.trim();
  }
  return text.trim();
}

async function resolveIP(endpoints: Endpoint[], label: string): Promise<string> {
  for (const endpoint of endpoints) {
    try {
      const ip = await fetchIP(endpoint);
      core.debug(`${label} resolved via ${endpoint.url}: ${ip}`);
      return ip;
    } catch (err) {
      core.debug(`${label} failed for ${endpoint.url}: ${(err as Error).message}`);
    }
  }
  return '';
}

async function run(): Promise<void> {
  try {
    const [ipv4, ipv6] = await Promise.all([
      resolveIP(IPV4_ENDPOINTS, 'IPv4'),
      resolveIP(IPV6_ENDPOINTS, 'IPv6'),
    ]);

    if (!ipv4) {
      core.setFailed('Could not determine public IPv4 address from any endpoint');
      return;
    }

    core.setOutput('ipv4', ipv4);
    core.setOutput('ipv6', ipv6);

    core.info(`Public IPv4: ${ipv4}`);
    if (ipv6) core.info(`Public IPv6: ${ipv6}`);
    else core.info('Public IPv6: not available');
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}

run();
