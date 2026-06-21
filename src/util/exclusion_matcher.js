import matchUrl from "match-url-wildcard";

export function isUrlExcluded(currentUrl, excludeList = [], onMatch) {
  for (const pattern of excludeList) {
    if (matchesExcludePattern(currentUrl, pattern)) {
      onMatch?.(pattern);
      return true;
    }
  }

  return false;
}

export function matchesExcludePattern(currentUrl, pattern) {
  const normalizedPattern = String(pattern || "").trim().toLowerCase();
  if (!normalizedPattern) {
    return false;
  }

  try {
    if (matchUrl(currentUrl, normalizedPattern)) {
      return true;
    }
  } catch (error) {
    // Fall through to the local matcher for patterns the dependency cannot parse.
  }

  let url;
  try {
    url = new URL(currentUrl);
  } catch (error) {
    return wildcardMatches(String(currentUrl || "").toLowerCase(), normalizedPattern);
  }

  const host = url.hostname.toLowerCase();
  const path = `${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const hostAndPath = `${host}${path}`;
  const urlWithoutProtocol = String(currentUrl).replace(/^\w+:\/\//, "").toLowerCase();
  const patternWithoutProtocol = normalizedPattern.replace(/^\w+:\/\//, "");

  if (!patternWithoutProtocol.includes("/")) {
    return matchesDomainPattern(host, patternWithoutProtocol);
  }

  return wildcardMatchesAny(
    [String(currentUrl).toLowerCase(), urlWithoutProtocol, hostAndPath],
    patternWithoutProtocol
  );
}

function matchesDomainPattern(host, pattern) {
  const domain = pattern.split("/")[0].split(":")[0];

  if (!domain) {
    return false;
  }

  if (domain.startsWith("*.")) {
    const suffix = domain.slice(2);
    return host === suffix || host.endsWith(`.${suffix}`);
  }

  if (domain.includes("*")) {
    return wildcardMatchesAny([host], domain);
  }

  return host === domain || host.endsWith(`.${domain}`);
}

function wildcardMatchesAny(candidates, pattern) {
  return candidates.some((candidate) => wildcardMatches(candidate, pattern)) ||
    (pattern.startsWith("*.") && candidates.some((candidate) => wildcardMatches(candidate, pattern.slice(2))));
}

function wildcardMatches(candidate, pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(candidate);
}
