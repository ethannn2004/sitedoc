export interface DiagnosisResult {
  type: string;
  diagnosis: string;
  suggestedFix: string;
}

export function diagnoseFailure(
  errorCode: string | null,
  statusCode: number | null
): DiagnosisResult {
  // Network-level errors
  if (errorCode === "TIMEOUT" || errorCode === "UND_ERR_CONNECT_TIMEOUT") {
    return {
      type: "timeout",
      diagnosis: "Server is not responding in time.",
      suggestedFix:
        "Check server load, hosting status, or firewall rules. The server may be overloaded or unreachable.",
    };
  }

  if (errorCode === "DNS_ERROR" || errorCode === "ENOTFOUND") {
    return {
      type: "dns_error",
      diagnosis: "Domain may not be resolving properly.",
      suggestedFix:
        "Verify DNS records and nameserver configuration. The domain may have expired or DNS propagation may be in progress.",
    };
  }

  if (
    errorCode === "SSL_ERROR" ||
    errorCode === "CERT_HAS_EXPIRED" ||
    errorCode === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    errorCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  ) {
    return {
      type: "ssl_error",
      diagnosis: "SSL certificate may be invalid or expired.",
      suggestedFix:
        "Renew or reinstall the SSL certificate. Check certificate chain and ensure the certificate matches the domain.",
    };
  }

  if (
    errorCode === "ECONNREFUSED" ||
    errorCode === "CONNECTION_REFUSED"
  ) {
    return {
      type: "connection_refused",
      diagnosis: "Connection was actively refused by the server.",
      suggestedFix:
        "Check if the web server process is running. Verify the correct port is open and firewall rules allow connections.",
    };
  }

  if (errorCode === "ECONNRESET" || errorCode === "NETWORK_ERROR") {
    return {
      type: "connection_refused",
      diagnosis: "Network connection was interrupted.",
      suggestedFix:
        "Check server availability and network connectivity. The server may have reset the connection.",
    };
  }

  // HTTP status code errors
  if (statusCode && statusCode >= 500) {
    return {
      type: "server_error",
      diagnosis: `Server-side application error (HTTP ${statusCode}).`,
      suggestedFix:
        "Check server logs, deployment health, and backend services. The application may have crashed or encountered an internal error.",
    };
  }

  if (statusCode && statusCode >= 400) {
    return {
      type: "client_error",
      diagnosis: `The page or route may be misconfigured (HTTP ${statusCode}).`,
      suggestedFix:
        "Verify routing, access rules, and deployment paths. The resource may have been moved or access may be restricted.",
    };
  }

  return {
    type: "unknown",
    diagnosis: "An unknown error occurred while checking the site.",
    suggestedFix:
      "Investigate the server and hosting configuration manually. Check server logs for more details.",
  };
}
