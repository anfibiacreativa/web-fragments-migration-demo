import {
	renderToStream,
	type RenderToStreamOptions,
} from "@builder.io/qwik/server";
import { manifest } from "@qwik-client-manifest";
import Root from "./root";

export default function (opts: RenderToStreamOptions) {
	return renderToStream(<Root />, {
		manifest,
		...opts,
    base: "build",
		// needed for reframing/fragmenting
		containerTagName: "qwik-fragment",
    serverData: {
			...opts.serverData,
			url: "http://localhost:4208/qwik-page",
		},
		qwikLoader: {
			include: "always",
			position: "bottom",
		},

		// Use container attributes to set attributes on the html tag.
		containerAttributes: {
			lang: "en-us",
			...opts.containerAttributes,
		},
	});
}
