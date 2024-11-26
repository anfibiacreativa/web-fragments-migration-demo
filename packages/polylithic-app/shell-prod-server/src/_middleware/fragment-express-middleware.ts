import type {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { FragmentConfig, FragmentGateway } from "web-fragments/gateway";
// import trumpet from "@gofunky/trumpet";
import { Readable as NodeReadableStream } from "node:stream";

const fragmentHostInitialization = ({
  fragmentId,
  content,
  classNames,
}: {
  fragmentId: string;
  content: string;
  classNames: string;
}) => `
<fragment-host class="${classNames}" fragment-id="${fragmentId}" data-piercing="true">
  <template shadowrootmode="open">${content}</template>
</fragment-host>`;

export type FragmentMiddlewareOptions = {
  additionalHeaders?: HeadersInit;
  mode?: "production" | "development";
};

type ExpressMiddleware = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction,
) => void;

export function getMiddleware(
  gateway: FragmentGateway,
  options: FragmentMiddlewareOptions = {},
): ExpressMiddleware {
  const { additionalHeaders = {}, mode = "development" } = options;

  return async (
    request: ExpressRequest,
    response: ExpressResponse,
    next: NextFunction,
  ) => {
    console.log("[Debug] Request URL: ", request.url);
    const fragmentUrlToMatch = new URL("http://foo.bar" + request.url);
    const matchedFragment = gateway.matchRequestToFragment(
      fragmentUrlToMatch.origin,
    );

    if (!matchedFragment) {
      return next();
    }

    const fetchDest = request.headers["sec-fetch-dest"];

    if (fetchDest === "iframe") {
      handleIframeRequest(response);
      return;
    } else if (fetchDest === "document") {
      await handleDocumentRequest(request, response, matchedFragment, next);
      return;
    } else {
      await handleFragmentFetch(request, response, matchedFragment);
      return;
    }
  };

  function handleIframeRequest(response: ExpressResponse) {
    response.setHeader("content-type", "text/html");
    response.end("<!doctype html><title>");
  }

  async function handleDocumentRequest(
    request: ExpressRequest,
    response: ExpressResponse,
    matchedFragment: FragmentConfig,
    next: NextFunction,
  ) {
    const interceptResponse = interceptResponseLogging(response);

    // Allow underlying middleware or static files to serve the document
    next();

    // No additional logic here as the document request handling
    // would include fragment injection or other custom handling upstream.
  }

  async function handleFragmentFetch(
    request: ExpressRequest,
    response: ExpressResponse,
    matchedFragment: FragmentConfig,
  ) {
    try {
      const fragmentResponse = await fetchFragment(
        new Request(request.url, {
          method: request.method,
          headers: new Headers(request.headers as Record<string, string>),
          body:
            request.method !== "GET" && request.method !== "HEAD"
              ? JSON.stringify(request.body)
              : undefined,
        }),
        matchedFragment,
      );

      response.status(fragmentResponse.status);
      fragmentResponse.headers.forEach((value, name) => {
        response.setHeader(name, value);
      });

      if (fragmentResponse.body) {
        NodeReadableStream.fromWeb(fragmentResponse.body as any).pipe(response);
      } else {
        response.end();
      }
    } catch (error) {
      console.error("Error fetching fragment:", error);
      response.status(500).send("Internal Server Error");
    }
  }

  async function fetchFragment(request: Request, fragmentConfig: FragmentConfig) {
    const { upstream } = fragmentConfig;
    const upstreamUrl = new URL(upstream);

    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(", "));
      }
    });
    console.log('[Debug Upstream Url]:', upstreamUrl.origin)
    const fragmentReq = new Request(upstreamUrl.origin, {
      method: request.method,
      headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? JSON.stringify(request.body)
          : undefined,
    });

    for (const [name, value] of Object.entries(additionalHeaders)) {
      if (typeof value === "string") {
        fragmentReq.headers.set(name, value);
      }
    }

    fragmentReq.headers.set("sec-fetch-dest", "empty");
    fragmentReq.headers.set("x-fragment-mode", "embedded");

    if (mode === "development") {
      fragmentReq.headers.set("Accept-Encoding", "gzip");
    }

    return fetch(fragmentReq);
  }

  function interceptResponseLogging(response: ExpressResponse) {
    const originalWrite = response.write.bind(response);
    const originalEnd = response.end.bind(response);
    const originalSendFile = response.sendFile?.bind(response);

    response.write = function (chunk: any, ...args: any[]) {
      console.log("Intercept write:", chunk, ...args);
      return originalWrite(chunk, ...args);
    };

    response.end = function (chunk?: any, ...args: any[]) {
      console.log("Intercept end:", chunk, ...args);
      return originalEnd(chunk, ...args);
    };

    if (originalSendFile) {
      response.sendFile = function (
        path: string,
        options?: any,
        callback?: (err: Error) => void
      ) {
        console.log("Intercept sendFile:", path, options);
        return originalSendFile.call(response, path, options, callback);
      };
    }

    return response;
  }

}
